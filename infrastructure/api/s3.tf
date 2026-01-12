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
