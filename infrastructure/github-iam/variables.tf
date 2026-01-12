variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "github_repo" {
  description = "GitHub repository in format 'username/repo'"
  type        = string
}

variable "terraform_state_bucket_arn" {
  description = "ARN of the S3 bucket storing Terraform state"
  type        = string
}

variable "terraform_lock_table_arn" {
  description = "ARN of the DynamoDB table for state locking"
  type        = string
}

variable "blog_bucket_name" {
  description = "Name of the S3 bucket for blog hosting"
  type        = string
}

variable "api_bucket_name" {
  description = "Name of the S3 bucket for API content"
  type        = string
}
