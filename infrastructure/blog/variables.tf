variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "blog_bucket_name" {
  description = "Name of the S3 bucket for blog hosting"
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

variable "api_gateway_endpoint" {
  description = "API Gateway endpoint URL from the API module"
  type        = string
}

variable "api_content_bucket_name" {
  description = "Name of the S3 bucket for API content (blog posts, about data, images)"
  type        = string
  default     = ""
}

variable "api_content_bucket_arn" {
  description = "ARN of the S3 bucket for API content"
  type        = string
  default     = ""
}

variable "api_content_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket for API content"
  type        = string
  default     = ""
}
