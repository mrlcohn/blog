import json
import os
import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError

# Cognito settings
USER_POOL_ID = os.environ['USER_POOL_ID']
APP_CLIENT_ID = os.environ['APP_CLIENT_ID']
# AWS_REGION is automatically provided by Lambda
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# JWKS URL for token verification
JWKS_URL = f'https://cognito-idp.{AWS_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'

def lambda_handler(event, context):
    """
    Lambda Authorizer for API Gateway to verify Cognito JWT tokens
    """
    print(f"Event: {json.dumps(event)}")

    try:
        # Extract token from Authorization header
        token = event.get('headers', {}).get('authorization', '')

        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]

        if not token:
            print("No token provided")
            return generate_policy('user', 'Deny', event['routeArn'])

        # Verify and decode the token
        jwks_client = PyJWKClient(JWKS_URL)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        decoded_token = jwt.decode(
            token,
            signing_key.key,
            algorithms=['RS256'],
            audience=APP_CLIENT_ID,
            options={
                'verify_exp': True,
                'verify_aud': True
            }
        )

        print(f"Token verified for user: {decoded_token.get('sub')}")

        # Token is valid - allow the request
        return generate_policy(
            decoded_token.get('sub'),
            'Allow',
            event['routeArn'],
            decoded_token
        )

    except InvalidTokenError as e:
        print(f"Invalid token: {str(e)}")
        return generate_policy('user', 'Deny', event['routeArn'])
    except Exception as e:
        print(f"Error: {str(e)}")
        return generate_policy('user', 'Deny', event['routeArn'])


def generate_policy(principal_id, effect, resource, token_data=None):
    """
    Generate IAM policy for API Gateway
    """
    auth_response = {
        'principalId': principal_id
    }

    if effect and resource:
        policy_document = {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Action': 'execute-api:Invoke',
                    'Effect': effect,
                    'Resource': resource
                }
            ]
        }
        auth_response['policyDocument'] = policy_document

    # Add user info to context
    if token_data:
        auth_response['context'] = {
            'userId': token_data.get('sub', ''),
            'email': token_data.get('email', ''),
            'username': token_data.get('cognito:username', '')
        }

    return auth_response
