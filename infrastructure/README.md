# Infrastructure

Modular Terraform configuration for blog infrastructure with separate state files.

## ⚠️ Prerequisites - Complete BEFORE Running Terraform

**Required setup guides (with checklists):**
1. **[GITHUB-SETUP.md](GITHUB-SETUP.md)** - Configure GitHub secrets and variables (do this first!)
2. **[BEST-PRACTICES.md](BEST-PRACTICES.md)** - Review Terraform best practices (plan files, security, etc.)

**After initial setup:**
3. **[CLOUDFRONT-SETUP.md](CLOUDFRONT-SETUP.md)** - CloudFront + ACM certificate setup for custom domain and HTTPS

**After completing steps 1-2**, you're ready to run the setup script. Complete step 3 after your initial infrastructure is deployed.

## Quick Start

```bash
./setup-modular.sh
```

This automated script will:
1. Create S3 bucket and DynamoDB table for state storage
2. Configure all modules with your settings
3. Initialize and apply Terraform modules in order

## Structure

```
infrastructure/
├── bootstrap/        → blog/bootstrap.tfstate (OIDC provider)
├── github-iam/       → blog/github-iam.tfstate (IAM roles)
└── blog/             → blog/blog.tfstate (Blog resources)
```

Each module has its own state file in the same S3 bucket under the `blog/` prefix.

## Why Modular?

- ✅ **Isolated state files** - Changes to blog resources don't affect OIDC/IAM
- ✅ **Reusable bucket** - Add more projects with different state files (e.g., `api/api.tfstate`)
- ✅ **Independent deployment** - Apply only what you need
- ✅ **Safer operations** - Smaller blast radius for changes

## State Files

All state files are stored in the same S3 bucket:

```
s3://your-terraform-state-bucket/
└── blog/
    ├── bootstrap.tfstate      # OIDC provider (rarely changes)
    ├── github-iam.tfstate     # IAM roles for GitHub Actions
    └── blog.tfstate           # Blog infrastructure (S3, etc.)
```

## Manual Deployment

Deploy modules in order:

```bash
# 1. Bootstrap (OIDC)
cd bootstrap
cp backend-config.hcl.example backend-config.hcl
# Edit backend-config.hcl
terraform init -backend-config=backend-config.hcl
terraform plan -out=tfplan
terraform apply tfplan
cd ..

# 2. GitHub IAM
cd github-iam
cp backend-config.hcl.example backend-config.hcl
cp terraform.tfvars.example terraform.tfvars
# Edit both files
terraform init -backend-config=backend-config.hcl
terraform plan -out=tfplan
terraform apply tfplan
cd ..

# 3. Blog (when ready)
cd blog
cp backend-config.hcl.example backend-config.hcl
terraform init -backend-config=backend-config.hcl
terraform plan -out=tfplan
terraform apply tfplan
```

## Adding More Projects

To add an `api` project reusing the same state bucket:

```bash
mkdir api
```

In `api/backend.tf`:
```hcl
backend "s3" {
  key     = "api/api.tfstate"  # Different prefix!
  encrypt = true
}
```

Your bucket structure becomes:
```
s3://your-terraform-state-bucket/
├── blog/
│   ├── bootstrap.tfstate
│   ├── github-iam.tfstate
│   └── blog.tfstate
└── api/
    └── api.tfstate
```

## Get GitHub Actions Role ARN

After applying github-iam:

```bash
cd github-iam
terraform output github_actions_role_arn
```

Use this for the `AWS_ROLE_ARN` GitHub secret.

---

## Documentation Guide

| File | Purpose |
|------|---------|
| **[README.md](README.md)** _(you are here)_ | Quick overview and getting started guide |
| **[GITHUB-SETUP.md](GITHUB-SETUP.md)** ⭐ | **START HERE** - Step-by-step GitHub configuration (secrets & variables) |
| **[BEST-PRACTICES.md](BEST-PRACTICES.md)** ⭐ | **READ THIS** - Terraform standards, plan files, security practices |
| **[CLOUDFRONT-SETUP.md](CLOUDFRONT-SETUP.md)** | CloudFront + ACM setup - custom domain and HTTPS configuration |
| **[QUICKREF.md](QUICKREF.md)** | Command cheat sheet - common commands and troubleshooting |
| **[README-MODULAR.md](README-MODULAR.md)** | Comprehensive guide - detailed modular architecture explanation |
| **[SUMMARY.md](SUMMARY.md)** | What changed and why - refactoring details and migration guide |

### Quick Navigation

**Setting up for the first time?**
1. Read [GITHUB-SETUP.md](GITHUB-SETUP.md) and complete checklist
2. Review [BEST-PRACTICES.md](BEST-PRACTICES.md)
3. Run `./setup-modular.sh`
4. Deploy CloudFront with [CLOUDFRONT-SETUP.md](CLOUDFRONT-SETUP.md)

**Need a command?**
→ [QUICKREF.md](QUICKREF.md)

**Want to understand the architecture?**
→ [README-MODULAR.md](README-MODULAR.md)

**Forgot what changed?**
→ [SUMMARY.md](SUMMARY.md)
