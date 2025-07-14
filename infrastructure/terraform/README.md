# Terraform Infrastructure for Nowhere Land Blog

This directory contains Terraform configurations for deploying the AWS infrastructure components for the Nowhere Land blog, primarily the OpenSearch cluster for search functionality.

## 📋 Prerequisites

### Required Tools
```bash
# Install Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### AWS Account Setup
1. **Create AWS Account** (if not already done)
2. **Create IAM User** with programmatic access
3. **Attach Policies**:
   - `AmazonOpenSearchServiceFullAccess`
   - `AmazonVPCFullAccess`
   - `IAMFullAccess`
   - `CloudWatchLogsFullAccess`

### AWS Credentials Configuration
```bash
# Configure AWS credentials
aws configure
# Enter your access key, secret key, region (us-east-1), and output format (json)

# Or use environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

## 🚀 Quick Start

### 1. Initialize Terraform State Backend (One-time setup)

First, create the S3 bucket and DynamoDB table for state management:

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://nowhereland-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket nowhereland-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name nowhereland-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Configure Variables

```bash
# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit with your actual values
nano terraform.tfvars
```

**Important**: Update these values in `terraform.tfvars`:
- `admin_ip_whitelist`: Replace with your actual IP addresses
- `environment`: Set to "dev", "staging", or "prod"
- Other configuration options as needed

### 3. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review the planned changes
terraform plan

# Apply the configuration
terraform apply
```

### 4. Retrieve Outputs

```bash
# View all outputs
terraform output

# Get specific sensitive outputs
terraform output -raw opensearch_access_key_id
terraform output -raw opensearch_secret_access_key

# Get Supabase environment variables
terraform output supabase_environment_variables
```

## 📁 File Structure

```
terraform/
├── main.tf                 # Main infrastructure configuration
├── variables.tf            # Variable definitions
├── outputs.tf              # Output definitions
├── terraform.tfvars.example # Example variables file
├── README.md              # This file
└── .terraform/            # Terraform working directory (auto-generated)
```

## 🔧 Configuration Options

### Environment-Specific Deployments

Deploy to different environments by changing the `environment` variable:

```bash
# Development
terraform workspace new dev
terraform apply -var="environment=dev"

# Staging
terraform workspace new staging
terraform apply -var="environment=staging"

# Production
terraform workspace new prod
terraform apply -var="environment=prod"
```

### Cost Optimization

For development and testing:
```hcl
# In terraform.tfvars
environment = "dev"
opensearch_instance_type = "t3.small.search"
opensearch_storage_size = 10
enable_production_features = false
backup_retention_days = 1
```

For production:
```hcl
# In terraform.tfvars
environment = "prod"
opensearch_instance_type = "t3.small.search"  # or t3.medium.search for more performance
opensearch_storage_size = 20
enable_production_features = true
backup_retention_days = 30
```

## 🔗 Integration with Supabase

After deploying, you'll need to configure Supabase Edge Functions with the OpenSearch credentials:

### 1. Get the credentials from Terraform outputs:
```bash
terraform output supabase_environment_variables
```

### 2. Set environment variables in Supabase:
```bash
# Using Supabase CLI
supabase secrets set OPENSEARCH_ENDPOINT="https://your-endpoint.region.es.amazonaws.com"
supabase secrets set AWS_ACCESS_KEY_ID="your-access-key"
supabase secrets set AWS_SECRET_ACCESS_KEY="your-secret-key"
supabase secrets set OPENSEARCH_REGION="us-east-1"
```

### 3. Deploy the search Edge Function:
```bash
supabase functions deploy search --project-ref your-project-id
```

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Check cluster health
curl -X GET "https://your-opensearch-endpoint/_cluster/health?pretty"

# Check indices
curl -X GET "https://your-opensearch-endpoint/_cat/indices?v"
```

### Cost Monitoring
- Monitor costs in AWS Billing Dashboard
- Set up billing alerts for unexpected usage
- Expected monthly cost: ~$27-30 for t3.small.search

### Backup and Recovery
- Automated snapshots are configured (2 AM UTC daily)
- Manual snapshots can be created via OpenSearch API
- Point-in-time recovery available for configured retention period

## 🔄 Updates and Maintenance

### Updating Infrastructure
```bash
# Pull latest Terraform configuration
git pull origin main

# Review changes
terraform plan

# Apply updates
terraform apply
```

### Scaling Up
To handle increased traffic, modify `terraform.tfvars`:
```hcl
opensearch_instance_type = "t3.medium.search"  # Upgrade instance
opensearch_storage_size = 50                   # Increase storage
```

Then apply:
```bash
terraform apply
```

### Security Updates
- Regularly rotate AWS access keys
- Update IP whitelist as needed
- Monitor CloudWatch logs for suspicious activity

## 🚨 Troubleshooting

### Common Issues

**1. "Domain already exists" error:**
```bash
# Check existing domains
aws opensearch list-domain-names --region us-east-1

# If needed, import existing domain
terraform import aws_opensearch_domain.blog_search your-existing-domain-name
```

**2. "Access denied" errors:**
- Verify IAM permissions
- Check IP whitelist configuration
- Ensure VPC security group allows required traffic

**3. "Terraform state locked" error:**
```bash
# Force unlock (use carefully)
terraform force-unlock LOCK_ID
```

### Getting Help
- Check AWS CloudWatch logs for OpenSearch
- Review Terraform state: `terraform show`
- Validate configuration: `terraform validate`

## 🗑️ Cleanup

To destroy all infrastructure (⚠️ **This is irreversible!**):

```bash
# Review what will be destroyed
terraform plan -destroy

# Destroy infrastructure
terraform destroy

# Clean up state backend (optional)
aws s3 rb s3://nowhereland-terraform-state --force
aws dynamodb delete-table --table-name nowhereland-terraform-locks --region us-east-1
```

## 💰 Cost Breakdown

| Resource | Monthly Cost |
|----------|-------------|
| OpenSearch t3.small.search | ~$24.82 |
| EBS Storage (20GB GP2) | ~$2.00 |
| Data Transfer | ~$1-3 |
| **Total** | **~$27-30** |

## 📚 Additional Resources

- [AWS OpenSearch Service Documentation](https://docs.aws.amazon.com/opensearch-service/)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)

---

**Note**: This infrastructure is designed for a small-scale blog (100 DAU, 1000 MAU). For higher traffic, consider upgrading instance types and enabling multi-AZ deployment.