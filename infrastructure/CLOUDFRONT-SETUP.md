# CloudFront + ACM Setup Guide

This guide covers the CloudFront distribution and ACM certificate setup for your blog.

## What Was Added

### New Terraform Resources

1. **ACM Certificate** (`acm.tf`)
   - SSL/TLS certificate for your custom domain
   - Created in `us-east-1` (required for CloudFront)
   - Automatic DNS validation via Route53

2. **CloudFront Distribution** (`cloudfront.tf`)
   - CDN for your S3-hosted frontend
   - HTTPS-only (redirects HTTP to HTTPS)
   - Custom domain with ACM certificate
   - Caching for static assets (1 hour default, 24 hours max)
   - SPA routing support (404/403 → index.html)

3. **Route53 Records** (`data.tf`, `cloudfront.tf`)
   - Data source to lookup existing hosted zone
   - A record (alias) pointing to CloudFront distribution
   - CNAME records for certificate validation

4. **Outputs** (`outputs.tf`)
   - CloudFront distribution ID
   - CloudFront domain name
   - Blog URL with custom domain

### Updated Files

1. **Variables** (`variables.tf`)
   - `domain_name` - Your blog domain (e.g., blog.example.com)
   - `route53_zone_name` - Your Route53 hosted zone (e.g., example.com)

2. **Backend** (`backend.tf`)
   - Added `us_east_1` provider alias for ACM

3. **GitHub IAM Role** (`infrastructure/github-iam/github-actions-role.tf`)
   - Added CloudFront permissions
   - Added ACM permissions
   - Added Route53 permissions

4. **GitHub Workflow** (`.github/workflows/deploy.yml`)
   - Added domain_name and route53_zone_name to terraform.tfvars
   - CloudFront cache invalidation already present

## Required GitHub Configuration

### Add these GitHub Variables

Go to your repository → Settings → Secrets and variables → Actions → Variables:

1. `DOMAIN_NAME` - Your blog domain (e.g., `blog.yourdomain.com`)
2. `ROUTE53_ZONE_NAME` - Your Route53 zone (e.g., `yourdomain.com`)
3. `CLOUDFRONT_DISTRIBUTION_ID` - Will be populated after first deploy (see Terraform outputs)

### Existing Variables (should already be set)

- `BLOG_BUCKET_NAME` - S3 bucket name
- Environment variable `AWS_REGION` - Should be `us-east-1`
- Environment variable `TF_STATE_BUCKET` - Terraform state bucket
- Environment variable `TF_LOCK_TABLE` - DynamoDB lock table
- Secret `AWS_ROLE_ARN` - GitHub Actions IAM role ARN

## Deployment Steps

### 1. Update GitHub IAM Role (One-time)

First, apply the updated GitHub IAM role with new permissions:

```bash
cd infrastructure/github-iam
terraform init -backend-config=backend-config.hcl
terraform plan -out=tfplan
terraform apply tfplan
```

### 2. Configure GitHub Variables

Add the new variables in GitHub UI:
- `DOMAIN_NAME`
- `ROUTE53_ZONE_NAME`

### 3. Deploy Blog Infrastructure

Either:
- **Push to main** - GitHub Actions will run automatically
- **Manual trigger** - Use workflow_dispatch in GitHub UI
- **Local deploy**:
  ```bash
  cd infrastructure/blog
  terraform init -backend-config=backend-config.hcl
  terraform plan -out=tfplan
  terraform apply tfplan
  ```

### 4. Get CloudFront Distribution ID

After deployment, get the distribution ID:

```bash
cd infrastructure/blog
terraform output cloudfront_distribution_id
```

Add this value to GitHub Variables as `CLOUDFRONT_DISTRIBUTION_ID`.

### 5. Access Your Blog

Your blog will be available at:
- `https://yourdomain.com` (or whatever you configured)
- CloudFront distribution may take 10-15 minutes to fully deploy

## Architecture

```
User → Route53 (DNS) → CloudFront (CDN) → S3 Static Website
                          ↓
                     ACM Certificate
                     (HTTPS/TLS)
```

## How It Works

### HTTPS Only
- HTTP requests are automatically redirected to HTTPS
- Minimum TLS version: 1.2
- Certificate managed by ACM

### Caching
- Static files (HTML/JS/CSS) cached for 1 hour by default
- Maximum cache time: 24 hours
- Cache invalidation runs automatically on each deploy
- API calls (future Lambda endpoints) won't go through CloudFront

### SPA Routing
- 404/403 errors return `index.html` with 200 status
- Allows React Router to handle client-side routing
- Users can bookmark/refresh any route

## Cost Considerations

- **CloudFront**: Free tier includes 1TB data transfer and 10M requests per month
- **ACM Certificate**: Free
- **Route53**: $0.50/month per hosted zone + $0.40 per million queries
- **S3**: Minimal costs for static website hosting

## Troubleshooting

### Certificate validation stuck?
- Check that Route53 hosted zone matches `route53_zone_name`
- DNS validation records should be created automatically
- Validation can take 5-30 minutes

### CloudFront not updating?
- CloudFront caches files - wait for cache to expire or run invalidation
- Invalidation runs automatically on deploy
- Manual invalidation: `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`

### 403/404 errors?
- Check S3 bucket policy allows public read
- Verify CloudFront origin is S3 website endpoint (not bucket endpoint)
- Check that files were deployed to S3

## Next Steps

After CloudFront is working:
1. ✅ Frontend served via CloudFront with HTTPS
2. 🔄 Add backend (Lambda + DynamoDB + S3 for content)
3. 🔄 Add authentication (Cognito)
4. 🔄 Add admin UI for writing posts
