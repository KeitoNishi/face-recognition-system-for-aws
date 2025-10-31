terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name_prefix = "${var.project_prefix}-${var.environment}"
  tags = merge({
    Project     = var.project_prefix,
    Environment = var.environment
  }, var.default_tags)
}

# S3 bucket for photo storage (private by default)
resource "aws_s3_bucket" "photos" {
  bucket        = "${local.name_prefix}-photos"
  force_destroy = false
  tags          = local.tags
}

resource "aws_s3_bucket_acl" "photos" {
  bucket = aws_s3_bucket.photos.id
  acl    = "private"
}

# IAM role for EC2 to access S3/Rekognition/SSM as in app expectations
data "aws_iam_policy_document" "assume_ec2" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app_role" {
  name               = "${local.name_prefix}-app-role"
  assume_role_policy = data.aws_iam_policy_document.assume_ec2.json
  tags               = local.tags
}

data "aws_iam_policy_document" "app_policy" {
  statement {
    sid     = "S3Access"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]
    resources = [
      aws_s3_bucket.photos.arn,
      "${aws_s3_bucket.photos.arn}/*"
    ]
  }

  statement {
    sid     = "ParameterStoreAccess"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath"
    ]
    resources = [
      "arn:aws:ssm:${var.aws_region}:*:*"
    ]
  }

  statement {
    sid     = "RekognitionAccess"
    actions = [
      "rekognition:IndexFaces",
      "rekognition:SearchFacesByImage",
      "rekognition:SearchFaces",
      "rekognition:CreateCollection",
      "rekognition:DeleteCollection",
      "rekognition:ListCollections"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "app_policy" {
  name   = "${local.name_prefix}-app-policy"
  policy = data.aws_iam_policy_document.app_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_app_policy" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.app_policy.arn
}

resource "aws_iam_instance_profile" "app_profile" {
  name = "${local.name_prefix}-instance-profile"
  role = aws_iam_role.app_role.name
}

# Security group
resource "aws_security_group" "app_sg" {
  name        = "${local.name_prefix}-sg"
  description = "Allow HTTP/HTTPS"
  vpc_id      = var.vpc_id
  tags        = local.tags

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 instance (AMI/Key must be provided)
resource "aws_instance" "app" {
  ami                         = var.app_ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  iam_instance_profile        = aws_iam_instance_profile.app_profile.name
  key_name                    = var.key_name
  associate_public_ip_address = true

  tags = merge(local.tags, { Name = "${local.name_prefix}-ec2" })

  user_data = <<-EOT
              #!/bin/bash
              yum update -y || true
              # Node.js / Nginx / PM2 のセットアップは既存手順を流用
              # デプロイはscpまたはS3からpullする方式を選択
              EOT
}

output "s3_bucket_name" {
  value = aws_s3_bucket.photos.bucket
}

output "instance_id" {
  value = aws_instance.app.id
}

output "security_group_id" {
  value = aws_security_group.app_sg.id
}

