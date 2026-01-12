variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "api_bucket_name" {
  description = "Name of the S3 bucket for blog content and assets"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the blog (e.g., blog.example.com)"
  type        = string
}

variable "route53_zone_name" {
  description = "Route53 hosted zone name (e.g., example.com)"
  type        = string
}
