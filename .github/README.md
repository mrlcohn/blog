# GitHub Actions Automation

Automated deployment pipeline for the blog using GitHub Actions with parallel Terraform execution.

## Documentation

- **[WORKFLOW-GUIDE.md](WORKFLOW-GUIDE.md)** - How the workflow works, troubleshooting, and monitoring
- **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** - Complete deployment checklist from scratch to production

## Quick Links

**Workflow file**: [workflows/deploy.yml](workflows/deploy.yml)

**View runs**: [GitHub Actions](../../actions)

## What It Does

The workflow automatically:

1. Detects which parts of the codebase changed (infrastructure vs frontend)
2. Runs Terraform for blog and API modules in parallel (if changed)
3. Builds and deploys the React frontend to S3
4. Invalidates CloudFront cache

## Workflow Triggers

- **Automatic**: Push to main branch (only if relevant paths changed)
- **Manual**: Actions tab → Deploy Blog to S3 → Run workflow

## Common Tasks

### Deploy Everything
1. Go to Actions tab
2. Click "Deploy Blog to S3"
3. Click "Run workflow"
4. Select main branch and click "Run workflow"

### Deploy Only Frontend
Edit files in `frontend/` and push to main. Workflow will skip Terraform and only deploy frontend (~2-3 minutes).

### Deploy Infrastructure Changes
Edit files in `infrastructure/blog/` or `infrastructure/api/` and push to main. Workflow will run relevant Terraform modules and redeploy frontend.

### View Deployment Status
1. Go to Actions tab
2. Click on the workflow run
3. View job status and logs

## First-Time Setup

Follow the complete checklist: [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)

Key steps:
1. Deploy bootstrap and github-iam infrastructure locally
2. Configure GitHub secrets and variables
3. Trigger workflow manually for first deployment
4. Set API_GATEWAY_ENDPOINT and CLOUDFRONT_DISTRIBUTION_ID after first run

## Troubleshooting

See [WORKFLOW-GUIDE.md](WORKFLOW-GUIDE.md) for detailed troubleshooting guides.

Common issues:
- **Workflow not triggering**: Check if you're on main branch and changed files in watched paths
- **Terraform fails**: Verify all GitHub variables are set correctly
- **Frontend deploy fails**: Check S3 bucket name and IAM permissions
- **CloudFront invalidation fails**: Verify distribution ID is set

## Security

- Uses OpenID Connect (OIDC) for AWS authentication - no stored credentials
- IAM role has least-privilege permissions
- Terraform state encrypted at rest
- HTTPS-only deployments

## Cost

Workflow runs on AWS Free Tier:
- GitHub Actions: 2,000 minutes/month free (private repos)
- Typical run: 5-15 minutes
- AWS services mostly free tier eligible

**Estimated cost**: $0-5/month for personal blog
