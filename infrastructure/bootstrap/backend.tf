# Bootstrap: OIDC Provider
# This is the foundation - run this first

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
    # See backend-config.hcl.example
    key     = "blog/bootstrap.tfstate"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "PersonalBlog"
      Component = "Bootstrap"
      ManagedBy = "Terraform"
    }
  }
}
