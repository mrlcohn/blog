"""
Lambda function to update an existing blog post.
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
        'function': 'UpdateBlogPost',
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
    PUT /api/blogs/{slug}
    Updates an existing blog post in DynamoDB

    Expected request body:
    {
        "title": "My Blog Post",
        "author": "Author Name",
        "summary": "Brief summary",
        "content": "Full markdown content",
        "tags": ["tag1", "tag2"],
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

        # Get slug from path parameters
        slug = event.get('pathParameters', {}).get('slug')
        if not slug:
            log_structured('warning', 'Missing slug parameter', request_id=request_id)
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'error': 'Missing slug parameter'})
            }

        log_structured('info', 'Updating blog post',
            request_id=request_id,
            slug=slug,
            user_email=user_email,
            user_id=user_id
        )

        # Parse request body (handle base64 encoding if present)
        body_str = event.get('body', '{}')
        if event.get('isBase64Encoded', False):
            log_structured('info', 'Decoding base64 body', request_id=request_id)
            body_str = base64.b64decode(body_str).decode('utf-8')

        body = json.loads(body_str)

        # Check if post exists
        existing_post = table.get_item(
            Key={'PK': f'POST#{slug}', 'SK': 'METADATA'}
        )
        if 'Item' not in existing_post:
            log_structured('warning', 'Post not found',
                request_id=request_id,
                slug=slug
            )
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'error': 'Post not found'})
            }

        existing_item = existing_post['Item']

        # Get updated values (use existing if not provided)
        title = body.get('title', existing_item.get('title'))
        author = body.get('author', existing_item.get('author'))
        summary = body.get('summary', existing_item.get('summary'))
        content = body.get('content')
        tags = body.get('tags', existing_item.get('tags', []))
        image_key = body.get('imageKey', existing_item.get('imageKey', ''))
        status = body.get('status', existing_item.get('status', 'draft'))

        # Validate required fields
        if not title or not author or not summary:
            log_structured('warning', 'Validation failed: missing fields',
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
                    'error': 'Title, author, and summary are required'
                })
            }

        # Create timestamps
        now = datetime.utcnow()
        timestamp = now.isoformat() + 'Z'

        # Determine publish date
        if status == 'published':
            # If newly publishing, set publish date; otherwise keep existing
            if existing_item.get('status') != 'published':
                publish_date = timestamp
            else:
                publish_date = existing_item.get('publishDate', timestamp)
        else:
            publish_date = ''

        # Update content in S3 if provided
        content_key = existing_item.get('contentKey', f'posts/{slug}/content.md')
        if content is not None:
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

        # Update DynamoDB item
        update_expression = """
            SET title = :title,
                author = :author,
                summary = :summary,
                tags = :tags,
                imageKey = :imageKey,
                #status = :status,
                updatedAt = :updatedAt,
                updatedBy = :updatedBy,
                updatedByUserId = :updatedByUserId,
                publishDate = :publishDate,
                GSI1SK = :gsi1sk
        """

        gsi1sk = publish_date if status == 'published' else f'DRAFT#{timestamp}'

        log_structured('info', 'Updating DynamoDB',
            request_id=request_id,
            slug=slug,
            status=status
        )

        table.update_item(
            Key={'PK': f'POST#{slug}', 'SK': 'METADATA'},
            UpdateExpression=update_expression,
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':title': title,
                ':author': author,
                ':summary': summary,
                ':tags': tags,
                ':imageKey': image_key,
                ':status': status,
                ':updatedAt': timestamp,
                ':updatedBy': user_email,
                ':updatedByUserId': user_id,
                ':publishDate': publish_date,
                ':gsi1sk': gsi1sk
            }
        )

        log_structured('info', 'Blog post updated successfully',
            request_id=request_id,
            slug=slug,
            status=status,
            user_email=user_email
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'message': 'Blog post updated successfully',
                'slug': slug,
                'status': status,
                'updatedAt': timestamp
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
