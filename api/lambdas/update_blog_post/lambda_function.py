"""
Lambda function to update an existing blog post.
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
    try:
        # Get user info from authorizer context
        authorizer_context = event.get('requestContext', {}).get('authorizer', {})
        user_id = authorizer_context.get('userId', 'unknown')
        user_email = authorizer_context.get('email', 'unknown')

        # Get slug from path parameters
        slug = event.get('pathParameters', {}).get('slug')
        if not slug:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing slug parameter'})
            }

        print(f"Updating blog post '{slug}' by user: {user_email} ({user_id})")

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Check if post exists
        existing_post = table.get_item(
            Key={'PK': f'POST#{slug}', 'SK': 'METADATA'}
        )
        if 'Item' not in existing_post:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
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
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
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

        print(f"Blog post updated successfully: {slug}")

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

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Invalid JSON in request body'
            })
        }
    except Exception as e:
        print(f"Error updating blog post: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
