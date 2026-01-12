# GitHub Actions Workflow Guide

Automated deployment for blog frontend and backend infrastructure using GitHub Actions with parallel Terraform execution.

## Quick Reference

**File**: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

**Triggers**:
- Push to `main` (only if relevant paths changed)
- Manual workflow dispatch

**Jobs**:
1. `check-paths` - Detects which components changed
2. `terraform` - Deploys infrastructure using matrix strategy (blog + api in parallel)
3. `deploy` - Builds and deploys React frontend to S3

## Workflow Flow

```
Push to main
    ↓
Check changed paths
    ↓
┌─────────────────────────────┐
│   Terraform (Matrix)        │
│  ┌──────────┬──────────┐   │
│  │   blog   │   api    │   │  (runs in parallel)
│  └──────────┴──────────┘   │
└─────────────────────────────┘
    ↓
Build & Deploy Frontend
    ↓
Invalidate CloudFront
```

## Required GitHub Configuration

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Value | How to Get |
|--------|-------|------------|
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/github-actions-role` | `cd infrastructure/github-iam && terraform output github_actions_role_arn` |

### Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Example | Module Used |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | All |
| `TF_STATE_BUCKET` | `my-terraform-state-bucket` | All |
| `TF_LOCK_TABLE` | `terraform-state-lock` | All |
| `BLOG_BUCKET_NAME` | `my-blog-frontend` | blog, deploy |
| `API_BUCKET_NAME` | `my-blog-api-content` | api |
| `DOMAIN_NAME` | `blog.example.com` | blog, api |
| `ROUTE53_ZONE_NAME` | `example.com` | blog, api |
| `API_GATEWAY_ENDPOINT` | `https://abc123.execute-api.us-east-1.amazonaws.com` | blog |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E1234567890ABC` | deploy |

**Important**: After first API deployment, get the endpoint and add `API_GATEWAY_ENDPOINT`:
```bash
cd infrastructure/api
terraform output api_gateway_endpoint
```

## Path Filtering Logic

The workflow only runs when specific paths change:

| Path Changed | Runs |
|--------------|------|
| `infrastructure/blog/**` | blog terraform + frontend deploy |
| `infrastructure/api/**` or `api/**` | api terraform + frontend deploy |
| `frontend/**` | frontend deploy only |
| `.github/workflows/deploy.yml` | All jobs |

**Manual workflow dispatch**: Runs all jobs regardless of path changes.

## Job Details

### 1. check-paths

