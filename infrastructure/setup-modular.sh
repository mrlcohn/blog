#!/bin/bash
# Setup script for modular Terraform infrastructure
# Creates the S3 bucket and DynamoDB table, then initializes all modules

set -e

echo "🚀 Blog Infrastructure Setup (Modular)"
echo "========================================"
echo ""

# Check dependencies
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install it first."
    exit 1
fi

# Get configuration
read -p "Enter S3 bucket name for Terraform state: " STATE_BUCKET
read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}
read -p "Enter DynamoDB table name for state locking (default: terraform-lock-table): " LOCK_TABLE
LOCK_TABLE=${LOCK_TABLE:-terraform-lock-table}
read -p "Enter your GitHub repository (format: username/repo): " GITHUB_REPO
read -p "Enter blog S3 bucket name: " BLOG_BUCKET

echo ""
echo "📦 Step 1: Creating infrastructure prerequisites..."
echo ""

# Create S3 bucket
echo "Creating S3 bucket: $STATE_BUCKET"
aws s3 mb "s3://$STATE_BUCKET" --region "$AWS_REGION" 2>/dev/null || echo "Bucket already exists"

# Enable versioning
echo "Enabling versioning..."
aws s3api put-bucket-versioning \
  --bucket "$STATE_BUCKET" \
  --versioning-configuration Status=Enabled

# Enable encryption
echo "Enabling encryption..."
aws s3api put-bucket-encryption \
  --bucket "$STATE_BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table
echo "Creating DynamoDB table: $LOCK_TABLE"
aws dynamodb create-table \
  --table-name "$LOCK_TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$AWS_REGION" 2>/dev/null || echo "Table already exists"

echo ""
echo "✅ Prerequisites created!"
echo ""

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
STATE_BUCKET_ARN="arn:aws:s3:::$STATE_BUCKET"
LOCK_TABLE_ARN="arn:aws:dynamodb:$AWS_REGION:$ACCOUNT_ID:table/$LOCK_TABLE"

echo "📝 Step 2: Configuring Terraform modules..."
echo ""

# Create backend-config.hcl files for local development
for module in bootstrap github-iam blog; do
  echo "Creating $module/backend-config.hcl..."
  cat > "$module/backend-config.hcl" <<EOF
bucket         = "$STATE_BUCKET"
region         = "$AWS_REGION"
dynamodb_table = "$LOCK_TABLE"
EOF
done

# Create terraform.tfvars for github-iam (needed for resource creation)
echo "Creating github-iam/terraform.tfvars..."
cat > github-iam/terraform.tfvars <<EOF
aws_region                 = "$AWS_REGION"
github_repo                = "$GITHUB_REPO"
terraform_state_bucket_arn = "$STATE_BUCKET_ARN"
terraform_lock_table_arn   = "$LOCK_TABLE_ARN"
blog_bucket_name           = "$BLOG_BUCKET"
EOF

# Create terraform.tfvars for blog (for when you're ready to deploy blog resources)
echo "Creating blog/terraform.tfvars..."
cat > blog/terraform.tfvars <<EOF
aws_region       = "$AWS_REGION"
blog_bucket_name = "$BLOG_BUCKET"
EOF

echo ""
echo "🎯 Step 3: Initializing Terraform modules..."
echo ""
echo "Note: 'bootstrap' and 'github-iam' are required."
echo "      'blog' module is optional - skip if not ready to create blog resources."
echo ""

# Initialize and apply each module in order
# Only prompt for bootstrap and github-iam by default
for module in bootstrap github-iam; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Module: $module (required)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  cd "$module"

  echo "Running: terraform fmt"
  terraform fmt

  echo ""
  echo "Running: terraform init"
  terraform init -backend-config=backend-config.hcl

  echo ""
  echo "Running: terraform validate"
  terraform validate

  echo ""
  echo "Running: terraform plan"
  terraform plan -out=tfplan

  echo ""
  read -p "Apply $module module? (yes/no): " APPLY
  if [ "$APPLY" = "yes" ]; then
    terraform apply tfplan
    rm -f tfplan
    echo "✅ $module applied successfully"
  else
    rm -f tfplan
    echo "⚠️  Warning: Skipping $module - this may cause issues with dependent modules"
  fi

  cd ..
done

# Optionally handle blog module
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Module: blog (optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "This module creates blog-specific resources (S3, CloudFront, etc.)"
read -p "Do you want to initialize and apply the blog module? (yes/no): " SETUP_BLOG

if [ "$SETUP_BLOG" = "yes" ]; then
  cd blog

  echo "Running: terraform fmt"
  terraform fmt

  echo ""
  echo "Running: terraform init"
  terraform init -backend-config=backend-config.hcl

  echo ""
  echo "Running: terraform validate"
  terraform validate

  echo ""
  echo "Running: terraform plan"
  terraform plan -out=tfplan

  echo ""
  read -p "Apply blog module? (yes/no): " APPLY
  if [ "$APPLY" = "yes" ]; then
    terraform apply tfplan
    rm -f tfplan
    echo "✅ blog applied successfully"
  else
    rm -f tfplan
    echo "⏭️  Skipping blog - you can apply it later with:"
    echo "   cd infrastructure/blog && terraform init -backend-config=backend-config.hcl && terraform plan -out=tfplan && terraform apply tfplan"
  fi

  cd ..
else
  echo "⏭️  Skipping blog module - you can set it up later with:"
  echo "   cd infrastructure/blog"
  echo "   terraform init -backend-config=backend-config.hcl"
  echo "   terraform plan"
  echo "   terraform apply"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Get your GitHub Actions role ARN:"
echo "   cd github-iam && terraform output github_actions_role_arn"
echo ""
echo "2. Add GitHub SECRETS to your repository:"
echo "   - AWS_ROLE_ARN: (from terraform output above)"
echo "   - AWS_ACCOUNT_ID: $ACCOUNT_ID"
echo ""
echo "3. Add GitHub VARIABLES to your repository:"
echo "   - TF_STATE_BUCKET: $STATE_BUCKET"
echo "   - TF_LOCK_TABLE: $LOCK_TABLE"
echo "   - BLOG_BUCKET_NAME: $BLOG_BUCKET"
echo "   - AWS_REGION: $AWS_REGION"
echo ""
echo "4. Push to your repository to trigger deployment"
echo ""
echo "📁 Files created (gitignored):"
echo "   - bootstrap/backend-config.hcl"
echo "   - github-iam/backend-config.hcl"
echo "   - github-iam/terraform.tfvars"
echo "   - blog/backend-config.hcl"
echo "   - blog/terraform.tfvars"
echo ""
echo "📊 State files location:"
echo "   - s3://$STATE_BUCKET/blog/bootstrap.tfstate"
echo "   - s3://$STATE_BUCKET/blog/github-iam.tfstate"
echo "   - s3://$STATE_BUCKET/blog/blog.tfstate"
echo ""
