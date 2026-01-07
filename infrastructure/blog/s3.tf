# S3 bucket for blog hosting
resource "aws_s3_bucket" "blog" {
  bucket = var.blog_bucket_name
}

# Enable versioning for the bucket
resource "aws_s3_bucket_versioning" "blog" {
  bucket = aws_s3_bucket.blog.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Configure static website hosting
resource "aws_s3_bucket_website_configuration" "blog" {
  bucket = aws_s3_bucket.blog.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Allow public access for website hosting (will restrict to CloudFront later)
resource "aws_s3_bucket_public_access_block" "blog" {
  bucket = aws_s3_bucket.blog.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy for public website access
resource "aws_s3_bucket_policy" "blog" {
  bucket = aws_s3_bucket.blog.id

  # Ensure public access block is configured first
  depends_on = [aws_s3_bucket_public_access_block.blog]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.blog.arn}/*"
      }
    ]
  })
}
