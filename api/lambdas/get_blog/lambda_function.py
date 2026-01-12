"""
Lambda function to get a single blog post by slug.
Returns full blog post details including content from S3.
"""
import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
bucket_name = os.environ['S3_BUCKET']


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to int/float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    GET /api/blog/{slug}
    Returns full blog post details with content
    Returns 404 if post not found or not published
    """
    try:
        # Extract slug from path parameters
        slug = event.get('pathParameters', {}).get('slug')

        if not slug:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing slug parameter'})
            }

        # Get post metadata from DynamoDB
        response = table.get_item(
            Key={
                'PK': f'POST#{slug}',
                'SK': 'v0'
            }
        )

        # Return 404 if post doesn't exist
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Post not found'})
            }

        item = response['Item']

        # Return 404 for unpublished posts (draft check - will add auth later)
        if item.get('status') != 'published':
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Post not found'})
            }

        # Get content from S3
        content_key = item.get('contentKey')
        content = ''

        if content_key:
            try:
                s3_response = s3.get_object(Bucket=bucket_name, Key=content_key)
                content = s3_response['Body'].read().decode('utf-8')
            except s3.exceptions.NoSuchKey:
                print(f"Content file not found: {content_key}")
                content = ''

        # Build response
        post = {
            'slug': slug,
            'title': item.get('title', ''),
            'author': item.get('author', ''),
            'publishDate': item.get('publishDate', ''),
            'lastModifiedDate': item.get('lastModifiedDate', ''),
            'tags': item.get('tags', []),
            'summary': item.get('summary', ''),
            'content': content,
            'contentType': item.get('contentType', 'html'),
            'imageKey': item.get('imageKey', '')
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
            },
            'body': json.dumps(post, cls=DecimalEncoder)
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
