# Quick Reference

## State File Mapping

| Module | State File Location | What It Contains |
|--------|-------------------|------------------|
| `bootstrap/` | `s3://YOUR_BUCKET/blog/bootstrap.tfstate` | GitHub OIDC provider |
| `github-iam/` | `s3://YOUR_BUCKET/blog/github-iam.tfstate` | IAM roles & policies |
| `blog/` | `s3://YOUR_BUCKET/blog/blog.tfstate` | Blog resources (S3, etc.) |

## Common Commands

### Initial Setup
```bash
# Automated setup (recommended)
./setup-modular.sh

# Manual setup
cd bootstrap && terraform init && terraform apply && cd ..
cd github-iam && terraform init && terraform apply && cd ..
cd blog && terraform init && terraform apply && cd ..
```

### View Outputs
```bash
# Get GitHub Actions role ARN
cd github-iam && terraform output github_actions_role_arn

# Get OIDC provider ARN
cd bootstrap && terraform output oidc_provider_arn
```

### Update a Module
```bash
cd github-iam
terraform plan
terraform apply
```

### Add New Project (e.g., "api")
```bash
# Create new module
mkdir api

# Create backend.tf with different key
cat > api/backend.tf <<'EOF'
terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "api/api.tfstate"  # Different path!
    region = "us-east-1"
    dynamodb_table = "terraform-lock-table"
    encrypt = true
  }
}
EOF

# Now api has its own state file
```

## Deployment Order

**Must deploy in this order:**
1. `bootstrap` (OIDC provider)
2. `github-iam` (depends on OIDC)
3. `blog` (independent)

**Destroy in reverse order:**
1. `blog`
2. `github-iam`
3. `bootstrap` (rarely needed)

## GitHub Secrets Needed

After deploying, add to GitHub repository secrets:

| Secret Name | Get From | Example |
|------------|----------|---------|
| `AWS_ROLE_ARN` | `cd github-iam && terraform output github_actions_role_arn` | `arn:aws:iam::123...:role/GitHubActionsRole` |
| `BLOG_BUCKET_NAME` | Your chosen bucket name | `my-blog-website` |

## Troubleshooting

### "Backend configuration changed"
```bash
terraform init -reconfigure
```

### View current state
```bash
terraform state list
```

### Import existing resource
```bash
terraform import aws_s3_bucket.blog my-bucket-name
```

### Force unlock stuck state
```bash
terraform force-unlock <LOCK_ID>
```

## File Structure Quick View

```
infrastructure/
├── bootstrap/          # OIDC (rarely changes)
│   ├── backend.tf     # → blog/bootstrap.tfstate
│   └── oidc.tf
├── github-iam/        # IAM roles
│   ├── backend.tf     # → blog/github-iam.tfstate
│   └── github-actions-role.tf
└── blog/              # Blog resources
    ├── backend.tf     # → blog/blog.tfstate
    └── s3.tf
```

## Benefits Recap

✅ Each module = separate state file
✅ Same S3 bucket, different keys
✅ Easy to add more projects (api, db, etc.)
✅ Isolated changes (blog changes don't affect IAM)
✅ Clear dependencies and order
