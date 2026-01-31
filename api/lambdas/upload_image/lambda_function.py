"""
Lambda function to generate pre-signed URLs for image uploads.
Protected by Cognito authorizer - requires valid JWT token.
"""
import json
import boto3
import os
import uuid
from datetime import datetime

s3 = boto3.client('s3')
bucket_name = os.environ['S3_BUCKET']
domain_name = os.environ.get('DOMAIN_NAME', '')

# Allowed image content types
ALLOWED_CONTENT_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
}

# Max file size (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024


def lambda_handler(event, context):
    """
    POST /api/upload
    Generates a pre-signed URL for uploading an image to S3

    Expected request body:
    {
        "contentType": "image/jpeg",
        "category": "about" or "posts"
    }

    Returns:
    {
        "uploadUrl": "https://...",  # Pre-signed URL for PUT upload
        "imageUrl": "/content/...",  # URL to access the image after upload
        "key": "content/..."         # S3 key for reference
    }
    """
    try:
        # Get user info from authorizer context
        # For HTTP API with Lambda authorizer, context is under 'lambda' key
        authorizer_context = event.get('requestContext', {}).get('authorizer', {}).get('lambda', {})
        user_email = authorizer_context.get('email', 'unknown')

        print(f"Event: {json.dumps(event)}")
        print(f"Upload request from user: {user_email}")

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        content_type = body.get('contentType', '').lower()
        category = body.get('category', 'about')

        # Validate content type
        if content_type not in ALLOWED_CONTENT_TYPES:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': f'Invalid content type. Allowed: {", ".join(ALLOWED_CONTENT_TYPES.keys())}'
                })
            }

        # Validate category
        if category not in ['about', 'posts']:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': 'Invalid category. Allowed: about, posts'
                })
            }

        # Generate unique filename
        file_extension = ALLOWED_CONTENT_TYPES[content_type]
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{timestamp}-{unique_id}{file_extension}"

        # S3 key: content/{category}/{filename}
        # This maps to CloudFront /content/{category}/{filename}
        s3_key = f"content/{category}/{filename}"

        # Generate pre-signed URL for PUT upload
        upload_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': s3_key,
                'ContentType': content_type,
            },
            ExpiresIn=300  # 5 minutes
        )

        # The public URL will be served via CloudFront
        image_url = f"/content/{category}/{filename}"

        print(f"Generated upload URL for key: {s3_key}")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
            },
            'body': json.dumps({
                'uploadUrl': upload_url,
                'imageUrl': image_url,
                'key': s3_key
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
        print(f"Error generating upload URL: {str(e)}")
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
