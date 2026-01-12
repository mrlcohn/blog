# Deployment Checklist

Complete checklist for deploying the blog infrastructure and automation.

## Prerequisites

- [ ] AWS account created
- [ ] GitHub repository created
- [ ] Git repository cloned locally
- [ ] AWS CLI installed and configured
- [ ] Terraform installed (v1.6.0+)
- [ ] Node.js installed (v20+)

## Phase 1: Bootstrap Infrastructure

**Goal**: Set up Terraform state backend and OIDC provider.

- [ ] Create S3 bucket and DynamoDB table for Terraform state
  ```bash
  cd infrastructure/bootstrap
  cp backend-config.hcl.example backend-config.hcl
  # Edit backend-config.hcl with your values
  terraform init -backend-config=backend-config.hcl
  terraform plan -out=tfplan
  terraform apply tfplan
  ```

- [ ] Verify OIDC provider created
  ```bash
  terraform output oidc_provider_arn
  ```

**State file**: `s3://your-bucket/blog/bootstrap.tfstate`

## Phase 2: GitHub IAM Role

**Goal**: Create IAM role for GitHub Actions with required permissions.

- [ ] Create terraform.tfvars with repository info
  ```bash
  cd infrastructure/github-iam
  cp terraform.tfvars.example terraform.tfvars
  # Edit terraform.tfvars with your GitHub org/repo
  ```

- [ ] Deploy IAM role
  ```bash
  cp backend-config.hcl.example backend-config.hcl
  # Edit backend-config.hcl
  terraform init -backend-config=backend-config.hcl
  terraform plan -out=tfplan
  terraform apply tfplan
  ```

- [ ] Copy role ARN for GitHub secret
  ```bash
  terraform output github_actions_role_arn
  ```

**State file**: `s3://your-bucket/blog/github-iam.tfstate`

## Phase 3: Configure GitHub

**Goal**: Set up secrets and variables for automated deployment.

### Add Secret

Go to GitHub: Settings → Secrets and variables → Actions → Secrets → New repository secret

- [ ] `AWS_ROLE_ARN` = (output from Phase 2)

### Add Variables

Go to GitHub: Settings → Secrets and variables → Actions → Variables → New repository variable

- [ ] `AWS_REGION` = `us-east-1` (or your region)
- [ ] `TF_STATE_BUCKET` = (your Terraform state bucket name)
- [ ] `TF_LOCK_TABLE` = `terraform-state-lock`
- [ ] `BLOG_BUCKET_NAME` = (choose a unique name for frontend S3 bucket)
- [ ] `API_BUCKET_NAME` = (choose a unique name for API content S3 bucket)
- [ ] `DOMAIN_NAME` = `blog.example.com` (or empty string for now)
- [ ] `ROUTE53_ZONE_NAME` = `example.com` (or empty string for now)
- [ ] `API_GATEWAY_ENDPOINT` = (leave empty, will set after API deployment)
- [ ] `CLOUDFRONT_DISTRIBUTION_ID` = (leave empty, will set after blog deployment)

**Note**: Domain-related variables can be set to empty strings initially if you don't have a domain yet.

## Phase 4: Deploy Blog Infrastructure (Optional if using GitHub Actions)

**Goal**: Deploy S3, CloudFront, ACM, and Route53 resources.

**Option A: Via GitHub Actions (Recommended)**
- [ ] Push code to main branch or trigger workflow manually
- [ ] Wait for `terraform - blog` job to complete
- [ ] Get CloudFront distribution ID from Terraform outputs

**Option B: Locally**
- [ ] Create terraform.tfvars
  ```bash
  cd infrastructure/blog
  cp terraform.tfvars.example terraform.tfvars
  # Edit terraform.tfvars
  ```

- [ ] Deploy infrastructure
  ```bash
  cp backend-config.hcl.example backend-config.hcl
  # Edit backend-config.hcl
  terraform init -backend-config=backend-config.hcl
  terraform plan -out=tfplan
  terraform apply tfplan
  ```

- [ ] Get CloudFront distribution ID
  ```bash
  terraform output cloudfront_distribution_id
  ```

- [ ] Add `CLOUDFRONT_DISTRIBUTION_ID` to GitHub variables

**State file**: `s3://your-bucket/blog/blog.tfstate`

**Note**: If using a custom domain, ACM certificate validation can take 20-30 minutes.

## Phase 5: Deploy API Infrastructure (Optional if using GitHub Actions)

**Goal**: Deploy Lambda functions, API Gateway, DynamoDB, and S3 for content.

