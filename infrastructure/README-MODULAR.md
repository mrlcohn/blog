# Modular Infrastructure Setup

This infrastructure is organized into separate Terraform modules, each with its own state file. This allows you to:
- Manage different components independently
- Reuse the same state bucket for multiple projects
- Reduce blast radius of changes
- Enable team collaboration on specific modules

## Directory Structure

```
infrastructure/
├── bootstrap/              # OIDC Provider (rarely changes)
│   ├── backend.tf         # State: blog/bootstrap.tfstate
│   ├── oidc.tf
│   └── outputs.tf
├── github-iam/            # GitHub Actions IAM Roles
│   ├── backend.tf         # State: blog/github-iam.tfstate
│   ├── github-actions-role.tf
│   ├── data.tf
│   └── outputs.tf
└── blog/                  # Blog-specific resources
    ├── backend.tf         # State: blog/blog.tfstate
    ├── s3.tf              # (placeholder for S3/CloudFront)
    └── variables.tf
```

## State Files

Each module has its own state file in the same S3 bucket:

| Module | State File | Purpose |
|--------|-----------|---------|
| `bootstrap` | `blog/bootstrap.tfstate` | GitHub OIDC provider |
| `github-iam` | `blog/github-iam.tfstate` | IAM roles and policies |
| `blog` | `blog/blog.tfstate` | Blog infrastructure (S3, CloudFront, etc.) |

## Quick Start

### Automated Setup

Run the setup script:

```bash
cd infrastructure
./setup-modular.sh
```

This will:
1. Create S3 bucket and DynamoDB table
2. Configure all backend.tf files
3. Create terraform.tfvars files
4. Initialize and apply each module

### Manual Setup

If you prefer manual setup:

#### 1. Create Prerequisites

```bash
# S3 bucket
aws s3 mb s3://your-terraform-state-bucket --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-terraform-state-bucket \
  --versioning-configuration Status=Enabled

# DynamoDB table
aws dynamodb create-table \
  --table-name terraform-lock-table \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

#### 2. Configure Backend Files

Update `backend.tf` in each module:
- Replace `YOUR_TERRAFORM_STATE_BUCKET` with your bucket name
- Adjust region if needed

#### 3. Deploy Modules in Order

**Step 1: Bootstrap (OIDC)**
```bash
cd bootstrap
terraform init
terraform plan
terraform apply
cd ..
```

**Step 2: GitHub IAM**
```bash
cd github-iam
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan
terraform apply
cd ..
```

**Step 3: Blog Resources (when ready)**
```bash
cd blog
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars
terraform init
terraform plan
terraform apply
```

## Module Dependencies

```
┌──────────┐
│ bootstrap│  (creates OIDC provider)
└────┬─────┘
     │
     v
┌──────────┐
│github-iam│  (references OIDC provider via data source)
└────┬─────┘
     │
     v
┌──────────┐
│   blog   │  (blog-specific resources)
└──────────┘
```

## Adding New Projects

To add a new project (e.g., `api`), you can reuse the same state bucket:

```bash
mkdir infrastructure/api
```

Create `infrastructure/api/backend.tf`:
```hcl
backend "s3" {
  bucket = "your-terraform-state-bucket"
  key    = "api/api.tfstate"  # Different state file!
  region = "us-east-1"
  dynamodb_table = "terraform-lock-table"
  encrypt        = true
}
```

Your state bucket structure:
```
s3://your-terraform-state-bucket/
├── blog/
│   ├── bootstrap.tfstate
│   ├── github-iam.tfstate
│   └── blog.tfstate
└── api/
    └── api.tfstate
```

## GitHub Actions

Update `.github/workflows/deploy.yml` to handle multiple modules:

```yaml
- name: Terraform Init and Apply - Bootstrap
  working-directory: infrastructure/bootstrap
  run: |
    terraform init
    terraform apply -auto-approve

- name: Terraform Init and Apply - GitHub IAM
  working-directory: infrastructure/github-iam
  run: |
    terraform init
    terraform apply -auto-approve

- name: Terraform Init and Apply - Blog
  working-directory: infrastructure/blog
  run: |
    terraform init
    terraform apply -auto-approve
```

## Benefits of This Structure

✅ **Isolated State**: Each component has its own state file
✅ **Reusable**: Same bucket can store state for multiple projects
✅ **Safer Changes**: Changing blog resources won't affect OIDC/IAM
✅ **Selective Deployment**: Apply only the modules you need
✅ **Team Friendly**: Different teams can own different modules
✅ **Clear Dependencies**: Explicit module dependencies

## Common Operations

### View Outputs from a Module

```bash
cd github-iam
terraform output
```

### Update a Specific Module

```bash
cd github-iam
terraform plan
terraform apply
```

### Destroy a Module

```bash
cd blog
terraform destroy
```

**Warning**: Destroy in reverse order to respect dependencies:
1. blog (if exists)
2. github-iam
3. bootstrap (last, rarely needed)

## Migration from Single State

If you had a single state file before, you can migrate:

```bash
# In old directory
terraform state pull > old-state.json

# Import resources into new modules as needed
cd bootstrap
terraform import aws_iam_openid_connect_provider.github <ARN>
```

## Troubleshooting

### Module dependency issues
- Ensure bootstrap is applied before github-iam
- github-iam uses data source to reference OIDC provider

### State file not found
- Check backend configuration matches bucket/key
- Verify AWS credentials have access to state bucket

### Lock conflicts
- Each module has independent locks
- If stuck: `terraform force-unlock <LOCK_ID>`

## Next Steps

1. Apply bootstrap and github-iam modules
2. Add S3/CloudFront configuration to blog module
3. Configure GitHub Actions workflow
4. Add more modules as needed (api, database, etc.)
