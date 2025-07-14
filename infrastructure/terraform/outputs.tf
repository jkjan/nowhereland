# Outputs for Nowhere Land Infrastructure

# OpenSearch Outputs
output "opensearch_domain_arn" {
  description = "ARN of the OpenSearch domain"
  value       = aws_opensearch_domain.blog_search.arn
  sensitive   = false
}

output "opensearch_domain_name" {
  description = "Name of the OpenSearch domain"
  value       = aws_opensearch_domain.blog_search.domain_name
  sensitive   = false
}

output "opensearch_endpoint" {
  description = "Domain-specific endpoint for OpenSearch"
  value       = aws_opensearch_domain.blog_search.endpoint
  sensitive   = false
}

output "opensearch_dashboard_endpoint" {
  description = "Domain-specific endpoint for OpenSearch Dashboard"
  value       = aws_opensearch_domain.blog_search.dashboard_endpoint
  sensitive   = false
}

output "opensearch_domain_id" {
  description = "Unique identifier for the OpenSearch domain"
  value       = aws_opensearch_domain.blog_search.domain_id
  sensitive   = false
}

# Access Credentials (Sensitive)
output "opensearch_access_key_id" {
  description = "Access key ID for OpenSearch user"
  value       = aws_iam_access_key.opensearch_user_key.id
  sensitive   = true
}

output "opensearch_secret_access_key" {
  description = "Secret access key for OpenSearch user"
  value       = aws_iam_access_key.opensearch_user_key.secret
  sensitive   = true
}

# Network Information
output "vpc_id" {
  description = "ID of the VPC created for OpenSearch"
  value       = aws_vpc.opensearch_vpc.id
  sensitive   = false
}

output "subnet_ids" {
  description = "IDs of subnets created for OpenSearch"
  value       = [aws_subnet.opensearch_subnet_1.id, aws_subnet.opensearch_subnet_2.id]
  sensitive   = false
}

output "security_group_id" {
  description = "ID of the security group for OpenSearch"
  value       = aws_security_group.opensearch_sg.id
  sensitive   = false
}

# Configuration for Supabase Edge Functions
output "supabase_environment_variables" {
  description = "Environment variables to set in Supabase Edge Functions"
  value = {
    OPENSEARCH_ENDPOINT         = "https://${aws_opensearch_domain.blog_search.endpoint}"
    OPENSEARCH_DOMAIN_NAME      = aws_opensearch_domain.blog_search.domain_name
    OPENSEARCH_REGION          = var.aws_region
    AWS_ACCESS_KEY_ID          = aws_iam_access_key.opensearch_user_key.id
    AWS_SECRET_ACCESS_KEY      = aws_iam_access_key.opensearch_user_key.secret
  }
  sensitive = true
}

# Cost Estimation
output "estimated_monthly_cost" {
  description = "Estimated monthly cost for the OpenSearch infrastructure"
  value = {
    opensearch_instance = "~$24.82/month (t3.small.search in us-east-1)"
    ebs_storage        = "~$2.00/month (20GB GP2)"
    data_transfer      = "~$1-3/month (estimated)"
    total_estimated    = "~$27-30/month"
    note              = "Costs may vary based on actual usage and AWS pricing changes"
  }
  sensitive = false
}

# Monitoring & Logging
output "cloudwatch_log_group" {
  description = "CloudWatch log group for OpenSearch"
  value       = aws_cloudwatch_log_group.opensearch_logs.name
  sensitive   = false
}

# Connection Information for Applications
output "connection_info" {
  description = "Connection information for applications"
  value = {
    endpoint     = "https://${aws_opensearch_domain.blog_search.endpoint}"
    port         = 443
    protocol     = "https"
    auth_method  = "AWS IAM"
    region       = var.aws_region
  }
  sensitive = false
}

# Health Check URLs
output "health_check_urls" {
  description = "URLs for health checks and monitoring"
  value = {
    cluster_health = "https://${aws_opensearch_domain.blog_search.endpoint}/_cluster/health"
    cluster_stats  = "https://${aws_opensearch_domain.blog_search.endpoint}/_cluster/stats"
    node_info      = "https://${aws_opensearch_domain.blog_search.endpoint}/_nodes"
  }
  sensitive = false
}

# Index Templates
output "index_templates" {
  description = "Recommended index templates for the blog"
  value = {
    posts_index = {
      name    = "posts"
      pattern = "posts-*"
      settings = {
        number_of_shards   = 1
        number_of_replicas = 0
      }
    }
    analytics_index = {
      name    = "analytics"
      pattern = "analytics-*" 
      settings = {
        number_of_shards   = 1
        number_of_replicas = 0
      }
    }
  }
  sensitive = false
}

# Backup Information
output "backup_configuration" {
  description = "Backup and snapshot configuration"
  value = {
    automated_snapshots      = true
    snapshot_start_hour     = 2
    snapshot_retention_days = var.backup_retention_days
    manual_snapshot_prefix  = "${var.project_name}-${var.environment}-manual"
  }
  sensitive = false
}

# Security Information
output "security_configuration" {
  description = "Security configuration summary"
  value = {
    encryption_at_rest     = true
    encryption_in_transit  = true
    tls_version           = "1.2+"
    vpc_enabled           = true
    public_access         = false
    fine_grained_access   = false
  }
  sensitive = false
}