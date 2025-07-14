# Variables for Nowhere Land Infrastructure

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "nowhereland"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# OpenSearch Configuration
variable "opensearch_instance_type" {
  description = "Instance type for OpenSearch cluster"
  type        = string
  default     = "t3.small.search"
  validation {
    condition = contains([
      "t3.small.search",
      "t3.medium.search",
      "m6g.large.search",
      "m6g.xlarge.search"
    ], var.opensearch_instance_type)
    error_message = "OpenSearch instance type must be a valid search instance type."
  }
}

variable "opensearch_instance_count" {
  description = "Number of instances in OpenSearch cluster"
  type        = number
  default     = 1
  validation {
    condition     = var.opensearch_instance_count >= 1 && var.opensearch_instance_count <= 10
    error_message = "OpenSearch instance count must be between 1 and 10."
  }
}

variable "opensearch_storage_size" {
  description = "Storage size for OpenSearch cluster in GB"
  type        = number
  default     = 20
  validation {
    condition     = var.opensearch_storage_size >= 10 && var.opensearch_storage_size <= 3000
    error_message = "OpenSearch storage size must be between 10 and 3000 GB."
  }
}

# Security Configuration
variable "admin_ip_whitelist" {
  description = "List of IP addresses allowed to access OpenSearch"
  type        = list(string)
  default     = ["your.home.ip/32", "your.office.ip/32"]
  # Note: Replace with actual IP addresses in terraform.tfvars
}

# Cost Control
variable "enable_production_features" {
  description = "Enable production-level features (dedicated master, multi-AZ, etc.)"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Number of days to retain automated snapshots"
  type        = number
  default     = 7
  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 35
    error_message = "Backup retention must be between 1 and 35 days."
  }
}

# Monitoring Configuration
variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 7
  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

# Environment-specific configurations
variable "environment_configs" {
  description = "Environment-specific configuration overrides"
  type = map(object({
    instance_type         = string
    instance_count        = number
    storage_size          = number
    enable_production     = bool
    backup_retention      = number
    detailed_monitoring   = bool
  }))
  default = {
    dev = {
      instance_type       = "t3.small.search"
      instance_count      = 1
      storage_size        = 10
      enable_production   = false
      backup_retention    = 1
      detailed_monitoring = false
    }
    staging = {
      instance_type       = "t3.small.search"
      instance_count      = 1
      storage_size        = 20
      enable_production   = false
      backup_retention    = 7
      detailed_monitoring = true
    }
    prod = {
      instance_type       = "t3.small.search"
      instance_count      = 1
      storage_size        = 20
      enable_production   = true
      backup_retention    = 30
      detailed_monitoring = true
    }
  }
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}