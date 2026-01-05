variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "blog_bucket_name" {
  description = "Name of the S3 bucket for blog hosting"
  type        = string
}
