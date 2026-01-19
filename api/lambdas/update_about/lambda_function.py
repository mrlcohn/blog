"""
Lambda function to update About Me page content.
Protected by Cognito authorizer - requires valid JWT token.
"""
import json
import boto3
import os
from datetime import datetime

s3 = boto3.client('s3')
bucket_name = os.environ['S3_BUCKET']
ABOUT_KEY = 'about/about.json'


def lambda_handler(event, context):
    """
    PUT /api/about
    Updates about me page content in S3

    Expected request body:
    {
        "name": "Your Name",
        "bio": "Short bio for homepage bumper",
        "content": "Full markdown content for about page",
        "imageUrl": "optional image URL"
    }
    """
    try:
        # Get user info from authorizer context
        authorizer_context = event.get('requestContext', {}).get('authorizer', {})
        user_email = authorizer_context.get('email', 'unknown')

        print(f"Updating about page by user: {user_email}")

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        name = body.get('name', '').strip()
        bio = body.get('bio', '').strip()
        content = body.get('content', '').strip()
        image_url = body.get('imageUrl', '').strip()

        if not name:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'error': 'Name is required'})
            }

        # Create about data object
        now = datetime.utcnow()
        timestamp = now.isoformat() + 'Z'

        about_data = {
            'name': name,
            'bio': bio,
            'content': content,
            'imageUrl': image_url,
            'updatedAt': timestamp,
            'updatedBy': user_email
        }

        # Save to S3
        s3.put_object(
            Bucket=bucket_name,
            Key=ABOUT_KEY,
            Body=json.dumps(about_data).encode('utf-8'),
            ContentType='application/json'
        )

        print(f"About page updated successfully by {user_email}")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            },
            'body': json.dumps({
                'message': 'About page updated successfully',
                'updatedAt': timestamp
            })
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'error': 'Invalid JSON in request body'
            })
        }
    except Exception as e:
        print(f"Error updating about page: {str(e)}")
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
