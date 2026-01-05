# GitHub OIDC Provider
# This allows GitHub Actions to authenticate to AWS without storing credentials

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  # GitHub's OIDC thumbprint (current as of 2024)
  # This thumbprint is for GitHub's OIDC provider and is publicly available
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]

  tags = {
    Name = "GitHubActionsOIDC"
  }
}
