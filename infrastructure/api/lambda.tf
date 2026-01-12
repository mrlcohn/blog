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

# Lambda function: Authorizer
resource "null_resource" "authorizer_dependencies" {
  triggers = {
    requirements = filemd5("${path.module}/../../api/lambdas/authorizer/requirements.txt")
  }

  provisioner "local-exec" {
    command     = "pip install -r requirements.txt -t ."
    working_dir = "${path.module}/../../api/lambdas/authorizer"
  }
}

data "archive_file" "authorizer" {
  type        = "zip"
  source_dir  = "${path.module}/../../api/lambdas/authorizer"
  output_path = "${path.module}/lambda_zips/authorizer.zip"

  depends_on = [null_resource.authorizer_dependencies]
}

resource "aws_lambda_function" "authorizer" {
  filename         = data.archive_file.authorizer.output_path
  function_name    = "BlogAuthorizer"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.authorizer.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      USER_POOL_ID  = aws_cognito_user_pool.blog_admin.id
      APP_CLIENT_ID = aws_cognito_user_pool_client.blog_admin_client.id
    }
  }

  tags = {
    Name = "Blog Authorizer Lambda"
  }
}

# Lambda function: CreateBlogPost
data "archive_file" "create_blog_post" {
  type        = "zip"
  source_dir  = "${path.module}/../../api/lambdas/create_blog_post"
  output_path = "${path.module}/lambda_zips/create_blog_post.zip"
}

resource "aws_lambda_function" "create_blog_post" {
  filename         = data.archive_file.create_blog_post.output_path
  function_name    = "CreateBlogPost"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.create_blog_post.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.blog_posts.name
      S3_BUCKET      = aws_s3_bucket.api_content.bucket
    }
  }

  tags = {
    Name = "CreateBlogPost Lambda"
  }
}
