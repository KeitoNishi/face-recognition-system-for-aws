variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_prefix" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., prod, staging)"
  type        = string
}

variable "default_tags" {
  description = "Additional default tags"
  type        = map(string)
  default     = {}
}

variable "vpc_id" {
  description = "Target VPC ID"
  type        = string
}

variable "subnet_id" {
  description = "Public subnet ID"
  type        = string
}

variable "app_ami_id" {
  description = "AMI ID for the app EC2"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "EC2 key pair name"
  type        = string
}

