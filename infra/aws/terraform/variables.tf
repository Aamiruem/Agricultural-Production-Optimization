variable "project" {
  description = "Name prefix for every resource"
  type        = string
  default     = "agrioptima"
}

variable "aws_region" {
  description = "AWS region (ap-south-1 = Mumbai)"
  type        = string
  default     = "ap-south-1"
}

variable "site_url" {
  description = "Public URL users open, e.g. https://agri.example.com (or the ALB URL output after the first apply)"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS on the load balancer. Empty = HTTP only (testing)."
  type        = string
  default     = ""
}

variable "mongodb_uri" {
  description = "MongoDB connection string, e.g. a MongoDB Atlas cluster in the same AWS region"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Claude API key for the AI assistant (empty = knowledge-base answers only)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "github_repository" {
  description = "owner/repo allowed to deploy via GitHub Actions OIDC"
  type        = string
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "desired_count" {
  description = "Tasks per ECS service"
  type        = number
  default     = 1
}
