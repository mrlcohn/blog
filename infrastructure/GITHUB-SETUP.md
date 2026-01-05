# GitHub Configuration Guide

This guide shows you exactly what to configure in GitHub for the deployment workflow.

## Required GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **Secrets**

| Secret Name | Description | How to Get | Example |
|-------------|-------------|-----------|---------|
| `AWS_ROLE_ARN` | IAM role for GitHub Actions | `cd infrastructure/github-iam && terraform output github_actions_role_arn` | `arn:aws:iam::123456789012:role/GitHubActionsRole` |
| `AWS_ACCOUNT_ID` | Your AWS account ID | `aws sts get-caller-identity --query Account --output text` | `123456789012` |

## Required GitHub Variables

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **Variables**

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `TF_STATE_BUCKET` | S3 bucket for Terraform state | `my-terraform-state-bucket` |
| `TF_LOCK_TABLE` | DynamoDB table for state locking | `terraform-lock-table` |
| `BLOG_BUCKET_NAME` | S3 bucket for blog hosting | `my-blog-website` |
| `AWS_REGION` | AWS region (optional, defaults to us-east-1) | `us-east-1` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront ID (optional, only if using CDN) | `E1234567890ABC` |

## Step-by-Step Setup

### 1. Get Your AWS Account ID

```bash
aws sts get-caller-identity --query Account --output text
```

### 2. Deploy Infrastructure Locally First

The first deployment must be done locally to create the IAM role:

```bash
cd infrastructure
./setup-modular.sh
```

Or manually:

```bash
# Bootstrap
cd bootstrap
cp backend-config.hcl.example backend-config.hcl
# Edit backend-config.hcl with your bucket name
terraform init -backend-config=backend-config.hcl
terraform apply

# GitHub IAM
cd ../github-iam
cp backend-config.hcl.example backend-config.hcl
cp terraform.tfvars.example terraform.tfvars
# Edit both files
terraform init -backend-config=backend-config.hcl
terraform apply
```

### 3. Get the Role ARN

```bash
cd infrastructure/github-iam
terraform output github_actions_role_arn
```

Copy this output - you'll need it for the GitHub secret.

### 4. Configure GitHub Secrets

1. Go to https://github.com/YOUR_USERNAME/blog/settings/secrets/actions
2. Click **New repository secret**
3. Add each secret:

**AWS_ROLE_ARN**:
- Name: `AWS_ROLE_ARN`
- Secret: (paste the ARN from step 3)

**AWS_ACCOUNT_ID**:
- Name: `AWS_ACCOUNT_ID`
- Secret: (paste your account ID from step 1)

### 5. Configure GitHub Variables

1. Go to https://github.com/YOUR_USERNAME/blog/settings/variables/actions
2. Click **New repository variable**
3. Add each variable:

**TF_STATE_BUCKET**:
- Name: `TF_STATE_BUCKET`
- Value: `your-terraform-state-bucket`

**TF_LOCK_TABLE**:
- Name: `TF_LOCK_TABLE`
- Value: `terraform-lock-table`

**BLOG_BUCKET_NAME**:
- Name: `BLOG_BUCKET_NAME`
- Value: `my-blog-website`

**AWS_REGION** (optional):
- Name: `AWS_REGION`
- Value: `us-east-1`

### 6. Test the Workflow

```bash
git add .
git commit -m "Configure GitHub Actions"
git push origin main
```

Go to the **Actions** tab to watch the deployment.

## Workflow Behavior

The workflow runs in this order:

1. **terraform-bootstrap** - Applies OIDC provider (rarely changes)
2. **terraform-github-iam** - Applies IAM roles
3. **terraform-blog** - Applies blog resources (S3, etc.)
4. **deploy** - Builds and deploys frontend

Each job:
- Uses `working-directory` to run in the correct module
- Uses `-backend-config` flags to configure the S3 backend
- Creates `terraform.tfvars` from GitHub variables

## Local Development

For local development, use backend-config.hcl files:

```bash
cd infrastructure/bootstrap
cp backend-config.hcl.example backend-config.hcl
# Edit backend-config.hcl

terraform init -backend-config=backend-config.hcl
terraform plan
terraform apply
```

## Differences: Secrets vs Variables

**Secrets** (encrypted, hidden):
- `AWS_ROLE_ARN` - Sensitive IAM information
- `AWS_ACCOUNT_ID` - Part of resource ARNs

**Variables** (public, visible in logs):
- `TF_STATE_BUCKET` - Just a bucket name
- `BLOG_BUCKET_NAME` - Just a bucket name
- `AWS_REGION` - Public information

## Troubleshooting

### "Error: Failed to get existing workspaces"

The backend configuration is missing. Ensure:
- `TF_STATE_BUCKET` variable is set in GitHub
- `TF_LOCK_TABLE` variable is set in GitHub
- S3 bucket and DynamoDB table exist

### "Error: AccessDenied"

The IAM role doesn't have permissions. Check:
- `AWS_ROLE_ARN` secret is correct
- Role was created successfully
- Role has policies attached

### "Invalid or missing AWS Account ID"

Add the `AWS_ACCOUNT_ID` secret to GitHub.

### Workflow runs but skips Terraform Apply

This is expected for pull requests - apply only runs on pushes to main/master.

## Complete Configuration Checklist

- [ ] S3 bucket created (`TF_STATE_BUCKET`)
- [ ] DynamoDB table created (`TF_LOCK_TABLE`)
- [ ] Bootstrap module applied locally
- [ ] GitHub IAM module applied locally
- [ ] GitHub Secret: `AWS_ROLE_ARN`
- [ ] GitHub Secret: `AWS_ACCOUNT_ID`
- [ ] GitHub Variable: `TF_STATE_BUCKET`
- [ ] GitHub Variable: `TF_LOCK_TABLE`
- [ ] GitHub Variable: `BLOG_BUCKET_NAME`
- [ ] GitHub Variable: `AWS_REGION` (optional)
- [ ] Push to main branch to test

## Example Configuration

Here's what your GitHub configuration should look like:

**Secrets:**
```
AWS_ROLE_ARN         arn:aws:iam::123456789012:role/GitHubActionsRole
AWS_ACCOUNT_ID       123456789012
```

**Variables:**
```
TF_STATE_BUCKET              my-terraform-state-bucket
TF_LOCK_TABLE                terraform-lock-table
BLOG_BUCKET_NAME             my-personal-blog
AWS_REGION                   us-east-1
CLOUDFRONT_DISTRIBUTION_ID   (leave empty if not using CloudFront)
```
