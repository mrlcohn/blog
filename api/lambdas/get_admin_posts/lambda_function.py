"""
Lambda function to get all blog posts for admin management.
Protected by Cognito authorizer - requires valid JWT token.
Returns both published and draft posts.
"""
import json
import boto3
import os
import logging
import traceback
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
        'function': 'GetAdminPosts',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        **kwargs
    }
    if level == 'error':
        logger.error(json.dumps(log_entry))
    elif level == 'warning':
        logger.warning(json.dumps(log_entry))
    else:
        logger.info(json.dumps(log_entry))


class DynamoDBEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB types for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        if isinstance(obj, (set, frozenset)):
            return list(obj)
        return super(DynamoDBEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    GET /api/admin/blogs
    Returns list of all blog posts (published and drafts) sorted by update date (newest first)
    Protected by Cognito authorizer.
    """
    request_id = context.aws_request_id if context else 'unknown'

    try:
        # Log incoming event for debugging
        log_structured('info', 'Request received',
            request_id=request_id,
            http_method=event.get('requestContext', {}).get('http', {}).get('method'),
            path=event.get('requestContext', {}).get('http', {}).get('path'),
        )

        # Get user info from authorizer context
        # For HTTP API with Lambda authorizer, context is under 'lambda' key
        authorizer_context = event.get('requestContext', {}).get('authorizer', {}).get('lambda', {})
        user_email = authorizer_context.get('email', 'unknown')

        log_structured('info', 'Admin posts requested',
            request_id=request_id,
            user_email=user_email
        )

        # Query GSI1 to get all posts sorted by date
        response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk',
            ExpressionAttributeValues={
                ':pk': 'POST'
            },
            ScanIndexForward=False,  # Descending order (newest first)
        )

        items = response.get('Items', [])
        log_structured('info', 'DynamoDB query complete',
            request_id=request_id,
            item_count=len(items)
        )

        # Format posts for admin view (include both published and drafts)
        posts = []
        for item in items:
            slug = item['PK'].replace('POST#', '')

            # Fetch content from S3 for editing
            content = ''
            content_key = item.get('contentKey', f'posts/{slug}/content.md')
            try:
                s3_response = s3.get_object(Bucket=s3_bucket, Key=content_key)
                content = s3_response['Body'].read().decode('utf-8')
            except Exception as e:
                log_structured('warning', 'Failed to fetch post content from S3',
                    request_id=request_id,
                    slug=slug,
                    content_key=content_key,
                    error=str(e)
                )

            posts.append({
                'slug': slug,
                'title': item.get('title', ''),
                'author': item.get('author', ''),
                'publishDate': item.get('publishDate', ''),
                'createdAt': item.get('createdAt', ''),
                'updatedAt': item.get('updatedAt', ''),
                'tags': list(item.get('tags', [])),
                'summary': item.get('summary', ''),
                'status': item.get('status', 'draft'),
                'imageKey': item.get('imageKey', ''),
                'content': content,
            })

        log_structured('info', 'Returning posts',
            request_id=request_id,
            post_count=len(posts),
            user_email=user_email
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
            },
            'body': json.dumps({
                'posts': posts,
                'count': len(posts)
            }, cls=DynamoDBEncoder)
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
