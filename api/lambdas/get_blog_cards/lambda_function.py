"""
Lambda function to get blog post cards for the homepage.
Returns a list of blog posts with summary info for card display.
"""
import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to int/float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    GET /api/blogs
    Returns list of published blog posts sorted by publish date (newest first)
    """
    try:
        # Query GSI1 to get all posts sorted by publish date
        response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk',
            ExpressionAttributeValues={
                ':pk': 'POST'
            },
            ScanIndexForward=False,  # Descending order (newest first)
            # TODO: Add pagination support with Limit and ExclusiveStartKey
        )

        # Filter to only published posts and format for cards
        posts = []
        for item in response.get('Items', []):
            if item.get('status') == 'published':
                posts.append({
                    'slug': item['PK'].replace('POST#', ''),
                    'title': item.get('title', ''),
                    'author': item.get('author', ''),
                    'publishDate': item.get('publishDate', ''),
                    'tags': item.get('tags', []),
                    'summary': item.get('summary', ''),
                    'imageKey': item.get('imageKey', '')
                })

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',  # Will be restricted to your domain later
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
