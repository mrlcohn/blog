"""
Lambda function to update About Me page content.
Protected by Cognito authorizer - requires valid JWT token.
"""
import json
import boto3
import os
import logging
import traceback
from datetime import datetime

# Configure structured JSON logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
bucket_name = os.environ.get('S3_BUCKET', '')
ABOUT_KEY = 'about/about.json'


def log_structured(level, message, **kwargs):
    """Helper for structured JSON logging"""
    log_entry = {
        'message': message,
        'function': 'UpdateAbout',
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
        import base64
        body_str = event.get('body', '{}')
        if event.get('isBase64Encoded', False):
            log_structured('info', 'Decoding base64 body', request_id=request_id)
            body_str = base64.b64decode(body_str).decode('utf-8')

        log_structured('info', 'Parsing body',
            request_id=request_id,
            body_preview=body_str[:200] if body_str else 'empty'
        )

        body = json.loads(body_str)

        # Validate required fields
        name = body.get('name', '').strip()
        bio = body.get('bio', '').strip()
        content = body.get('content', '').strip()
        image_url = body.get('imageUrl', '').strip()

        log_structured('info', 'Parsed fields',
            request_id=request_id,
            has_name=bool(name),
            has_bio=bool(bio),
            has_content=bool(content),
            has_image_url=bool(image_url)
        )

        if not name:
            log_structured('warning', 'Validation failed: name required', request_id=request_id)
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
        log_structured('info', 'Writing to S3',
            request_id=request_id,
            bucket=bucket_name,
            key=ABOUT_KEY
        )

        s3.put_object(
            Bucket=bucket_name,
            Key=ABOUT_KEY,
            Body=json.dumps(about_data).encode('utf-8'),
            ContentType='application/json'
        )

        log_structured('info', 'Successfully updated about page',
            request_id=request_id,
            user_email=user_email
        )

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