**Option A: Via GitHub Actions (Recommended)**
- [ ] Push code to main branch or trigger workflow manually
- [ ] Wait for `terraform - api` job to complete
- [ ] Get API Gateway endpoint from Terraform outputs

**Option B: Locally**
- [ ] Create terraform.tfvars
  ```bash
  cd infrastructure/api
  cp terraform.tfvars.example terraform.tfvars
  # Edit terraform.tfvars
  ```

- [ ] Deploy infrastructure
  ```bash
  cp backend-config.hcl.example backend-config.hcl
  # Edit backend-config.hcl
  terraform init -backend-config=backend-config.hcl
  terraform plan -out=tfplan
  terraform apply tfplan
  ```

- [ ] Get API Gateway endpoint
  ```bash
  terraform output api_gateway_endpoint
  ```

- [ ] Add `API_GATEWAY_ENDPOINT` to GitHub variables

**State file**: `s3://your-bucket/blog/api.tfstate`

## Phase 6: Re-deploy Blog with API Integration

**Goal**: Update blog infrastructure to route `/api/*` to API Gateway.

- [ ] Ensure `API_GATEWAY_ENDPOINT` is set in GitHub variables
- [ ] Trigger workflow manually or push a change to `infrastructure/blog/`
- [ ] Verify CloudFront has both S3 and API Gateway origins

## Phase 7: Deploy Frontend

**Goal**: Build React app and deploy to S3.

**Option A: Via GitHub Actions (Recommended)**
- [ ] Push code to main branch or trigger workflow manually
- [ ] Wait for `deploy` job to complete
- [ ] Verify CloudFront cache invalidation completed

**Option B: Locally**
- [ ] Build frontend
  ```bash
  cd frontend
  npm ci
  npm run build
  ```

- [ ] Deploy to S3
  ```bash
  aws s3 sync dist/ s3://your-blog-bucket --delete
  ```

- [ ] Invalidate CloudFront cache
  ```bash
  aws cloudfront create-invalidation \
    --distribution-id YOUR_DIST_ID \
    --paths "/*"
  ```

## Phase 8: Verify Deployment

- [ ] Visit your CloudFront URL or custom domain
- [ ] Verify frontend loads (should show "No posts yet")
- [ ] Test API endpoints:
  ```bash
  # Via CloudFront
  curl https://yourdomain.com/api/blogs

  # Or via API Gateway directly
  curl https://your-api-endpoint/blogs
  ```
- [ ] Check browser console for errors
- [ ] Verify HTTPS certificate is valid (if using custom domain)

## Phase 9: Add Sample Blog Post (Optional)

- [ ] Create DynamoDB item for post metadata
- [ ] Upload post content to S3
- [ ] Refresh frontend to see post appear

See [api/README.md](../api/README.md) for DynamoDB schema and S3 structure.

## Automation Verification

- [ ] Make a small frontend change and push to main
- [ ] Verify only `deploy` job runs (not Terraform)
- [ ] Make a change to `infrastructure/blog/` and push
- [ ] Verify `terraform - blog` and `deploy` jobs run
- [ ] Make a change to `api/lambdas/` and push
- [ ] Verify `terraform - api` and `deploy` jobs run
- [ ] Verify CloudFront invalidation completes after each deploy

## Troubleshooting Reference

If you encounter issues, see:

- [.github/WORKFLOW-GUIDE.md](.github/WORKFLOW-GUIDE.md) - Workflow troubleshooting
- [infrastructure/QUICKREF.md](../infrastructure/QUICKREF.md) - Terraform commands
- [infrastructure/API-SETUP.md](../infrastructure/API-SETUP.md) - API troubleshooting

## Cleanup (If needed)

To tear down all infrastructure:

```bash
# 1. Delete blog infrastructure
cd infrastructure/blog
terraform destroy

# 2. Delete API infrastructure
cd infrastructure/api
terraform destroy

# 3. Delete GitHub IAM role
cd infrastructure/github-iam
terraform destroy

# 4. Delete bootstrap (OIDC)
cd infrastructure/bootstrap
terraform destroy

# 5. Empty S3 buckets
aws s3 rm s3://your-blog-bucket --recursive
aws s3 rm s3://your-api-bucket --recursive
aws s3 rm s3://your-terraform-state-bucket --recursive

# 6. Delete S3 buckets and DynamoDB table manually
```

## Completion

Once all phases are complete:

✅ Automated CI/CD pipeline deployed
✅ Frontend deploys automatically on push to main
✅ Infrastructure updates deploy automatically
✅ Parallel Terraform execution for faster deployments
✅ Smart path filtering to only run necessary jobs
✅ CloudFront cache invalidation on each deploy

Your blog is now fully automated!
