# S3 bucket for blog content and assets
resource "aws_s3_bucket" "api_content" {
  bucket = var.api_bucket_name

  lifecycle {
    ignore_changes = [bucket]
  }
}

# Enable versioning for content history
resource "aws_s3_bucket_versioning" "api_content" {
  bucket = aws_s3_bucket.api_content.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access - Lambda will access privately
resource "aws_s3_bucket_public_access_block" "api_content" {
  bucket = aws_s3_bucket.api_content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "api_content" {
  bucket = aws_s3_bucket.api_content.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS configuration for direct browser uploads via presigned URLs
resource "aws_s3_bucket_cors_configuration" "api_content" {
  bucket = aws_s3_bucket.api_content.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = ["https://${var.domain_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Bucket policy to allow CloudFront OAC access for /content/* path
resource "aws_s3_bucket_policy" "api_content" {
  count  = var.cloudfront_distribution_arn != "" ? 1 : 0
  bucket = aws_s3_bucket.api_content.id

  depends_on = [aws_s3_bucket_public_access_block.api_content]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.api_content.arn}/content/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = var.cloudfront_distribution_arn
          }
        }
      }
    ]
  })
}
