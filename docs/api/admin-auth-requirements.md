# Admin Authentication Requirements for API Access

## Overview
The Nowhere Land API requires secure admin authentication for accessing protected endpoints and the Swagger UI documentation at `/admin/api`. This document outlines the complete authentication and authorization requirements.

## Authentication Architecture

### 1. JWT Token-Based Authentication
```typescript
interface AuthTokens {
  access_token: string    // Short-lived (1 hour)
  refresh_token: string   // Long-lived (30 days)
  token_type: "Bearer"
  expires_in: number      // Seconds until expiration
}
```

### 2. Admin User Requirements
```typescript
interface AdminUser {
  id: string              // nanoid (10 characters)
  email: string           // Valid email address
  display_name: string    // Display name
  role: "admin"           // Must be admin role
  approved: true          // Must be approved
  created_at: string      // ISO timestamp
  last_login: string      // ISO timestamp
}
```

## Authentication Flow for API Access

### Step 1: Admin Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@nowhereland.com",
  "password": "secureAdminPassword123"
}
```

**Success Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": "1weyuz23fx",
    "email": "admin@nowhereland.com",
    "display_name": "Kyojun Jin",
    "role": "admin",
    "approved": true
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: User not approved or not admin role
- `429 Too Many Requests`: Rate limit exceeded

### Step 2: API Request Authorization
All protected API requests must include the JWT token:

```http
GET /admin/stats
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Step 3: Token Refresh
When access token expires, use refresh token:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## JWT Token Structure

### Access Token Claims
```json
{
  "iss": "https://prod-xxx.supabase.co/auth/v1",
  "sub": "1weyuz23fx",
  "aud": "authenticated",
  "exp": 1699123456,
  "iat": 1699119856,
  "email": "admin@nowhereland.com",
  "role": "admin",
  "approved": true,
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "display_name": "Kyojun Jin"
  }
}
```

### Token Validation Process
1. **Signature Validation**: Verify using JWKS public keys
2. **Expiration Check**: Ensure token not expired
3. **Issuer Validation**: Verify token issued by Supabase
4. **Role Check**: Ensure user has admin role
5. **Approval Check**: Verify user is approved

## Authorization Matrix

| Endpoint Category | Anonymous | Authenticated User | Admin |
|-------------------|-----------|-------------------|-------|
| **Public Content** | ✅ Read | ✅ Read | ✅ Full |
| **Authentication** | ✅ Login/Signup | ✅ Refresh/Logout | ✅ Full |
| **Comments** | ✅ Read/Write | ✅ Read/Write | ✅ Moderate |
| **Posts** | ✅ Read | ✅ Read | ✅ Full CRUD |
| **Media** | ✅ View | ❌ | ✅ Upload/Manage |
| **Search** | ✅ Search | ✅ Search | ✅ Analytics |
| **AI Services** | ❌ | ❌ | ✅ Generate |
| **Admin Endpoints** | ❌ | ❌ | ✅ Full |
| **API Documentation** | ❌ | ❌ | ✅ View |

## Swagger UI Authentication

### Client-Side Token Management
```typescript
// lib/auth.ts
class AuthManager {
  private static readonly ACCESS_TOKEN_KEY = 'nowhereland_access_token'
  private static readonly REFRESH_TOKEN_KEY = 'nowhereland_refresh_token'

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY)
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
  }

  static async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY)
    if (!refreshToken) return null

    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (!response.ok) {
        this.clearTokens()
        return null
      }

      const { access_token, refresh_token } = await response.json()
      this.setTokens(access_token, refresh_token)
      return access_token
    } catch (error) {
      this.clearTokens()
      return null
    }
  }
}
```

### Swagger UI Configuration
```typescript
// app/admin/api/page.tsx
const swaggerConfig = {
  requestInterceptor: async (request: any) => {
    let token = AuthManager.getAccessToken()
    
    // Try to refresh if no token
    if (!token) {
      token = await AuthManager.refreshToken()
    }
    
    // If still no token, redirect to login
    if (!token) {
      window.location.href = '/admin/login'
      return request
    }
    
    // Add token to request
    request.headers['Authorization'] = `Bearer ${token}`
    return request
  },
  
  responseInterceptor: (response: any) => {
    // Handle 401 responses
    if (response.status === 401) {
      AuthManager.clearTokens()
      window.location.href = '/admin/login'
    }
    return response
  }
}
```

