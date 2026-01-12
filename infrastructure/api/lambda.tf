# Lambda function: GetBlogCards
data "archive_file" "get_blog_cards" {
  type        = "zip"
  source_dir  = "${path.module}/../../api/lambdas/get_blog_cards"
  output_path = "${path.module}/lambda_zips/get_blog_cards.zip"
}

resource "aws_lambda_function" "get_blog_cards" {
  filename         = data.archive_file.get_blog_cards.output_path
  function_name    = "GetBlogCards"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.get_blog_cards.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.blog_posts.name
      S3_BUCKET      = aws_s3_bucket.api_content.bucket
    }
  }

  tags = {
    Name = "GetBlogCards Lambda"
  }
}

# Lambda function: GetBlog
data "archive_file" "get_blog" {
  type        = "zip"
  source_dir  = "${path.module}/../../api/lambdas/get_blog"
  output_path = "${path.module}/lambda_zips/get_blog.zip"
}

resource "aws_lambda_function" "get_blog" {
  filename         = data.archive_file.get_blog.output_path
  function_name    = "GetBlog"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.get_blog.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.blog_posts.name
      S3_BUCKET      = aws_s3_bucket.api_content.bucket
    }
  }

  tags = {
    Name = "GetBlog Lambda"
  }
}

# Lambda function: GetAbout
data "archive_file" "get_about" {
  type        = "zip"
  source_dir  = "${path.module}/../../api/lambdas/get_about"
  output_path = "${path.module}/lambda_zips/get_about.zip"
}

resource "aws_lambda_function" "get_about" {
  filename         = data.archive_file.get_about.output_path
  function_name    = "GetAbout"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.get_about.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.api_content.bucket
    }
  }

  tags = {
    Name = "GetAbout Lambda"
  }
}
