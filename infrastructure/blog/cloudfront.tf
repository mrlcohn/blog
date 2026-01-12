# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "blog" {
  name                              = "blog-oac"
  description                       = "OAC for blog S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution for the blog
resource "aws_cloudfront_distribution" "blog" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [var.domain_name]
  price_class         = "PriceClass_100" # Use only North America and Europe edge locations

  # S3 bucket as origin (using OAC for private access)
  origin {
    domain_name              = aws_s3_bucket.blog.bucket_regional_domain_name
    origin_id                = "S3-${var.blog_bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.blog.id
  }

  # API Gateway as origin for /api/* requests (conditional - only if endpoint provided)
  dynamic "origin" {
    for_each = var.api_gateway_endpoint != "" ? [1] : []
    content {
      domain_name = replace(var.api_gateway_endpoint, "https://", "")
      origin_id   = "APIGateway"

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  # Default cache behavior (S3 frontend)
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.blog_bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600  # 1 hour
    max_ttl                = 86400 # 24 hours
    compress               = true
  }

  # Cache behavior for API requests (no caching, forward all) - conditional
  dynamic "ordered_cache_behavior" {
    for_each = var.api_gateway_endpoint != "" ? [1] : []
    content {
      path_pattern     = "/api/*"
      allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods   = ["GET", "HEAD"]
      target_origin_id = "APIGateway"

      forwarded_values {
        query_string = true
        headers      = ["Authorization", "Accept", "Content-Type"]
        cookies {
          forward = "all"
        }
      }

      viewer_protocol_policy = "https-only"
      min_ttl                = 0
      default_ttl            = 0
      max_ttl                = 0
      compress               = true
    }
  }

  # Custom error response for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  # SSL/TLS certificate
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.blog.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "Blog Distribution"
  }
}

# Route53 alias record pointing to CloudFront
resource "aws_route53_record" "blog" {
  zone_id = data.aws_route53_zone.blog.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.blog.domain_name
    zone_id                = aws_cloudfront_distribution.blog.hosted_zone_id
    evaluate_target_health = false
  }
}
