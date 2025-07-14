# Search Infrastructure Configuration

## Overview

This document outlines the search infrastructure for Nowhere Land blog, providing full-text search capabilities with cost-effective OpenSearch implementation and PostgreSQL fallback.

## Architecture Strategy

### Primary: AWS OpenSearch (Cost-Optimized)
```yaml
opensearch_config:
  instance_type: "t3.small.search"
  instance_count: 1
  storage_type: "gp2"
  storage_size: "20GB"
  region: "us-east-1"
  
  estimated_cost:
    instance: "$24.82/month"
    storage: "$2.00/month" 
    data_transfer: "$1-3/month"
    total: "$27-30/month"
```

### Fallback: PostgreSQL Full-Text Search
```sql
-- Built into Supabase, no additional cost
-- Performance sufficient for <10K posts
-- Automatic failover if OpenSearch unavailable
```

### Alternative: Typesense (Budget Option)
```yaml
typesense_config:
  provider: "Typesense Cloud"
  plan: "Starter ($15/month)"
  memory: "0.5GB"
  documents: "100K limit"
  suitable_for: "Early stage, budget-conscious"
```

## OpenSearch Configuration

### Cluster Setup
```yaml
# opensearch-cluster.yml
cluster_config:
  name: "nowhereland-search"
  version: "2.3"
  instance_type: "t3.small.search"
  instance_count: 1
  dedicated_master: false
  zone_awareness: false
  
storage_config:
  type: "gp2"
  size: 20
  iops: 100
  
network_config:
  vpc_enabled: true
  subnet_ids: ["subnet-xxx"]
  security_group_ids: ["sg-xxx"]
  
access_config:
  domain_endpoint_options:
    enforce_https: true
  
encryption_config:
    at_rest: true
    in_transit: true
    
backup_config:
  automated_snapshots: true
  snapshot_start_hour: 2 # 2 AM UTC
```

### Index Mapping
```json
{
  "posts": {
    "mappings": {
      "properties": {
        "id": { "type": "keyword" },
        "title": { 
          "type": "text",
          "analyzer": "standard",
          "boost": 3.0
        },
        "content": { 
          "type": "text",
          "analyzer": "standard",
          "boost": 1.0
        },
        "abstract": { 
          "type": "text",
          "analyzer": "standard",
          "boost": 2.0
        },
        "tags": { 
          "type": "keyword",
          "boost": 2.5
        },
        "author": { "type": "keyword" },
        "published_at": { "type": "date" },
        "view_count": { "type": "integer" },
        "references": {
          "type": "nested",
          "properties": {
            "text": { "type": "text" },
            "url": { "type": "keyword" }
          }
        },
        "status": { "type": "keyword" },
        "slug": { "type": "keyword" }
      }
    },
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "analysis": {
        "analyzer": {
          "content_analyzer": {
            "type": "standard",
            "stopwords": "_english_"
          }
        }
      }
    }
  }
}
```

## Cost Management

### OpenSearch Cost Optimization
```yaml
cost_optimization:
  # Use t3.small for development, scale up as needed
  right_sizing:
    development: "t3.small.search"
    production_initial: "t3.small.search"
    production_growth: "t3.medium.search"
  
  # Storage optimization
  storage:
    lifecycle_policy: "delete old indices after 365 days"
    compression: "best_compression"
    warm_storage: "after 90 days"
  
  # Reserved instances for cost savings
  reserved_instances:
    commitment: "1 year"
    savings: "up to 40%"
    suitable_when: "stable workload"
```

### Alternative Budget Options

#### 1. Typesense Cloud
```yaml
typesense:
  cost: "$15/month"
  features: "100K documents, 0.5GB RAM"
  pros: "Easy setup, good performance"
  cons: "Document limit, less features"
```

#### 2. Algolia (Premium)
```yaml
algolia:
  cost: "$50-100/month"
  features: "Advanced search, analytics"
  pros: "Excellent UX, managed service"
  cons: "Higher cost, vendor lock-in"
```

#### 3. Self-hosted Elasticsearch
```yaml
self_hosted:
  cost: "$20-30/month (VPS)"
  features: "Full control, unlimited"
  pros: "Cost effective, customizable"
  cons: "Requires maintenance, expertise"
```

This search infrastructure provides robust full-text search capabilities with smart fallback strategies and cost optimization for your blog's scale.