# Swagger UI Deployment Plan for Next.js

## Overview
Deploy the OpenAPI specification as an interactive Swagger UI at `/admin/api` with admin authentication required.

## Implementation Strategy

### 1. Static File Deployment
Place the OpenAPI YAML file in Next.js public directory for static serving:

```
public/
├── api/
│   ├── nowhereland-api.yaml
│   └── swagger-ui/     # Swagger UI assets (optional custom build)
```

### 2. Admin Route Structure
```
app/
├── admin/
│   ├── api/
│   │   ├── page.tsx        # Swagger UI page component
│   │   └── layout.tsx      # Admin authentication wrapper
│   └── layout.tsx          # Admin auth middleware
```

### 3. Authentication Flow
1. User navigates to `/admin/api`
2. Admin middleware checks JWT token
3. If not authenticated → redirect to `/admin/login`
4. If authenticated but not admin → show 403 error
5. If admin → serve Swagger UI with OpenAPI spec

## Implementation Components

### Component 1: Admin Layout with Auth
```typescript
// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/admin/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, approved')
    .eq('id', session.user.id)
    .single()

  if (!profile?.approved || profile?.role !== 'admin') {
    redirect('/403')
  }

  return (
    <div className="admin-layout">
      {children}
    </div>
  )
}
```

### Component 2: Swagger UI Page Component
```typescript
// app/admin/api/page.tsx
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Dynamically import swagger-ui-react to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocumentationPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    // Fetch the OpenAPI spec
    fetch('/api/nowhereland-api.yaml')
      .then(response => response.text())
      .then(yamlText => {
        // Parse YAML to JSON if needed, or use directly
        setSpec(yamlText)
      })
      .catch(error => {
        console.error('Failed to load API specification:', error)
      })
  }, [])

  if (!spec) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Nowhere Land API Documentation
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Interactive API documentation for the Nowhere Land blog platform
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <SwaggerUI
          spec={spec}
          docExpansion="list"
          deepLinking={true}
          displayRequestDuration={true}
          tryItOutEnabled={true}
          requestInterceptor={(request) => {
            // Add admin auth token to requests
            const token = localStorage.getItem('supabase.auth.token')
            if (token) {
              request.headers['Authorization'] = `Bearer ${token}`
            }
            return request
          }}
          responseInterceptor={(response) => {
            // Log responses for debugging
            console.log('API Response:', response)
            return response
          }}
        />
      </div>
    </div>
  )
}
```

### Component 3: Package Dependencies
Add to `package.json`:
```json
{
  "dependencies": {
    "swagger-ui-react": "^5.10.5",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/swagger-ui-react": "^4.18.3",
    "@types/js-yaml": "^4.0.9"
  }
}
```

### Component 4: Custom Swagger UI Styling
```css
/* app/admin/api/swagger-ui.css */
.swagger-ui {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.swagger-ui .topbar {
  display: none; /* Hide default topbar */
}

.swagger-ui .info .title {
  color: var(--accent-color, #D01C1F);
}

.swagger-ui .btn.authorize {
  background-color: var(--accent-color, #D01C1F);
  border-color: var(--accent-color, #D01C1F);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .swagger-ui {
    filter: invert(1) hue-rotate(180deg);
  }
  
  .swagger-ui img {
    filter: invert(1) hue-rotate(180deg);
  }
}
```

## Deployment Steps

### Step 1: Install Dependencies
```bash
npm install swagger-ui-react js-yaml
npm install -D @types/swagger-ui-react @types/js-yaml
```

### Step 2: Copy OpenAPI Spec to Public Directory
```bash
cp api/nowhereland-api.yaml public/api/
```

### Step 3: Create Admin API Route Structure
```bash
mkdir -p app/admin/api
touch app/admin/api/page.tsx
touch app/admin/api/layout.tsx
```

### Step 4: Implement Components
- Create admin layout with authentication
- Implement Swagger UI page component
- Add custom styling for brand consistency

### Step 5: Configure Next.js
Update `next.config.js` if needed:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

## Security Considerations

### 1. Admin-Only Access
- Enforce admin authentication via middleware
- Redirect unauthorized users appropriately
- Log access attempts for audit

### 2. API Token Handling
- Securely inject admin JWT tokens into Swagger UI requests
- Use secure token storage (httpOnly cookies preferred)
- Implement token refresh logic

### 3. Environment Configuration
```typescript
// lib/config.ts
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:54321',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}
```

## Testing Strategy

### 1. Authentication Testing
- Test admin login flow
- Verify non-admin users are blocked
- Test session expiration handling

### 2. API Documentation Testing
- Verify OpenAPI spec loads correctly
- Test "Try it out" functionality
- Validate request/response examples

### 3. UI/UX Testing
- Test responsive design on mobile/tablet
- Verify dark mode compatibility
- Test accessibility with screen readers

## Monitoring & Maintenance

### 1. Usage Analytics
Track admin API documentation usage:
- Page views and session duration
- Most accessed endpoints
- Failed authentication attempts

### 2. Spec Synchronization
Ensure API spec stays current:
- Automated spec generation from code comments
- Version control for API changes
- Regular review and updates

### 3. Performance Optimization
- CDN caching for static swagger assets
- Lazy loading of large API specifications
- Optimize bundle size with code splitting

## Benefits of This Approach

1. **Secure**: Admin-only access with proper authentication
2. **Interactive**: Full Swagger UI functionality with "Try it out"
3. **Integrated**: Seamlessly integrated into existing Next.js admin panel
4. **Maintainable**: Single source of truth for API documentation
5. **Professional**: Branded UI consistent with blog design
6. **Testable**: Direct API testing from documentation interface

This implementation provides a professional, secure, and user-friendly API documentation experience for the Nowhere Land blog platform admin.