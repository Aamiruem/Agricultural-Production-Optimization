# Container platform: ECR repositories, an ECS Fargate cluster, one service per
# container, and an Application Load Balancer routing by path:
#   /api/*  -> api (FastAPI)      /farm-api/*, /socket.io/* -> farm-service (Node)
#   /*      -> web (Next.js)      worker (Celery) has no inbound traffic

locals {
  apps = {
    api          = { port = 8000, cpu = 512, memory = 1024, health = "/api/health", public = true }
    worker       = { port = 0, cpu = 512, memory = 2048, health = "", public = false }
    farm-service = { port = 4000, cpu = 256, memory = 512, health = "/health", public = true }
    web          = { port = 3000, cpu = 256, memory = 512, health = "/", public = true }
  }
  public_apps = { for k, v in local.apps : k => v if v.public }

  python_env = {
    ENVIRONMENT        = "production"
    AUTO_CREATE_TABLES = "false"
    CORS_ORIGINS       = var.site_url
    REDIS_URL          = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379/0"
  }
  env = {
    api    = local.python_env
    worker = local.python_env
    farm-service = {
      NODE_ENV           = "production"
      CORS_ORIGINS       = var.site_url
      AGRI_API_URL       = "${var.site_url}/api"
      AWS_REGION         = var.aws_region
      S3_BUCKET          = aws_s3_bucket.photos.bucket
      S3_PUBLIC_BASE_URL = "https://${aws_cloudfront_distribution.photos.domain_name}"
    }
    web = { API_URL = "${var.site_url}/api" }
  }
  python_secrets = concat(["JWT_SECRET", "DATABASE_URL"], local.has_anthropic_key ? ["ANTHROPIC_API_KEY"] : [])
  app_secrets = {
    api          = local.python_secrets
    worker       = local.python_secrets
    farm-service = ["JWT_SECRET", "MONGODB_URI"]
    web          = []
  }
}

resource "aws_ecr_repository" "app" {
  for_each             = local.apps
  name                 = "${var.project}-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = false
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each   = aws_ecr_repository.app
  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the last 20 images"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 20 }
      action       = { type = "expire" }
    }]
  })
}

resource "aws_ecs_cluster" "main" {
  name = var.project
  setting {
    name  = "containerInsights"
    value = "enabled" # CloudWatch metrics per service/task
  }
}

resource "aws_cloudwatch_log_group" "app" {
  for_each          = local.apps
  name              = "/ecs/${var.project}/${each.key}"
  retention_in_days = 30
}

# ------------------------------------------------------------------- IAM
data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Execution role: pull images, write logs, read secrets at task start.
resource "aws_iam_role" "execution" {
  name               = "${var.project}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = [for s in aws_secretsmanager_secret.app : s.arn]
    }]
  })
}

# Task role for the farm-service: may only write photos under fields/.
resource "aws_iam_role" "farm_task" {
  name               = "${var.project}-farm-service-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy" "farm_task_s3" {
  role = aws_iam_role.farm_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject"]
      Resource = "${aws_s3_bucket.photos.arn}/fields/*"
    }]
  })
}

# --------------------------------------------------------- load balancer
resource "aws_lb" "main" {
  name               = var.project
  load_balancer_type = "application"
  subnets            = module.vpc.public_subnets
  security_groups    = [aws_security_group.alb.id]
  idle_timeout       = 300 # long-lived SSE / WebSocket connections
}

resource "aws_lb_target_group" "app" {
  for_each    = local.public_apps
  name        = "${var.project}-${each.key}"
  port        = each.value.port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = module.vpc.vpc_id

  health_check {
    path                = each.value.health
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
  }

  # Socket.IO falls back to polling, which needs sticky sessions.
  stickiness {
    type    = "lb_cookie"
    enabled = each.key == "farm-service"
  }
}

locals {
  https = var.certificate_arn != ""
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  dynamic "default_action" {
    for_each = local.https ? [1] : []
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
  dynamic "default_action" {
    for_each = local.https ? [] : [1]
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.app["web"].arn
    }
  }
}

resource "aws_lb_listener" "https" {
  count             = local.https ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app["web"].arn
  }
}

locals {
  listener_arn = local.https ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn
  routes = {
    api          = { priority = 10, paths = ["/api/*"] }
    farm-service = { priority = 20, paths = ["/farm-api/*", "/socket.io/*"] }
  }
}

resource "aws_lb_listener_rule" "app" {
  for_each     = local.routes
  listener_arn = local.listener_arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app[each.key].arn
  }
  condition {
    path_pattern { values = each.value.paths }
  }
}

# ---------------------------------------------------------------- services
resource "aws_ecs_task_definition" "app" {
  for_each                 = local.apps
  family                   = "${var.project}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = each.key == "farm-service" ? aws_iam_role.farm_task.arn : null

  container_definitions = jsonencode([{
    name         = each.key
    image        = "${aws_ecr_repository.app[each.key].repository_url}:latest"
    essential    = true
    portMappings = each.value.port > 0 ? [{ containerPort = each.value.port }] : []
    environment  = [for k, v in local.env[each.key] : { name = k, value = v }]
    secrets = [for name in local.app_secrets[each.key] : {
      name      = name
      valueFrom = aws_secretsmanager_secret.app[name].arn
    }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app[each.key].name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = each.key
      }
    }
  }])
}

resource "aws_ecs_service" "app" {
  for_each        = local.apps
  name            = "${var.project}-${each.key}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app[each.key].arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.tasks.id]
  }

  dynamic "load_balancer" {
    for_each = each.value.public ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.app[each.key].arn
      container_name   = each.key
      container_port   = each.value.port
    }
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true # failed deployments roll back automatically
  }

  # GitHub Actions rolls out new images with --force-new-deployment.
  lifecycle {
    ignore_changes = [desired_count]
  }
  depends_on = [aws_lb_listener.http]
}

resource "aws_appautoscaling_target" "api" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app["api"].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.desired_count
  max_capacity       = 4
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${var.project}-api-cpu"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.api.service_namespace
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension

  target_tracking_scaling_policy_configuration {
    target_value = 60
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
