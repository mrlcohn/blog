# API Gateway HTTP API
resource "aws_apigatewayv2_api" "blog_api" {
  name          = "blog-api"
  protocol_type = "HTTP"
  description   = "Blog API for fetching posts and content"

  cors_configuration {
    allow_origins = ["https://${var.domain_name}"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 300
  }

  tags = {
    Name = "Blog API"
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.blog_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name = "Blog API Default Stage"
  }

  # Ensure the CloudWatch role is configured before creating the stage
  depends_on = [aws_api_gateway_account.api_gateway_account]
}

# CloudWatch Log Group for API Gateway logs
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/blog-api"
  retention_in_days = 7

  lifecycle {
    ignore_changes = [name]
  }

  tags = {
    Name = "Blog API Logs"
  }
}

# IAM role for API Gateway to write CloudWatch logs
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "APIGatewayCloudWatchLogsRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "API Gateway CloudWatch Logs Role"
  }
}

# Attach the managed policy for API Gateway to push logs to CloudWatch
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Configure API Gateway account settings to use the CloudWatch role
resource "aws_api_gateway_account" "api_gateway_account" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# Lambda Integration: GetBlogCards
resource "aws_apigatewayv2_integration" "get_blog_cards" {
  api_id           = aws_apigatewayv2_api.blog_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_blog_cards.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_blog_cards" {
  api_id    = aws_apigatewayv2_api.blog_api.id
  route_key = "GET /blogs"
  target    = "integrations/${aws_apigatewayv2_integration.get_blog_cards.id}"
}

resource "aws_lambda_permission" "api_gw_get_blog_cards" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_blog_cards.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.blog_api.execution_arn}/*/*"
}

# Lambda Integration: GetBlog
resource "aws_apigatewayv2_integration" "get_blog" {
  api_id           = aws_apigatewayv2_api.blog_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_blog.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_blog" {
  api_id    = aws_apigatewayv2_api.blog_api.id
  route_key = "GET /blog/{slug}"
  target    = "integrations/${aws_apigatewayv2_integration.get_blog.id}"
}

resource "aws_lambda_permission" "api_gw_get_blog" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_blog.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.blog_api.execution_arn}/*/*"
}

# Lambda Integration: GetAbout
resource "aws_apigatewayv2_integration" "get_about" {
  api_id           = aws_apigatewayv2_api.blog_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_about.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_about" {
  api_id    = aws_apigatewayv2_api.blog_api.id
  route_key = "GET /about"
  target    = "integrations/${aws_apigatewayv2_integration.get_about.id}"
}

resource "aws_lambda_permission" "api_gw_get_about" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_about.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.blog_api.execution_arn}/*/*"
}

# Custom domain for API (api.yourdomain.com or yourdomain.com/api)
# We'll add this to CloudFront as a behavior instead
