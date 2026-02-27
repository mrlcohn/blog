"""
Lambda function to generate pre-signed URLs for image uploads.
Protected by Cognito authorizer - requires valid JWT token.
"""
import json
import boto3
import os
import uuid
import logging
import traceback
import base64
from datetime import datetime

# Configure structured JSON logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
bucket_name = os.environ.get('S3_BUCKET', '')
domain_name = os.environ.get('DOMAIN_NAME', '')


def log_structured(level, message, **kwargs):
    """Helper for structured JSON logging"""
    log_entry = {
        'message': message,
        'function': 'UploadImage',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        **kwargs
    }
    if level == 'error':
        logger.error(json.dumps(log_entry))
    elif level == 'warning':
        logger.warning(json.dumps(log_entry))
    else:
        logger.info(json.dumps(log_entry))

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
    request_id = context.aws_request_id if context else 'unknown'

    try:
        # Log incoming event for debugging
        log_structured('info', 'Request received',
            request_id=request_id,
            http_method=event.get('requestContext', {}).get('http', {}).get('method'),
            path=event.get('requestContext', {}).get('http', {}).get('path'),
            has_body=bool(event.get('body')),
            is_base64=event.get('isBase64Encoded', False),
            bucket=bucket_name
        )

        # Get user info from authorizer context
        # For HTTP API with Lambda authorizer, context is under 'lambda' key
        authorizer_context = event.get('requestContext', {}).get('authorizer', {}).get('lambda', {})
        user_email = authorizer_context.get('email', 'unknown')

        log_structured('info', 'Authorizer context',
            request_id=request_id,
            user_email=user_email,
            authorizer_keys=list(event.get('requestContext', {}).get('authorizer', {}).keys())
        )

        # Parse request body (handle base64 encoding if present)
        body_str = event.get('body', '{}')
        if event.get('isBase64Encoded', False):
            log_structured('info', 'Decoding base64 body', request_id=request_id)
            body_str = base64.b64decode(body_str).decode('utf-8')

        body = json.loads(body_str)

        content_type = body.get('contentType', '').lower()
        category = body.get('category', 'about')

        log_structured('info', 'Parsed request',
            request_id=request_id,
            content_type=content_type,
            category=category
        )

        # Validate content type
        if content_type not in ALLOWED_CONTENT_TYPES:
            log_structured('warning', 'Invalid content type',
                request_id=request_id,
                content_type=content_type
            )
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
            log_structured('warning', 'Invalid category',
                request_id=request_id,
                category=category
            )
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

        log_structured('info', 'Generating presigned URL',
            request_id=request_id,
            bucket=bucket_name,
            key=s3_key,
            content_type=content_type
        )

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

        log_structured('info', 'Successfully generated upload URL',
            request_id=request_id,
            s3_key=s3_key,
            image_url=image_url
        )

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
