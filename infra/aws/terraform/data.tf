# Managed data stores: RDS PostgreSQL, ElastiCache Redis, S3 + CloudFront for
# photos, and Secrets Manager for credentials.

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = var.project
  subnet_ids = module.vpc.private_subnets
}

resource "aws_db_instance" "postgres" {
  identifier                   = var.project
  engine                       = "postgres"
  engine_version               = "17"
  instance_class               = var.db_instance_class
  allocated_storage            = 20
  max_allocated_storage        = 100
  storage_encrypted            = true
  db_name                      = "agrioptima"
  username                     = "agri"
  password                     = random_password.db.result
  db_subnet_group_name         = aws_db_subnet_group.main.name
  vpc_security_group_ids       = [aws_security_group.data.id]
  backup_retention_period      = 7
  deletion_protection          = true
  skip_final_snapshot          = false
  final_snapshot_identifier    = "${var.project}-final"
  performance_insights_enabled = true
}

resource "aws_elasticache_subnet_group" "main" {
  name       = var.project
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id         = var.project
  engine             = "redis"
  node_type          = "cache.t4g.micro"
  num_cache_nodes    = 1
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.data.id]
}

# ------------------------------------------------------------ field photos
resource "aws_s3_bucket" "photos" {
  bucket_prefix = "${var.project}-photos-"
}

resource "aws_s3_bucket_public_access_block" "photos" {
  bucket                  = aws_s3_bucket.photos.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

# Browsers PUT directly to S3 with presigned URLs from the farm-service.
resource "aws_s3_bucket_cors_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id
  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = [var.site_url]
    allowed_headers = ["Content-Type", "Content-Length"]
    max_age_seconds = 3000
  }
}

resource "aws_cloudfront_origin_access_control" "photos" {
  name                              = "${var.project}-photos"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "photos" {
  enabled         = true
  comment         = "${var.project} field photos"
  is_ipv6_enabled = true

  origin {
    domain_name              = aws_s3_bucket.photos.bucket_regional_domain_name
    origin_id                = "photos"
    origin_access_control_id = aws_cloudfront_origin_access_control.photos.id
  }

  default_cache_behavior {
    target_origin_id       = "photos"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # AWS managed: CachingOptimized
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }
  viewer_certificate { cloudfront_default_certificate = true }
}

# Private bucket: only this CloudFront distribution may read objects.
resource "aws_s3_bucket_policy" "photos" {
  bucket = aws_s3_bucket.photos.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.photos.arn}/*"
      Condition = { StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.photos.arn } }
    }]
  })
}

# ----------------------------------------------------------------- secrets
locals {
  secret_values = {
    JWT_SECRET        = random_password.jwt.result
    DATABASE_URL      = "postgresql+psycopg://agri:${random_password.db.result}@${aws_db_instance.postgres.endpoint}/agrioptima"
    MONGODB_URI       = var.mongodb_uri
    ANTHROPIC_API_KEY = var.anthropic_api_key
  }
  # for_each needs non-sensitive keys: iterate over names, look values up.
  has_anthropic_key = nonsensitive(var.anthropic_api_key != "")
  secret_names = toset(concat(
    ["JWT_SECRET", "DATABASE_URL", "MONGODB_URI"],
    local.has_anthropic_key ? ["ANTHROPIC_API_KEY"] : [],
  ))
}

resource "aws_secretsmanager_secret" "app" {
  for_each                = local.secret_names
  name                    = "${var.project}/${each.key}"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "app" {
  for_each      = local.secret_names
  secret_id     = aws_secretsmanager_secret.app[each.key].id
  secret_string = local.secret_values[each.key]
}
