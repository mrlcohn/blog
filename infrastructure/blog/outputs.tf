# S3 bucket outputs
output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.blog.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.blog.arn
}

# CloudFront outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.blog.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.blog.domain_name
}

output "blog_url" {
  description = "Blog URL with custom domain"
  value       = "https://${var.domain_name}"
}