Uses [dorny/paths-filter@v2](https://github.com/dorny/paths-filter) to detect changed files.

**Outputs**:
- `blog`: true if `infrastructure/blog/**` changed
- `api`: true if `infrastructure/api/**` or `api/**` changed
- `frontend`: true if `frontend/**` changed

### 2. terraform (Matrix Strategy)

Runs Terraform for both modules in parallel.

**Matrix values**:
- `blog` - S3, CloudFront, ACM, Route53
- `api` - Lambda, API Gateway, DynamoDB, S3

**Conditional execution**:
```yaml
blog: runs if blog paths changed OR manual trigger
api:  runs if api paths changed OR manual trigger
```

**Module-specific terraform.tfvars**:
- **blog**: Includes `api_gateway_endpoint` for CloudFront integration
- **api**: Includes `api_bucket_name` for S3 content storage

**Terraform workflow**:
1. Initialize with backend config
2. Format check (continue-on-error)
3. Validate
4. Plan with `-out=tfplan`
5. Apply (only on main branch)

### 3. deploy

Builds React app and deploys to S3.

**Conditional execution**:
```yaml
Runs if:
  - Terraform succeeded or was skipped
  AND
  - frontend changed OR blog changed OR api changed OR manual trigger
```

**Steps**:
1. Build with `npm run build`
2. Sync to S3 with `--delete` (removes old files)
3. Invalidate CloudFront cache on `/*` (if distribution ID set)

## Common Scenarios

### First-Time Deployment

1. Complete infrastructure setup (bootstrap, github-iam)
2. Configure all GitHub secrets and variables
3. Set `API_GATEWAY_ENDPOINT` to empty string initially
4. Run workflow manually (Actions → Deploy Blog to S3 → Run workflow)
5. After API deploys, get endpoint and update variable
6. Re-run workflow to update blog module with API endpoint

### Frontend-Only Changes

1. Edit files in `frontend/`
2. Commit and push to main
3. Workflow runs deploy job only (skips Terraform)
4. ~2-3 minutes total

### Infrastructure Changes

**Blog module** (CloudFront, S3, etc.):
1. Edit files in `infrastructure/blog/`
2. Commit and push
3. Blog Terraform runs + frontend redeploys
4. ~10-15 minutes (CloudFront takes longest)

**API module** (Lambda, DynamoDB, etc.):
1. Edit files in `infrastructure/api/` or `api/`
2. Commit and push
3. API Terraform runs + frontend redeploys
4. ~5-7 minutes

### Both Modules Changed

1. Both blog and api matrix jobs run in parallel
2. Frontend deploy waits for both to complete
3. Total time = max(blog_time, api_time) + deploy_time

## Optimization Features

### Parallel Execution
- Blog and API Terraform run simultaneously
- Cuts deployment time nearly in half vs sequential

### Smart Path Filtering
- Only runs necessary jobs
- Saves GitHub Actions minutes
- Faster feedback on frontend-only changes

### Caching
- Node.js dependencies cached by hash of `package-lock.json`
- Terraform providers cached automatically
- Speeds up subsequent runs

### Conditional Apply
- Plan always runs (safety check)
- Apply only runs on main branch
- Feature branches show plan output only

## Troubleshooting

### Workflow Not Triggering

**Problem**: Pushed to main but workflow didn't run.

**Check**:
- Are you on the main branch? `git branch --show-current`
- Did you change files in watched paths? Check git diff
- Is workflow enabled in Actions tab?

### Terraform Apply Fails

**Missing Variables**:
```
Error: variable "blog_bucket_name" not found
```
Add the variable in GitHub (Settings → Variables).

**State Lock**:
```
Error: Error acquiring the state lock
```
Someone else is running Terraform or previous run crashed. Wait 5 minutes or manually unlock:
```bash
cd infrastructure/blog  # or api
terraform force-unlock <LOCK_ID>
```

**Permission Denied**:
```
Error: AccessDenied: User is not authorized
```
Check IAM role permissions in `infrastructure/github-iam/github-actions-role.tf`. May need to apply updated permissions.

### Frontend Deployment Fails

**Build Fails**:
```
npm run build failed
```
Test locally first:
```bash
cd frontend
npm ci
npm run build
```

**S3 Sync Fails**:
```
Error: Access Denied
```
- Verify `BLOG_BUCKET_NAME` matches actual bucket
- Check IAM role has `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`

**CloudFront Invalidation Fails**:
```
Error: InvalidDistributionId
```
- Verify `CLOUDFRONT_DISTRIBUTION_ID` is set correctly
- Get ID: `cd infrastructure/blog && terraform output cloudfront_distribution_id`

### API Gateway Endpoint Missing

**Problem**: Blog module fails because `api_gateway_endpoint` not set.

**Solution**:
1. Let API module deploy first (workflow will fail on blog initially)
2. Get endpoint:
   ```bash
   cd infrastructure/api
   terraform output api_gateway_endpoint
   ```
3. Add to GitHub variables as `API_GATEWAY_ENDPOINT`
4. Re-run workflow

## Local Testing

Test before pushing:

```bash
# Test blog module
cd infrastructure/blog
terraform init -backend-config=backend-config.hcl
terraform plan -out=tfplan

# Test API module
cd infrastructure/api
terraform init -backend-config=backend-config.hcl
terraform plan -out=tfplan

# Test frontend build
cd frontend
npm ci
npm run build
```

## Monitoring

### View Workflow Runs
GitHub → Actions → Deploy Blog to S3

### Check Logs
Click on workflow run → Click on job → View step logs

### View Terraform Plans
Expand "Terraform Plan" step to see what changes will be applied

## Security

- **No AWS credentials stored**: Uses OIDC federation
- **Least-privilege IAM**: Role only has required permissions
- **Encrypted state**: Terraform state encrypted at rest in S3
- **HTTPS only**: All deployments use TLS
- **Branch protection**: Apply only runs on main

## Cost

Running this workflow on AWS Free Tier:

- GitHub Actions: 2,000 minutes/month free (private repos)
- Typical run: 5-15 minutes depending on changes
- AWS services mostly in free tier (Lambda, API Gateway, S3, CloudFront)

**Estimated monthly cost**: $0-5 for personal blog with moderate traffic