## Security Implementation

### 1. Password Requirements (NIST SP 800-63-4)
```typescript
interface PasswordPolicy {
  minLength: 8
  maxLength: 64
  allowUnicode: true
  preventCommon: true
  noComplexityRequirements: true // NIST recommendation
}
```

### 2. Rate Limiting
```yaml
rate_limits:
  login_attempts:
    limit: 5
    window: 15 minutes
    per: IP address
    
  api_requests:
    anonymous: 30/minute
    authenticated: 100/minute
    admin: 1000/minute
    
  token_refresh:
    limit: 10
    window: 1 hour
    per: user
```

### 3. Session Management
```typescript
interface SessionConfig {
  accessTokenDuration: '1 hour'
  refreshTokenDuration: '30 days'
  tokenRotation: true          // Rotate refresh tokens
  secureCookies: true          // Use httpOnly cookies in production
  sameSiteStrict: true         // CSRF protection
}
```

### 4. JWKS Endpoint Configuration
```http
GET /.well-known/jwks.json
```

**Response**:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-id-1",
      "use": "sig",
      "alg": "RS256",
      "n": "public-key-modulus...",
      "e": "AQAB"
    }
  ]
}
```

## Error Handling

### Authentication Errors
```typescript
interface AuthError {
  error: string
  message: string
  details?: any
  timestamp: string
}

// Common error responses
const authErrors = {
  INVALID_CREDENTIALS: {
    status: 401,
    error: 'invalid_credentials',
    message: 'Invalid email or password'
  },
  
  USER_NOT_APPROVED: {
    status: 403,
    error: 'user_not_approved',
    message: 'Account pending approval'
  },
  
  INSUFFICIENT_PRIVILEGES: {
    status: 403,
    error: 'insufficient_privileges',
    message: 'Admin access required'
  },
  
  TOKEN_EXPIRED: {
    status: 401,
    error: 'token_expired',
    message: 'Access token expired'
  },
  
  TOKEN_INVALID: {
    status: 401,
    error: 'token_invalid',
    message: 'Invalid or malformed token'
  }
}
```

### Client-Side Error Handling
```typescript
// utils/api-client.ts
class ApiClient {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = AuthManager.getAccessToken()
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    }

    let response = await fetch(endpoint, config)
    
    // Handle token expiration
    if (response.status === 401) {
      const newToken = await AuthManager.refreshToken()
      if (newToken) {
        // Retry with new token
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${newToken}`,
        }
        response = await fetch(endpoint, config)
      } else {
        // Redirect to login
        window.location.href = '/admin/login'
        throw new Error('Authentication required')
      }
    }
    
    return response
  }
}
```

## Testing Strategy

### 1. Authentication Testing
```typescript
describe('Admin Authentication', () => {
  test('should login admin user successfully', async () => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nowhereland.com',
        password: 'testPassword123'
      })
    })
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.access_token).toBeDefined()
    expect(data.user.role).toBe('admin')
  })
  
  test('should reject non-admin users', async () => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'userPassword123'
      })
    })
    
    expect(response.status).toBe(403)
  })
})
```

### 2. API Authorization Testing
```typescript
describe('API Authorization', () => {
  test('should allow admin access to protected endpoints', async () => {
    const token = await getAdminToken()
    
    const response = await fetch('/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    expect(response.status).toBe(200)
  })
  
  test('should reject requests without valid token', async () => {
    const response = await fetch('/admin/stats')
    expect(response.status).toBe(401)
  })
})
```

## Deployment Checklist

### Environment Configuration
- [ ] Set `SUPABASE_JWT_SECRET` for token validation
- [ ] Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- [ ] Set secure cookie configuration for production
- [ ] Configure CORS for API endpoints

### Security Configuration
- [ ] Enable HTTPS in production
- [ ] Configure rate limiting middleware
- [ ] Set up audit logging for admin actions
- [ ] Configure CSP headers for Swagger UI

### Admin User Setup
- [ ] Create admin user account in Supabase
- [ ] Set `role = 'admin'` and `approved = true`
- [ ] Test login flow end-to-end
- [ ] Verify API access with admin token

This authentication system provides secure, role-based access to the API documentation while maintaining the high security standards required for a production blog platform.