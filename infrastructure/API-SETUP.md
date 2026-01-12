# API Infrastructure Setup Guide

This guide covers the backend API infrastructure: Lambda functions, API Gateway, DynamoDB, and S3 for blog content.

## Architecture

```
CloudFront → API Gateway HTTP API → Lambda (Python) → DynamoDB + S3
               /api/blogs              GetBlogCards      (metadata + summary)
               /api/blog/:slug         GetBlog           (full post + content)
               /api/about              GetAbout          (about page content)
```

## What Was Created

### Infrastructure (Terraform)

**infrastructure/api/**
- `dynamodb.tf` - DynamoDB table with GSI for blog posts
- `s3.tf` - S3 bucket for blog content and assets (private)
- `iam.tf` - IAM roles for Lambda execution
- `lambda.tf` - Three Lambda functions (Python 3.12)
- `apigateway.tf` - API Gateway HTTP API with routes
- `outputs.tf` - Infrastructure outputs

### Lambda Functions (Python)

**api/lambdas/**
- `get_blog_cards/` - Returns list of blog posts for homepage cards
- `get_blog/` - Returns full blog post with content from S3
- `get_about/` - Returns about me page content from S3

### API Routes

| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| GET | `/blogs` | GetBlogCards | List all published posts (summary for cards) |
| GET | `/blog/{slug}` | GetBlog | Get single post with full content |
| GET | `/about` | GetAbout | Get about me page content |

## DynamoDB Schema

**Table**: `blog-posts`
- **PK**: `POST#<slug>` (partition key)
- **SK**: `v0` (sort key for versioning)
- **GSI1PK**: `POST` (for querying all posts)
- **GSI1SK**: `<publishDate>` (ISO 8601, for sorting by date)

**Attributes**:
```python
{
  "PK": "POST#my-first-post",
  "SK": "v0",
  "version": 1,
  "s3VersionId": "abc123...",
  "title": "My First Post",
  "author": "Your Name",
  "publishDate": "2026-01-11T10:00:00Z",
  "lastModifiedDate": "2026-01-11T12:00:00Z",
  "tags": ["aws", "terraform"],
  "summary": "A brief summary for the card...",
  "contentKey": "posts/my-first-post/content.html",
  "contentType": "html",
  "status": "published",
  "imageKey": "posts/my-first-post/hero.jpg",
  "GSI1PK": "POST",
  "GSI1SK": "2026-01-11T10:00:00Z"
}
```

## S3 Content Structure

**Bucket**: `<api_bucket_name>`
```
posts/
  my-first-post/
    content.html       # Full post content
    hero.jpg          # Hero image (optional)
  another-post/
    content.md        # Markdown format
about/
  about.json         # About me page data
assets/
  images/
    photo.jpg
```

## Required GitHub Variables

Add these to GitHub Actions variables:

1. `API_BUCKET_NAME` - S3 bucket for blog content (e.g., `your-blog-api-content`)

Existing variables that are reused:
- `DOMAIN_NAME`
- `ROUTE53_ZONE_NAME`
- `AWS_REGION`
- `TF_STATE_BUCKET`
- `TF_LOCK_TABLE`
- Secret: `AWS_ROLE_ARN`

## Deployment Steps

### 1. Update GitHub IAM Role (One-time)

Apply the updated IAM role with API infrastructure permissions:

```bash
cd infrastructure/github-iam
terraform init -backend-config=backend-config.hcl
terraform plan -out=tfplan
terraform apply tfplan
```

### 2. Configure GitHub Variables

Add `API_BUCKET_NAME` in GitHub UI (Settings → Secrets and variables → Actions → Variables)

### 3. Deploy API Infrastructure

```bash
cd infrastructure/api
cp backend-config.hcl.example backend-config.hcl
cp terraform.tfvars.example terraform.tfvars
# Edit both files with your values

terraform init -backend-config=backend-config.hcl
terraform plan -out=tfplan
terraform apply tfplan
```

### 4. Get API Gateway Endpoint

```bash
terraform output api_gateway_endpoint
```

This will be something like: `https://abc123xyz.execute-api.us-east-1.amazonaws.com`

### 5. Test the API

```bash
# Get all posts
curl https://<api-endpoint>/blogs

# Get single post
curl https://<api-endpoint>/blog/my-first-post

# Get about
curl https://<api-endpoint>/about
```

Currently returns empty results since no data exists yet.

## How It Works

### Lambda → DynamoDB Flow

1. **GetBlogCards** queries GSI1 (`GSI1PK=POST`) to get all posts sorted by publish date
2. Filters to only `status=published` posts
3. Returns summary data for card display (title, author, date, tags, summary, image)

### Lambda → S3 Flow

1. **GetBlog** gets metadata from DynamoDB by slug (`PK=POST#<slug>`)
2. Retrieves full content from S3 using `contentKey`
3. Merges metadata + content and returns JSON

### Lambda → S3 (About)

1. **GetAbout** reads `about/about.json` from S3
2. Returns default structure if file doesn't exist

## CORS Configuration

API Gateway is configured to allow:
- **Origins**: `https://<your-domain>`
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: content-type, authorization

You'll need to update your React frontend to call these endpoints.

## Next Steps

1. ✅ API infrastructure deployed
2. 🔄 Integrate API Gateway with CloudFront (route `/api/*` to API Gateway)
3. 🔄 Update React frontend to call API endpoints
4. 🔄 Add sample blog post data to DynamoDB
5. 🔄 Add authentication (Cognito) for POST/PUT/DELETE
6. 🔄 Create admin UI for writing posts

## CloudFront Integration (Next Phase)

To serve the API under `https://yourdomain.com/api/*`:

1. Add API Gateway as a CloudFront origin
2. Add cache behavior for `/api/*` path pattern
3. Configure to forward headers and disable caching for API calls

This will be covered in the next phase.

## Local Testing

You can test Lambda functions locally:

```bash
cd api/lambdas/get_blog_cards
python3 -c "
import lambda_function
import os
os.environ['DYNAMODB_TABLE'] = 'blog-posts'
os.environ['S3_BUCKET'] = 'your-bucket'
print(lambda_function.lambda_handler({}, {}))
"
```

## Troubleshooting

### Lambda Permission Errors
- Check that IAM role has DynamoDB and S3 permissions
- Verify environment variables are set correctly

### API Gateway 403 Errors
- Check Lambda permission allows API Gateway to invoke
- Verify CORS configuration

### Empty Results
- DynamoDB table is empty - add sample data first
- S3 bucket has no content files

## Cost Estimate

- **Lambda**: Free tier includes 1M requests/month
- **API Gateway**: Free tier includes 1M requests/month
- **DynamoDB**: Free tier includes 25GB storage + 25 WCU/RCU
- **S3**: Minimal costs for storage (<$1/month for blog content)

Total: Essentially free for a personal blog with low traffic.
