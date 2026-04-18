"""
Lambda function to create a new blog post.
Protected by Cognito authorizer - requires valid JWT token.
"""
import json
import boto3
import os
import logging
import traceback
import base64
from datetime import datetime
from decimal import Decimal

# Configure structured JSON logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
s3_bucket = os.environ['S3_BUCKET']


def log_structured(level, message, **kwargs):
    """Helper for structured JSON logging"""
    log_entry = {
        'message': message,
        'function': 'CreateBlogPost',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        **kwargs
    }
    if level == 'error':
        logger.error(json.dumps(log_entry))
    elif level == 'warning':
        logger.warning(json.dumps(log_entry))
    else:
        logger.info(json.dumps(log_entry))


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
    request_id = context.aws_request_id if context else 'unknown'

    try:
        # Log incoming event for debugging
        log_structured('info', 'Request received',
            request_id=request_id,
            http_method=event.get('requestContext', {}).get('http', {}).get('method'),
            path=event.get('requestContext', {}).get('http', {}).get('path'),
            has_body=bool(event.get('body')),
            is_base64=event.get('isBase64Encoded', False)
        )

        # Get user info from authorizer context
        # For HTTP API with Lambda authorizer, context is under 'lambda' key
        authorizer_context = event.get('requestContext', {}).get('authorizer', {}).get('lambda', {})
        user_id = authorizer_context.get('userId', 'unknown')
        user_email = authorizer_context.get('email', 'unknown')

        log_structured('info', 'Creating blog post',
            request_id=request_id,
            user_email=user_email,
            user_id=user_id
        )

        # Parse request body (handle base64 encoding if present)
        body_str = event.get('body', '{}')
        if event.get('isBase64Encoded', False):
            log_structured('info', 'Decoding base64 body', request_id=request_id)
            body_str = base64.b64decode(body_str).decode('utf-8')

        body = json.loads(body_str)

        # Validate required fields
        required_fields = ['slug', 'title', 'author', 'summary', 'content']
        missing_fields = [field for field in required_fields if not body.get(field)]
        if missing_fields:
            log_structured('warning', 'Validation failed: missing fields',
                request_id=request_id,
                missing=missing_fields
            )
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
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
            log_structured('warning', 'Validation failed: invalid slug',
                request_id=request_id,
                slug=slug
            )
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': 'Invalid slug format. Use only alphanumeric characters and hyphens.'
                })
            }

        # Check if post with this slug already exists
        existing_post = table.get_item(
            Key={'PK': f'POST#{slug}', 'SK': 'METADATA'}
        )
        if 'Item' in existing_post:
            log_structured('warning', 'Slug conflict',
                request_id=request_id,
                slug=slug
            )
            return {
                'statusCode': 409,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
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
        log_structured('info', 'Writing content to S3',
            request_id=request_id,
            bucket=s3_bucket,
            key=content_key
        )
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

        log_structured('info', 'Writing to DynamoDB',
            request_id=request_id,
            slug=slug,
            status=status
        )
        table.put_item(Item=item)

        log_structured('info', 'Blog post created successfully',
            request_id=request_id,
            slug=slug,
            status=status,
            user_email=user_email
        )

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

    except json.JSONDecodeError as e:
        log_structured('error', 'JSON decode error',
            request_id=request_id,
            error=str(e),
            error_type='JSONDecodeError'
        )
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'error': 'Invalid JSON in request body',
                'details': str(e)
            })
        }
    except Exception as e:
        log_structured('error', 'Unhandled exception',
            request_id=request_id,
            error=str(e),
            error_type=type(e).__name__,
            traceback=traceback.format_exc()
        )
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'request_id': request_id
            })
        }
