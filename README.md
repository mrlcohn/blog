# Personal Blog

A modern blog built with React, TypeScript, and Vite, deployed to AWS S3 using Terraform and GitHub Actions with OIDC authentication.

## Project Structure

```
blog/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── data/          # Mock data
│   │   └── types/         # TypeScript types
│   ├── public/
│   └── package.json
├── infrastructure/     # Terraform configuration
│   ├── oidc.tf           # GitHub OIDC provider
│   ├── github-actions-role.tf  # IAM role for GitHub Actions
│   ├── backend.tf        # Terraform state backend
│   ├── variables.tf      # Variable definitions
│   └── README.md         # Infrastructure setup guide
└── .github/
    └── workflows/
        └── deploy.yml    # GitHub Actions deployment workflow
```

## Features

- 🎨 Modern UI with Material-UI components
- 🎯 TypeScript for type safety
- ⚡ Vite for fast development and optimized builds
- 🔐 OIDC authentication (no AWS credentials in GitHub)
- 🏗️ Infrastructure as Code with Terraform
- 🚀 Automated deployment with GitHub Actions
- 📝 SEO-friendly slug-based URLs
- 📱 Responsive design

## Quick Start

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 to see your blog.

### Build for Production

```bash
cd frontend
npm run build
```

The optimized files will be in `frontend/dist/`.

## Deployment

This project uses GitHub Actions with AWS OIDC for secure, credential-free deployment.

### Prerequisites

1. AWS Account
2. GitHub repository
3. Terraform installed locally

### Setup Instructions

See [infrastructure/README.md](infrastructure/README.md) for detailed setup instructions.

**Quick setup:**

```bash
cd infrastructure
./setup.sh  # Creates S3 bucket and DynamoDB table
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform apply
```

### GitHub Secrets

After running Terraform, add these secrets to your GitHub repository:

- `AWS_ROLE_ARN` - IAM role ARN (output from Terraform)
- `BLOG_BUCKET_NAME` - S3 bucket name for your blog
- `CLOUDFRONT_DISTRIBUTION_ID` - (Optional) CloudFront distribution ID

## Technology Stack

**Frontend:**
- React 18
- TypeScript
- Material-UI (MUI)
- Vite
- React Router

**Infrastructure:**
- AWS S3 (static hosting)
- AWS IAM (OIDC authentication)
- Terraform (infrastructure as code)
- GitHub Actions (CI/CD)

## Security

- ✅ No AWS credentials stored in GitHub (uses OIDC)
- ✅ Terraform state stored remotely in S3
- ✅ State locking with DynamoDB
- ✅ Encrypted state storage
- ✅ Least-privilege IAM policies

## Development

### Frontend Commands

```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Infrastructure Commands

```bash
cd infrastructure
terraform init      # Initialize Terraform
terraform plan      # Preview changes
terraform apply     # Apply changes
terraform destroy   # Destroy infrastructure
```

## Project Roadmap

- [x] React frontend with TypeScript
- [x] Material-UI components
- [x] Blog post pages with routing
- [x] About Me page
- [x] Terraform infrastructure
- [x] OIDC GitHub Actions authentication
- [x] Automated deployment
- [ ] API backend (coming soon)
- [ ] CloudFront CDN
- [ ] Custom domain with Route 53
- [ ] SSL/TLS certificate
- [ ] Blog post CMS
- [ ] Comments system

## License

MIT

## Author

Your Name
