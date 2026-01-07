# IAM Role for GitHub Actions
# This role will be assumed by GitHub Actions workflows using OIDC

# Trust policy allowing GitHub Actions to assume this role
data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Restrict to your specific repository
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "GitHubActionsRole"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json

  tags = {
    Name = "GitHubActionsRole"
  }
}

# Policy for Terraform state bucket access
resource "aws_iam_policy" "terraform_state_access" {
  name        = "TerraformStateAccess"
  description = "Allows GitHub Actions to read/write Terraform state"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${var.terraform_state_bucket_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = var.terraform_state_bucket_arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTable"
        ]
        Resource = var.terraform_lock_table_arn
      }
    ]
  })
}

# Policy for Terraform to manage S3 blog bucket resources
resource "aws_iam_policy" "blog_terraform" {
  name        = "BlogTerraformPolicy"
  description = "Allows Terraform to manage blog infrastructure"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ManageBlogBucket"
        Effect = "Allow"
        Action = [
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:PutBucketWebsite",
          "s3:GetBucketWebsite",
          "s3:DeleteBucketWebsite",
          "s3:PutBucketPolicy",
          "s3:GetBucketPolicy",
          "s3:DeleteBucketPolicy",
          "s3:PutBucketPublicAccessBlock",
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketVersioning",
          "s3:GetBucketVersioning",
          "s3:GetBucketAcl",
          "s3:GetBucketTagging",
          "s3:PutBucketTagging",
          "s3:GetBucketCORS",
          "s3:GetAccelerateConfiguration",
          "s3:GetBucketRequestPayment",
          "s3:GetBucketLogging",
          "s3:GetLifecycleConfiguration",
          "s3:GetReplicationConfiguration",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketObjectLockConfiguration"
        ]
        Resource = "arn:aws:s3:::${var.blog_bucket_name}"
      },
      {
        Sid    = "ManageCloudFront"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateDistribution",
          "cloudfront:GetDistribution",
          "cloudfront:GetDistributionConfig",
          "cloudfront:UpdateDistribution",
          "cloudfront:DeleteDistribution",
          "cloudfront:TagResource",
          "cloudfront:UntagResource",
          "cloudfront:ListTagsForResource",
          "cloudfront:CreateInvalidation"
        ]
        Resource = "*"
      },
      {
        Sid    = "ManageACM"
        Effect = "Allow"
        Action = [
          "acm:RequestCertificate",
          "acm:DescribeCertificate",
          "acm:DeleteCertificate",
          "acm:ListCertificates",
          "acm:AddTagsToCertificate",
          "acm:ListTagsForCertificate"
        ]
        Resource = "*"
      },
      {
        Sid    = "ManageRoute53"
        Effect = "Allow"
        Action = [
          "route53:GetHostedZone",
          "route53:ListHostedZones",
          "route53:ListResourceRecordSets",
          "route53:ChangeResourceRecordSets",
          "route53:GetChange"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy for deploying blog content to S3
resource "aws_iam_policy" "blog_deployment" {
  name        = "BlogDeploymentPolicy"
  description = "Allows GitHub Actions to deploy blog content to S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DeployBlogContent"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.blog_bucket_name}",
          "arn:aws:s3:::${var.blog_bucket_name}/*"
        ]
      }
    ]
  })
}

# Attach policies to the role
resource "aws_iam_role_policy_attachment" "terraform_state" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.terraform_state_access.arn
}

resource "aws_iam_role_policy_attachment" "blog_terraform" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.blog_terraform.arn
}

resource "aws_iam_role_policy_attachment" "blog_deployment" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.blog_deployment.arn
}
