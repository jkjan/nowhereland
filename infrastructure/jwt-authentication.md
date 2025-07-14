# JWT/JWKS Authentication Architecture

## Overview

This document outlines the JWT (JSON Web Token) authentication system with JWKS (JSON Web Key Set) for the Nowhere Land blog platform, replacing the previous Supabase Auth approach for better control and flexibility.

## 🎯 Why JWT/JWKS?

### Benefits Over Session-Based Auth
- **Stateless**: No server-side session storage required
- **Scalable**: Can validate tokens without database lookup
- **Distributed**: Works across multiple services/domains
- **Standard**: Industry-standard protocol with wide support
- **Flexible**: Can include custom claims and metadata

### JWKS Advantages
- **Security**: Public key rotation without service restart
- **Verification**: Asymmetric cryptography for token validation
- **Key Management**: Centralized key distribution
- **Standards Compliant**: RFC 7517 compliant implementation

## Architecture Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Auth Service  │
│   (Next.js)     │    │   (AWS/Kong)    │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Login Request      │                       │
         ├──────────────────────▶│ 2. Forward to Auth    │
         │                       ├──────────────────────▶│
         │                       │                       │ 3. Validate & Issue JWT
         │                       │ 4. Return JWT         │◀──────────────────────┤
         │ 5. JWT + Refresh      │◀──────────────────────┤                       │
         │◀──────────────────────┤                       │                       │
         │                       │                       │                       │
         │ 6. API Request + JWT  │                       │                       │
         ├──────────────────────▶│ 7. Validate JWT       │                       │
         │                       │   (using JWKS)        │                       │
         │                       │ 8. Forward to Service │                       │
         │                       ├────────────────────┐  │                       │
         │                       │                    │  │                       │
         │ 9. API Response       │ 10. Service Response│  │                       │
         │◀──────────────────────│◀───────────────────┘  │                       │
         │                       │                       │                       │
```

## JWT Token Structure

### Access Token
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "2024-01-key-001"
  },
  "payload": {
    "iss": "https://auth.nowhereland.com",
    "sub": "admin-user-id",
    "aud": ["https://api.nowhereland.com"],
    "exp": 1704067200,
    "iat": 1704063600,
    "jti": "token-unique-id",
    "role": "admin",
    "email": "admin@nowhereland.com",
    "permissions": ["read:posts", "write:posts", "delete:posts", "admin:all"]
  },
  "signature": "..."
}
```

### Refresh Token
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "2024-01-key-001"
  },
  "payload": {
    "iss": "https://auth.nowhereland.com",
    "sub": "admin-user-id",
    "aud": ["https://auth.nowhereland.com"],
    "exp": 1706655600,
    "iat": 1704063600,
    "jti": "refresh-token-unique-id",
    "token_type": "refresh",
    "scope": "offline_access"
  },
  "signature": "..."
}
```

## JWKS Endpoint Implementation

### JWKS Response Format
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "key_ops": ["verify"],
      "alg": "RS256",
      "kid": "2024-01-key-001",
      "n": "0vx7agoebGcQSu...public-key-modulus",
      "e": "AQAB",
      "x5c": ["MIIC...certificate-chain"],
      "x5t": "fingerprint",
      "x5t#S256": "sha256-fingerprint"
    },
    {
      "kty": "RSA",
      "use": "sig",
      "key_ops": ["verify"],
      "alg": "RS256",
      "kid": "2024-01-key-002",
      "n": "xGaVhFr9yC...backup-key-modulus",
      "e": "AQAB"
    }
  ]
}
```

## Cost Analysis

### JWT/JWKS Implementation Costs
```yaml
supabase_edge_functions: $0-5/month    # Auth & JWKS endpoints
aws_api_gateway: $3-5/month            # JWT validation
total_monthly: $3-10/month

# Benefits:
# - No per-request auth costs
# - Scales independently
# - Better performance (stateless)
# - Industry standard approach
```

This JWT/JWKS implementation provides a robust, scalable, and standard-compliant authentication system that integrates well with the API Gateway architecture while maintaining security and performance.