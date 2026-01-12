# Data source to lookup Route53 hosted zone
data "aws_route53_zone" "blog" {
  name         = var.route53_zone_name
  private_zone = false
}
