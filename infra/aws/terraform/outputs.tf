output "load_balancer_url" {
  description = "Open this (or point your domain's CNAME at it)"
  value       = "${local.https ? "https" : "http"}://${aws_lb.main.dns_name}"
}

output "ecr_repositories" {
  value = { for k, r in aws_ecr_repository.app : k => r.repository_url }
}

output "github_deploy_role_arn" {
  description = "Set as the AWS_DEPLOY_ROLE_ARN repository variable in GitHub"
  value       = aws_iam_role.github_deploy.arn
}

output "photos_cdn_domain" {
  value = aws_cloudfront_distribution.photos.domain_name
}

output "postgres_endpoint" {
  value = aws_db_instance.postgres.endpoint
}
