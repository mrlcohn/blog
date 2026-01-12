"""
Lambda function to create a new blog post.
Protected by Cognito authorizer - requires valid JWT token.
"""
import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
s3_bucket = os.environ['S3_BUCKET']


def lambda_handler(event, context):
    """
    POST /api/blogs
    Creates a new blog post in DynamoDB

    Expected request body:
    {
        "slug": "my-blog-post",
        "title": "My Blog Post",
        "author": "Author Name",
        "summary": "Brief summary",
        "content": "Full markdown content",
        "tags": ["tag1", "tag2"],
        "imageKey": "optional-s3-key",
        "status": "draft" or "published"
    }
    """
    try:
        # Get user info from authorizer context
        authorizer_context = event.get('requestContext', {}).get('authorizer', {})
        user_id = authorizer_context.get('userId', 'unknown')
        user_email = authorizer_context.get('email', 'unknown')

        print(f"Creating blog post for user: {user_email} ({user_id})")

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['slug', 'title', 'author', 'summary', 'content']
        missing_fields = [field for field in required_fields if not body.get(field)]
        if missing_fields:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'Missing required fields',
                    'missing': missing_fields
                })
            }

        slug = body['slug']
        title = body['title']
        author = body['author']
        summary = body['summary']
        content = body['content']
        tags = body.get('tags', [])
        image_key = body.get('imageKey', '')
        status = body.get('status', 'draft')

        # Validate slug format (alphanumeric and hyphens only)
        if not all(c.isalnum() or c == '-' for c in slug):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'Invalid slug format. Use only alphanumeric characters and hyphens.'
                })
            }

        # Check if post with this slug already exists
        existing_post = table.get_item(
            Key={'PK': f'POST#{slug}', 'SK': 'METADATA'}
        )
        if 'Item' in existing_post:
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'A post with this slug already exists'
                })
            }

        # Create timestamps
        now = datetime.utcnow()
        timestamp = now.isoformat() + 'Z'
        publish_date = timestamp if status == 'published' else ''

        # Upload content to S3
        content_key = f'posts/{slug}/content.md'
        s3.put_object(
            Bucket=s3_bucket,
            Key=content_key,
            Body=content.encode('utf-8'),
            ContentType='text/markdown'
        )

        # Create DynamoDB item
        item = {
            'PK': f'POST#{slug}',
            'SK': 'METADATA',
            'GSI1PK': 'POST',
            'GSI1SK': publish_date if status == 'published' else f'DRAFT#{timestamp}',
            'slug': slug,
            'title': title,
            'author': author,
            'summary': summary,
            'contentKey': content_key,
            'tags': tags,
            'imageKey': image_key,
            'status': status,
            'createdAt': timestamp,
            'updatedAt': timestamp,
            'publishDate': publish_date,
            'createdBy': user_email,
            'createdByUserId': user_id
        }

        # Write to DynamoDB
        table.put_item(Item=item)

        print(f"Blog post created successfully: {slug}")

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'message': 'Blog post created successfully',
                'slug': slug,
                'status': status,
                'createdAt': timestamp
            })
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Invalid JSON in request body'
            })
        }
    except Exception as e:
        print(f"Error creating blog post: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
