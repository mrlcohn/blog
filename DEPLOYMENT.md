# Blog Authentication Deployment Guide

This guide walks through deploying the Cognito authentication system for your blog.

## Architecture Overview

The system includes:
- **Cognito User Pool**: Manages user authentication
- **Lambda Authorizer**: Validates JWT tokens from Cognito
- **POST /blogs endpoint**: Creates new blog posts (protected)
- **Admin Page**: Web interface for writing and publishing posts

## Deployment Steps

### 1. Deploy Infrastructure

Navigate to the API infrastructure directory and apply Terraform:

```bash
cd infrastructure/api
terraform init
terraform plan
terraform apply
```

This will create:
- Cognito User Pool and Client
- Lambda Authorizer function
- CreateBlogPost Lambda function
- API Gateway routes with authorization

### 2. Get Terraform Outputs

After deployment, get the Cognito configuration:

```bash
terraform output cognito_user_pool_id
terraform output cognito_client_id
terraform output cognito_domain
terraform output api_gateway_endpoint
```

### 3. Configure Frontend Environment

Create a `.env` file in the `frontend/` directory:

```bash
cd ../../frontend
cp .env.example .env
```

Edit `.env` with your Terraform outputs:

```env
VITE_API_URL=<api_gateway_endpoint>
VITE_COGNITO_USER_POOL_ID=<cognito_user_pool_id>
VITE_COGNITO_CLIENT_ID=<cognito_client_id>
VITE_COGNITO_DOMAIN=<cognito_domain>
VITE_AWS_REGION=us-east-1
```

### 4. Create Admin User

Create a user in the Cognito User Pool:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <your-pool-id> \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
  --temporary-password 'TempPass123!' \
  --message-action SUPPRESS
```

Set a permanent password:

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id <your-pool-id> \
  --username admin@example.com \
  --password 'YourSecurePassword123!' \
  --permanent
```

### 5. Test Locally

Start the frontend development server:

```bash
npm run dev
```

Navigate to `http://localhost:5173/admin` and log in with your admin credentials.

### 6. Deploy Frontend

Build and deploy the frontend:

```bash
npm run build
# Upload to S3 or your hosting provider
```

## Usage

### Creating a Blog Post

1. Navigate to `/admin` on your blog
2. Log in with Cognito credentials
3. Fill out the blog post form:
   - Title (required)
   - Slug (auto-generated or custom)
   - Author (required)
   - Summary (required)
   - Content in Markdown (required)
   - Tags (optional)
   - Status: Draft or Published
4. Click "Create Blog Post"

### How It Works

1. **Authentication Flow**:
   - User clicks "Log In" → Redirects to Cognito hosted UI
   - User enters credentials → Cognito validates
   - Cognito redirects back with JWT tokens
   - Tokens stored in localStorage

2. **Creating a Post**:
   - Frontend sends POST request to `/blogs` with Authorization header
   - API Gateway invokes Lambda Authorizer
   - Authorizer validates JWT token with Cognito
   - If valid, request proceeds to CreateBlogPost Lambda
   - Lambda writes metadata to DynamoDB and content to S3
   - Response sent back to frontend

### API Endpoints

- `GET /blogs` - List all published blog posts (public)
- `GET /blog/{slug}` - Get specific blog post (public)
- `POST /blogs` - Create new blog post (authenticated)

## Security Features

- JWT token validation with Cognito
- Token expiration (60 minutes for access/id tokens)
- HTTPS-only in production
- CORS configured for your domain
- Lambda authorizer denies unauthorized requests

## Troubleshooting

### "Not authenticated" error
- Check that tokens are stored in localStorage
- Verify token hasn't expired (60 min lifetime)
- Try logging out and back in

### "Invalid token" error
- Verify Cognito environment variables are correct
- Check that User Pool ID and Client ID match
- Ensure authorizer Lambda has correct configuration

### CORS errors
- Verify your domain is in the Cognito callback URLs
- Check API Gateway CORS configuration
- Ensure you're using the correct API URL

## Next Steps

- Set up password reset flow
- Add user management (create/delete users)
- Implement blog post editing (PUT endpoint)
- Add image upload functionality
- Set up email notifications for new posts
