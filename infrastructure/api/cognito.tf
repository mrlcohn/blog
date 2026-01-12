# Cognito User Pool for blog admin authentication
resource "aws_cognito_user_pool" "blog_admin" {
  name = "blog-admin-pool"

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  # User attributes
  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Auto-verify email
  auto_verified_attributes = ["email"]

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # MFA configuration (optional but recommended)
  mfa_configuration = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  tags = {
    Name = "Blog Admin User Pool"
  }
}

# User Pool Client for web application
resource "aws_cognito_user_pool_client" "blog_admin_client" {
  name         = "blog-admin-web-client"
  user_pool_id = aws_cognito_user_pool.blog_admin.id

  # OAuth settings
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  callback_urls = [
    "https://${var.domain_name}/admin",
    "https://${var.domain_name}/admin/callback",
    "http://localhost:5173/admin",
    "http://localhost:5173/admin/callback"
  ]

  logout_urls = [
    "https://${var.domain_name}",
    "http://localhost:5173"
  ]

  supported_identity_providers = ["COGNITO"]

  # Token validity
  id_token_validity      = 60
  access_token_validity  = 60
  refresh_token_validity = 30

  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }

  # Prevent client secret for public clients (SPA)
  generate_secret = false

  # Auth flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "blog_admin" {
  domain       = "blog-admin-${data.aws_caller_identity.current.account_id}"
  user_pool_id = aws_cognito_user_pool.blog_admin.id
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
