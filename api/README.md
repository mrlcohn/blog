# Blog API

Python-based serverless API for the blog backend using AWS Lambda, API Gateway, DynamoDB, and S3.

## Architecture

```
API Gateway → Lambda (Python 3.12) → DynamoDB + S3
```

## API Endpoints

All endpoints are accessible via `https://yourdomain.com/api/*` (routed through CloudFront).

### GET /api/blogs
Get all published blog posts (summary for cards).

**Response**:
```json
{
  "posts": [
    {
      "slug": "my-first-post",
      "title": "My First Post",
      "author": "Your Name",
      "publishDate": "2026-01-11T10:00:00Z",
      "tags": ["aws", "terraform"],
      "summary": "A brief summary...",
      "imageKey": "posts/my-first-post/hero.jpg"
    }
  ],
  "count": 1
}
```

### GET /api/blog/{slug}
Get a single blog post with full content.

**Response**:
```json
{
  "slug": "my-first-post",
  "title": "My First Post",
  "author": "Your Name",
  "publishDate": "2026-01-11T10:00:00Z",
  "lastModifiedDate": "2026-01-11T12:00:00Z",
  "tags": ["aws", "terraform"],
  "summary": "A brief summary...",
  "content": "<full HTML or markdown content>",
  "contentType": "html",
  "imageKey": "posts/my-first-post/hero.jpg"
}
```

**Error**: Returns 404 if post not found or not published.

### GET /api/about
Get about me page content.

**Response**:
```json
{
  "name": "Your Name",
  "bio": "Brief bio...",
  "social": {
    "github": "https://github.com/...",
    "linkedin": "https://linkedin.com/in/..."
  },
  "content": "Full about me content..."
}
```

## Lambda Functions

### GetBlogCards
**File**: `lambdas/get_blog_cards/lambda_function.py`

Queries DynamoDB GSI to get all published posts sorted by publish date (newest first).

**Environment Variables**:
- `DYNAMODB_TABLE` - DynamoDB table name
- `S3_BUCKET` - S3 bucket for content

### GetBlog
**File**: `lambdas/get_blog/lambda_function.py`

Gets metadata from DynamoDB and content from S3 for a single post.

**Environment Variables**:
- `DYNAMODB_TABLE` - DynamoDB table name
- `S3_BUCKET` - S3 bucket for content

### GetAbout
**File**: `lambdas/get_about/lambda_function.py`

Reads about me content from S3 (`about/about.json`).

**Environment Variables**:
- `S3_BUCKET` - S3 bucket for content

## Development

### Local Testing

Test Lambda functions locally:

```bash
cd lambdas/get_blog_cards
python3 -c "
import lambda_function
import os
os.environ['DYNAMODB_TABLE'] = 'blog-posts'
os.environ['S3_BUCKET'] = 'your-bucket'
print(lambda_function.lambda_handler({}, {}))
"
```

### Dependencies

All Lambda functions use only boto3 (included in Lambda runtime). No additional dependencies required.

## Data Structure

### DynamoDB Schema

See `infrastructure/api/dynamodb.tf` for table definition.

**Example Item**:
```python
{
  "PK": "POST#my-first-post",  # Partition key
  "SK": "v0",                   # Sort key
  "title": "My First Post",
  "author": "Your Name",
  "publishDate": "2026-01-11T10:00:00Z",
  "tags": ["aws", "terraform"],
  "summary": "Brief summary...",
  "contentKey": "posts/my-first-post/content.html",
  "status": "published",
  "GSI1PK": "POST",            # For GSI queries
  "GSI1SK": "2026-01-11T10:00:00Z"
}
```

### S3 Content Structure

```
s3://your-api-bucket/
  posts/
    my-first-post/
      content.html
      hero.jpg
  about/
    about.json
```

## Error Handling

All Lambda functions return proper HTTP status codes:
- `200` - Success
- `400` - Bad request (missing parameters)
- `404` - Not found
- `500` - Internal server error

## CORS

CORS is configured in API Gateway to allow:
- Origin: `https://yourdomain.com`
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: content-type, authorization

## Future Enhancements

- [ ] Add authentication (Cognito) for POST/PUT/DELETE
- [ ] Add pagination for blog list
- [ ] Add search functionality
- [ ] Add blog post creation/edit endpoints
- [ ] Add image upload functionality
- [ ] Add draft preview capability
