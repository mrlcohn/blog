# DynamoDB table for blog posts
resource "aws_dynamodb_table" "blog_posts" {
  name         = "blog-posts"
  billing_mode = "PAY_PER_REQUEST" # On-demand pricing for low traffic
  hash_key     = "PK"
  range_key    = "SK"

  lifecycle {
    ignore_changes = [name]
  }

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # GSI for querying all posts sorted by publish date
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "Blog Posts Table"
  }
}
