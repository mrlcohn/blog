"""
Lambda function to get About Me page content.
Returns about me information from S3.
"""
import json
import boto3
import os

s3 = boto3.client('s3')
bucket_name = os.environ['S3_BUCKET']
ABOUT_KEY = 'about/about.json'


def lambda_handler(event, context):
    """
    GET /api/about
    Returns about me page content
    """
    try:
        # Get about content from S3
        try:
            s3_response = s3.get_object(Bucket=bucket_name, Key=ABOUT_KEY)
            about_data = json.loads(s3_response['Body'].read().decode('utf-8'))
        except s3.exceptions.NoSuchKey:
            # Return default if file doesn't exist yet
            about_data = {
                'name': '',
                'bio': '',
                'social': {},
                'content': ''
            }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
            },
            'body': json.dumps(about_data)
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
