# Terraform configuration for Nowhere Land Blog Infrastructure
# This manages the AWS OpenSearch cluster and related resources

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Backend configuration for state management
  backend "s3" {
    bucket = "nowhereland-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
    
    # Enable state locking
    dynamodb_table = "nowhereland-terraform-locks"
    encrypt        = true
  }
}

# AWS Provider configuration
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "nowhereland"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "jan"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC for OpenSearch (required for security)
resource "aws_vpc" "opensearch_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "opensearch_igw" {
  vpc_id = aws_vpc.opensearch_vpc.id
  
  tags = {
    Name = "${var.project_name}-${var.environment}-igw"
  }
}

# Subnets for OpenSearch
resource "aws_subnet" "opensearch_subnet_1" {
  vpc_id                  = aws_vpc.opensearch_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.project_name}-${var.environment}-subnet-1"
  }
}

resource "aws_subnet" "opensearch_subnet_2" {
  vpc_id                  = aws_vpc.opensearch_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.project_name}-${var.environment}-subnet-2"
  }
}

# Route table
resource "aws_route_table" "opensearch_route_table" {
  vpc_id = aws_vpc.opensearch_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.opensearch_igw.id
  }
  
  tags = {
    Name = "${var.project_name}-${var.environment}-route-table"
  }
}

# Associate route table with subnets
resource "aws_route_table_association" "opensearch_rta_1" {
  subnet_id      = aws_subnet.opensearch_subnet_1.id
  route_table_id = aws_route_table.opensearch_route_table.id
}

resource "aws_route_table_association" "opensearch_rta_2" {
  subnet_id      = aws_subnet.opensearch_subnet_2.id
  route_table_id = aws_route_table.opensearch_route_table.id
}

# Security group for OpenSearch
resource "aws_security_group" "opensearch_sg" {
  name        = "${var.project_name}-${var.environment}-opensearch-sg"
  description = "Security group for OpenSearch cluster"
  vpc_id      = aws_vpc.opensearch_vpc.id
  
  # HTTPS access from Supabase Edge Functions and admin IPs
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = concat(
      ["0.0.0.0/0"], # Supabase Edge Functions (global)
      var.admin_ip_whitelist
    )
  }
  
  # All outbound traffic allowed
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-${var.environment}-opensearch-sg"
  }
}

# IAM role for OpenSearch
resource "aws_iam_role" "opensearch_role" {
  name = "${var.project_name}-${var.environment}-opensearch-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "opensearch.amazonaws.com"
        }
      }
    ]
  })
}

# OpenSearch Domain
resource "aws_opensearch_domain" "blog_search" {
  domain_name    = "${var.project_name}-${var.environment}-search"
  engine_version = "OpenSearch_2.3"
  
  cluster_config {
    instance_type          = var.opensearch_instance_type
    instance_count         = var.opensearch_instance_count
    dedicated_master_enabled = false
    zone_awareness_enabled = false
  }
  
  ebs_options {
    ebs_enabled = true
    volume_type = "gp2"
    volume_size = var.opensearch_storage_size
  }
  
  vpc_options {
    subnet_ids         = [aws_subnet.opensearch_subnet_1.id]
    security_group_ids = [aws_security_group.opensearch_sg.id]
  }
  
  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }
  
  encrypt_at_rest {
    enabled = true
  }
  
  node_to_node_encryption {
    enabled = true
  }
  
  snapshot_options {
    automated_snapshot_start_hour = 2
  }
  
  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch_logs.arn
    log_type                 = "INDEX_SLOW_LOGS"
    enabled                  = true
  }
  
  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Action   = "es:*"
        Resource = "arn:aws:es:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/${var.project_name}-${var.environment}-search/*"
        Condition = {
          IpAddress = {
            "aws:SourceIp" = concat(
              ["0.0.0.0/0"], # Supabase Edge Functions
              var.admin_ip_whitelist
            )
          }
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-${var.environment}-opensearch"
  }
}

# CloudWatch Log Group for OpenSearch
resource "aws_cloudwatch_log_group" "opensearch_logs" {
  name              = "/aws/opensearch/domains/${var.project_name}-${var.environment}-search"
  retention_in_days = 7
  
  tags = {
    Name = "${var.project_name}-${var.environment}-opensearch-logs"
  }
}

# CloudWatch Log Resource Policy
resource "aws_cloudwatch_log_resource_policy" "opensearch_log_policy" {
  policy_name = "${var.project_name}-${var.environment}-opensearch-log-policy"
  
  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "es.amazonaws.com"
        }
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "arn:aws:logs:*"
      }
    ]
  })
}

# IAM User for Supabase Edge Functions to access OpenSearch
resource "aws_iam_user" "opensearch_user" {
  name = "${var.project_name}-${var.environment}-opensearch-user"
  
  tags = {
    Purpose = "OpenSearch access for Supabase Edge Functions"
  }
}

resource "aws_iam_access_key" "opensearch_user_key" {
  user = aws_iam_user.opensearch_user.name
}

resource "aws_iam_user_policy" "opensearch_user_policy" {
  name = "${var.project_name}-${var.environment}-opensearch-user-policy"
  user = aws_iam_user.opensearch_user.name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "es:ESHttpGet",
          "es:ESHttpPost",
          "es:ESHttpPut",
          "es:ESHttpDelete",
          "es:ESHttpHead"
        ]
        Resource = "${aws_opensearch_domain.blog_search.arn}/*"
      }
    ]
  })
}

# S3 bucket for Terraform state (commented out as it should be created manually first)
# resource "aws_s3_bucket" "terraform_state" {
#   bucket = "nowhereland-terraform-state"
# }

# DynamoDB table for Terraform state locking
# resource "aws_dynamodb_table" "terraform_locks" {
#   name         = "nowhereland-terraform-locks"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "LockID"
#   
#   attribute {
#     name = "LockID"
#     type = "S"
#   }
# }

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}