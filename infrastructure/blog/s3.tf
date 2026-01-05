# S3 bucket for blog hosting
# Placeholder - add actual S3 configuration when ready

# Example (commented out):
# resource "aws_s3_bucket" "blog" {
#   bucket = var.blog_bucket_name
# }
#
# resource "aws_s3_bucket_website_configuration" "blog" {
#   bucket = aws_s3_bucket.blog.id
#
#   index_document {
#     suffix = "index.html"
#   }
#
#   error_document {
#     key = "index.html"
#   }
# }

# Placeholder output
output "info" {
  value = "Blog infrastructure will be added here (S3, CloudFront, Route53, etc.)"
}
