# Image CDN Configuration - Supabase Edge Functions

## Overview

This document outlines the image CDN implementation using Supabase Edge Functions, providing dynamic image transformation, WebP conversion, and intelligent caching for optimal performance and cost efficiency.

## URL Structure & API Design

### Public API Endpoints
```
# Dynamic resizing with WebP conversion
GET /media/{hash_code}?width={width}&quality={quality}&format={format}

# Original image access
GET /media/{hash_code}/original

# Pre-processed sizes (cached)
GET /media/{hash_code}/{width}.webp
GET /media/{hash_code}/thumbnail.webp (200x200)
GET /media/{hash_code}/medium.webp (800x600)
GET /media/{hash_code}/large.webp (1200x900)

# Image metadata
GET /media/{hash_code}/info

# Upload endpoint (admin only)
POST /media/upload
```

### Query Parameters
```typescript
interface ImageTransformParams {
  width?: number;           // Target width (1-2000px)
  height?: number;          // Target height (optional, maintains aspect ratio if not provided)
  quality?: number;         // WebP quality (1-100, default: 80)
  format?: 'webp' | 'jpeg' | 'png'; // Output format (default: webp)
  fit?: 'cover' | 'contain' | 'fill'; // Resize behavior
  blur?: number;            // Blur radius (0-20)
  sharpen?: number;         // Sharpen amount (0-10)
  grayscale?: boolean;      // Convert to grayscale
}
```

### Responsive Image Sets
```html
<!-- Automatic responsive images -->
<picture>
  <source media="(max-width: 480px)" 
          srcset="/media/abc123?width=480 1x, /media/abc123?width=960 2x">
  <source media="(max-width: 768px)" 
          srcset="/media/abc123?width=768 1x, /media/abc123?width=1536 2x">
  <img src="/media/abc123?width=1200" 
       srcset="/media/abc123?width=1200 1x, /media/abc123?width=2400 2x"
       alt="Blog post image">
</picture>
```

This image CDN implementation provides automatic WebP conversion, intelligent caching, dynamic resizing, and optimal performance for your blog's image delivery needs!