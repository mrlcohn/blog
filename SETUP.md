# Quick Setup Guide

This guide will get your blog deployed to AWS in minutes.

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Terraform >= 1.6.0
- Node.js 20+
- GitHub repository

## Step 1: Initialize Infrastructure Backend (One-time)

```bash
cd infrastructure
./setup.sh
```

This script will:
- Create S3 bucket for Terraform state
- Enable versioning and encryption
- Create DynamoDB table for state locking

## Step 2: Configure Terraform

### Edit backend.tf

Replace placeholder values:
```hcl
backend "s3" {
  bucket         = "your-terraform-state-bucket"  # Use the bucket from setup.sh
  key            = "blog/terraform.tfstate"
  region         = "us-east-1"
  dynamodb_table = "terraform-lock-table"
  encrypt        = true
}
```

### Create terraform.tfvars

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
aws_region                 = "us-east-1"
github_repo                = "YOUR_USERNAME/blog"
terraform_state_bucket_arn = "arn:aws:s3:::your-terraform-state-bucket"
terraform_lock_table_arn   = "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/terraform-lock-table"
blog_bucket_name           = "my-blog-website"
```

**How to get your AWS Account ID:**
```bash
aws sts get-caller-identity --query Account --output text
```

## Step 3: Deploy Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

**Save the outputs!** You'll need:
- `github_actions_role_arn` - For GitHub secrets

## Step 4: Configure GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_ROLE_ARN` | Role ARN from Terraform output | `arn:aws:iam::123456789012:role/GitHubActionsRole` |
| `BLOG_BUCKET_NAME` | Your blog bucket name | `my-blog-website` |

## Step 5: Deploy!

Push to main branch:

```bash
git add .
git commit -m "Initial infrastructure setup"
git push origin main
```

GitHub Actions will automatically:
1. Authenticate to AWS using OIDC
2. Apply Terraform configuration
3. Build React app
4. Deploy to S3

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

## Verify Deployment

After GitHub Actions completes:

```bash
# Get your bucket website endpoint
aws s3api get-bucket-website --bucket YOUR_BUCKET_NAME

# Or visit directly
# http://YOUR_BUCKET_NAME.s3-website-us-east-1.amazonaws.com
```

## Troubleshooting

### "Backend initialization failed"
- Ensure S3 bucket exists
- Check bucket name in `backend.tf` matches actual bucket
- Verify AWS credentials are configured

### "Access Denied" in GitHub Actions
- Check `AWS_ROLE_ARN` secret is correct
- Verify `github_repo` in terraform.tfvars matches your repository
- Ensure OIDC provider was created successfully

### Terraform state locked
```bash
# List locks
aws dynamodb scan --table-name terraform-lock-table

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

## Next Steps

1. **Custom Domain**: Configure Route 53
2. **CDN**: Add CloudFront distribution
3. **SSL**: Request ACM certificate
4. **CMS**: Add backend API for blog post management

## Security Checklist

- [ ] Never commit `terraform.tfvars`
- [ ] Never commit AWS credentials
- [ ] Verify OIDC is working (no credentials in GitHub)
- [ ] Enable MFA on AWS account
- [ ] Review IAM policies for least privilege
- [ ] Enable CloudTrail for audit logging

## Cost Estimate

**Monthly costs (approximate):**
- S3 storage: ~$0.023/GB
- S3 requests: ~$0.005/1000 requests
- DynamoDB: Free tier (on-demand)
- Data transfer: First 100GB free

**Typical blog:** < $1/month without CloudFront

---

Need help? Check [infrastructure/README.md](infrastructure/README.md) for detailed documentation.
