# API Infrastructure: API Gateway, Lambda, DynamoDB, S3

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Backend configuration is provided via:
    # - GitHub Actions: -backend-config flags
    # - Local: backend-config.hcl file
    key     = "blog/api.tfstate"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "PersonalBlog"
      Component = "API"
      ManagedBy = "Terraform"
    }
  }
}
