# Nowhere Land - Infrastructure Architecture

## Overview
This document outlines the infrastructure design for the Nowhere Land personal blog platform, optimized for **100 DAU** and **1000 MAU** with cost-effectiveness and scalability in mind.

## Architecture Principles
- **Cost-Optimized**: Leverage serverless and managed services to minimize operational costs
- **Scalable**: Design to handle growth beyond initial scale
- **Simple**: Avoid over-engineering for day-one requirements
- **Reliable**: Use proven, managed services with high availability
- **Secure**: Implement proper authentication, authorization, and data protection

## High-Level Architecture

The architecture diagram will be generated using the Python script in `/infrastructure/diagram/generate_diagram.py`.

## Technology Stack

### Frontend Layer
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel Free Tier
- **Domain**: Custom domain with SSL

### API Gateway & Orchestration
- **Primary**: AWS API Gateway (REST API)
- **Authentication**: JWT tokens with JWKS validation
- **Rate Limiting**: AWS API Gateway throttling
- **CORS**: Configured for Next.js domain

### Backend Services

#### 1. Blog Service (Core)
- **Database**: Supabase Free Tier
- **Authentication**: JWT tokens with JWKS
- **Authorization**: Row Level Security (RLS) policies
- **API**: Auto-generated REST + GraphQL APIs

#### 2. Media Service
- **Storage**: Supabase Storage (Free Tier)
- **Processing**: Supabase Edge Functions (Deno)
- **CDN**: Supabase CDN
- **Formats**: WebP conversion, multiple sizes

#### 3. Tag/Abstract Generator Service
- **API**: Claude Haiku 3 ($0.25 / MTok)

#### 4. Search Service
- **Engine**: AWS OpenSearch (smallest instance)
- **Indexing**: API Gateway → Lambda → OpenSearch
- **Backup**: PostgreSQL full-text search as fallback

#### 5. Analytics Service
- **Platform**: Supabase/Vercel analytics (Free Tier)
- **Privacy**: GDPR/CCPA compliant cookie handling
- **Metrics**: Page views, dwell time, engagement

## Cost Analysis & Alternatives

### Minimal Stack (Free/Low-Cost)

#### Vercel (Frontend)
- **Plan**: Free Tier
- **Includes**: Hobby projects, Edge Network
- **Estimated Monthly Cost**: $0

#### Supabase (Backend)
- **Plan**: Free Tier
- **Includes**: 500MB database, 1GB storage, 5GB bandwidth
- **Edge Functions**: 500K invocations/month
- **Estimated Monthly Cost**: $0

#### AWS API Gateway
- **Usage**: REST API with ~100K requests/month
- **Estimated Monthly Cost**: $1-2

#### Tag + Abstract Generator
- **Usage**: Tag + Abstract Generator with ~50K inv
- **Estimated Monthly Cost**: $0

#### AWS OpenSearch (Search)
- **Instance**: t3.small.search (smallest available)
- **Storage**: 10GB GP2
- **Estimated Monthly Cost**: $25-30

**Total Estimated Monthly Cost: $26-32**

## Scaling Strategy

### Current Scale (100 DAU, 1000 MAU)
- Supabase Pro plan handles up to 10K concurrent connections
- Vercel Pro handles significant traffic with edge caching
- OpenSearch t3.small handles up to 1M documents

### Growth Path (1K DAU, 10K MAU)
- Upgrade to Supabase Scale plan ($125/month)
- Add read replicas for database
- Upgrade OpenSearch to m6g.large
- Implement Redis caching layer

### High Scale (10K+ DAU)
- Consider multi-region deployment
- Database sharding strategies
- CDN optimization
- Dedicated search cluster

## Security Considerations

### Authentication & Authorization
- **User Auth**: JWT tokens with JWKS endpoint
- **Admin Auth**: Strong passwords + 2FA (optional)
- **API Security**: JWT validation + RLS policies
- **Session Management**: JWT with refresh tokens
- **Token Validation**: JWKS public key verification

### Data Protection
- **Encryption**: At rest and in transit
- **Backups**: Daily automated backups
- **Privacy**: GDPR/CCPA compliance
- **Rate Limiting**: API rate limits + DDoS protection

### Content Security
- **File Uploads**: Virus scanning + file type validation
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Built into Next.js
- **SQL Injection**: Parameterized queries only

## Monitoring & Observability

### Application Monitoring
- **Frontend**: Vercel Analytics + Core Web Vitals
- **Backend**: Supabase monitoring dashboard
- **Database**: Query performance monitoring
- **API**: Response time and error tracking

### Infrastructure Monitoring
- **Uptime**: Pingdom or similar
- **Logs**: Centralized logging with retention
- **Alerts**: Critical error notifications
- **Performance**: APM with Sentry or similar

### Business Metrics
- **Analytics**: Custom dashboard for blog metrics
- **User Behavior**: Heatmaps and user flows
- **Content Performance**: Post engagement metrics
- **SEO**: Search performance tracking

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups (7-day retention)
- **Storage**: Geographic replication
- **Code**: Git repository backups
- **Configuration**: Infrastructure as Code (Terraform)

### Recovery Procedures
- **RTO**: 2 hours for critical services
- **RPO**: 24 hours maximum data loss
- **Failover**: Automated DNS switching
- **Communication**: Status page for users

## Next Steps
1. Set up development environment
2. Configure Supabase projects for all environments
3. Implement core database schema
4. Set up CI/CD pipelines
5. Configure monitoring and alerting
6. Document operational procedures