# DynamoDB outputs
output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.blog_posts.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.blog_posts.arn
}

# S3 outputs
output "api_bucket_name" {
  description = "Name of the S3 bucket for API content"
  value       = aws_s3_bucket.api_content.id
}

output "api_bucket_arn" {
  description = "ARN of the S3 bucket for API content"
  value       = aws_s3_bucket.api_content.arn
}

# API Gateway outputs
output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.blog_api.id
}

output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.blog_api.api_endpoint
}

output "api_gateway_execution_arn" {
  description = "API Gateway execution ARN (for CloudFront integration)"
  value       = aws_apigatewayv2_api.blog_api.execution_arn
}

# Lambda outputs
output "lambda_functions" {
  description = "Lambda function names"
  value = {
    get_blog_cards = aws_lambda_function.get_blog_cards.function_name
    get_blog       = aws_lambda_function.get_blog.function_name
    get_about      = aws_lambda_function.get_about.function_name
  }
}
