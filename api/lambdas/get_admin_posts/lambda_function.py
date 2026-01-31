"""
Lambda function to get all blog posts for admin management.
Protected by Cognito authorizer - requires valid JWT token.
Returns both published and draft posts.
"""
import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
s3_bucket = os.environ['S3_BUCKET']


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to int/float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    GET /api/admin/blogs
    Returns list of all blog posts (published and drafts) sorted by update date (newest first)
    Protected by Cognito authorizer.
    """
    try:
        # Get user info from authorizer context (for logging)
        # For HTTP API with Lambda authorizer, context is under 'lambda' key
        authorizer_context = event.get('requestContext', {}).get('authorizer', {}).get('lambda', {})
        user_email = authorizer_context.get('email', 'unknown')
        print(f"Admin posts requested by: {user_email}")

        # Query GSI1 to get all posts sorted by date
        response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk',
            ExpressionAttributeValues={
                ':pk': 'POST'
            },
            ScanIndexForward=False,  # Descending order (newest first)
        )

        # Format posts for admin view (include both published and drafts)
        posts = []
        for item in response.get('Items', []):
            slug = item['PK'].replace('POST#', '')

            # Fetch content from S3 for editing
            content = ''
            content_key = item.get('contentKey', f'posts/{slug}/content.md')
            try:
                s3_response = s3.get_object(Bucket=s3_bucket, Key=content_key)
                content = s3_response['Body'].read().decode('utf-8')
            except Exception as e:
                print(f"Error fetching content for {slug}: {str(e)}")

            posts.append({
                'slug': slug,
                'title': item.get('title', ''),
                'author': item.get('author', ''),
                'publishDate': item.get('publishDate', ''),
                'createdAt': item.get('createdAt', ''),
                'updatedAt': item.get('updatedAt', ''),
                'tags': item.get('tags', []),
                'summary': item.get('summary', ''),
                'status': item.get('status', 'draft'),
                'content': content,
            })

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
            }, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
