# Terraform Best Practices

This document outlines the best practices used in this infrastructure setup.

## Plan Files (`-out`)

All Terraform plans use the `-out` flag to save the plan to a file, ensuring apply executes exactly what was planned.

### Why Use Plan Files?

**Without `-out`:**
```bash
terraform plan
# ... review plan ...
terraform apply  # ❌ Re-evaluates, may differ from plan!
```

**With `-out`:**
```bash
terraform plan -out=tfplan
# ... review plan ...
terraform apply tfplan  # ✅ Applies exactly what was planned
```

**Benefits:**
- No drift between plan and apply
- State changes between commands don't affect apply
- What you review is what gets applied
- Required for GitOps workflows

### Local Development

```bash
# Always use plan files
terraform plan -out=tfplan
terraform apply tfplan
rm tfplan  # Clean up after apply
```

### GitHub Actions

The workflow automatically:
1. Runs `terraform plan -out=tfplan`
2. Applies `terraform apply tfplan`
3. Plan file is discarded after apply

### Security Note

Plan files can contain **sensitive data** from your configuration. They are:
- ✅ Gitignored (`.gitignore` includes `tfplan` and `*.tfplan`)
- ✅ Removed after apply in scripts
- ✅ Not committed to version control

## Backend Configuration

### Use `-backend-config` for Dynamic Values

**Don't:**
```hcl
backend "s3" {
  bucket = "my-bucket"  # ❌ Hardcoded
}
```

**Do:**
```hcl
backend "s3" {
  key = "blog/bootstrap.tfstate"  # ✅ Only key is hardcoded
  encrypt = true
}
```

```bash
terraform init \
  -backend-config="bucket=my-bucket" \
  -backend-config="region=us-east-1"
```

This allows:
- Same code for all environments
- Values from environment variables or CI/CD
- No secrets in version control

## Module Organization

### Separate Concerns

```
infrastructure/
├── bootstrap/     # Rarely changes (OIDC)
├── github-iam/    # Rarely changes (IAM)
└── blog/          # Changes frequently (S3, CloudFront)
```

**Benefits:**
- Independent state files
- Smaller blast radius
- Deploy only what changed
- Clear dependencies

### Deployment Strategy

**Initial Setup (local):**
1. `bootstrap` - Creates OIDC provider
2. `github-iam` - Creates IAM roles
3. `blog` - Creates blog resources

**Ongoing (GitHub Actions):**
- Only `blog` module runs automatically
- `bootstrap` and `github-iam` only run when manually updated

## Validation

### Always Validate Before Apply

```bash
terraform fmt      # Format code
terraform validate # Check syntax
terraform plan     # Review changes
terraform apply    # Execute
```

**In CI/CD:**
- `fmt -check` ensures code is formatted
- `validate` catches syntax errors early
- `plan` shows what will change
- Only `apply` on main branch

## State Management

### Remote State with Locking

```hcl
backend "s3" {
  bucket         = "my-state-bucket"
  key            = "project/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-lock-table"  # Prevents concurrent runs
}
```

**Features:**
- S3 for durable state storage
- Versioning enabled for rollback
- Encryption at rest
- DynamoDB for state locking

### State File Organization

```
s3://my-state-bucket/
└── blog/
    ├── bootstrap.tfstate
    ├── github-iam.tfstate
    └── blog.tfstate
```

One bucket, multiple projects, isolated state files.

## Security

### Secrets vs Variables (GitHub)

**Secrets** (encrypted, hidden in logs):
- IAM role ARNs
- AWS account IDs
- Credentials

**Variables** (public, visible):
- Bucket names
- AWS regions
- Non-sensitive config

### Gitignore Critical Files

```gitignore
*.tfvars           # May contain secrets
*.tfstate          # Contains resource details
backend-config.hcl # Contains bucket names
tfplan             # May contain sensitive data
```

## Example Workflow

### Full Local Deployment

```bash
cd infrastructure/bootstrap

# Create backend config
cp backend-config.hcl.example backend-config.hcl
# Edit backend-config.hcl

# Format, validate, plan, apply
terraform fmt
terraform init -backend-config=backend-config.hcl
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
rm tfplan

# Repeat for other modules
cd ../github-iam
# ... same process ...
```

### Manual Plan Review in CI/CD

For production, consider:
1. Plan on PR (review changes)
2. Require approval
3. Apply on merge to main

```yaml
# On PR: plan only
terraform plan -out=tfplan

# On main: apply the plan
terraform apply tfplan
```

## Common Pitfalls

### ❌ Don't Do This

```bash
# Running apply without plan
terraform apply -auto-approve  # Dangerous!

# Hardcoding values in backend
backend "s3" {
  bucket = "prod-bucket"  # Can't reuse code
}

# Skipping validation
terraform apply  # No format check, no validate
```

### ✅ Do This

```bash
# Always use plan files
terraform plan -out=tfplan
terraform apply tfplan

# Use backend-config
terraform init -backend-config=backend-config.hcl

# Full validation workflow
terraform fmt
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

## References

- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [Official Terraform Docs](https://www.terraform.io/docs)
- [HashiCorp Learn](https://learn.hashicorp.com/terraform)
