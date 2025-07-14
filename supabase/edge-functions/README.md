# Supabase Edge Functions

## Function List

1. **post-indexer** - Index posts to OpenSearch
2. **search-handler** - Handle search requests and return results
3. **comment-filter** - Filter comments based on keywords
4. **comment-moderation** - Handle comment moderation actions
5. **comment-notifications** - Update flagged comment notifications
6. **image-processor** - Process and convert uploaded images
7. **media-cdn** - Serve images with dynamic resizing
8. **ai-tag-generator** - Generate tags using Claude Haiku 3
9. **ai-abstract-generator** - Generate abstracts using Claude Haiku 3
10. **view-tracker** - Track post views and dwell time
11. **analytics-aggregator** - Aggregate analytics data periodically

---

## Function Details

### 1. post-indexer
**Trigger**: Database trigger on post create/update/delete  
**Purpose**: Keep OpenSearch index synchronized with blog posts

**What it does**:
- Index post content, title, abstract, tags to OpenSearch
- Handle post deletion from search index
- Update existing post data in search index
- Maintain search relevance scoring
- Log indexing operations

```typescript
// Pseudo-code
export default async function(req: Request) {
  const { type, record } = await req.json() // 'INSERT'|'UPDATE'|'DELETE'
  
  if (type === 'DELETE') {
    await opensearch.delete(record.id)
  } else {
    const searchDoc = {
      id: record.id,
      title: record.title,
      content: record.content,
      abstract: record.abstract,
      tags: record.tags,
      published_at: record.published_at
    }
    await opensearch.index(searchDoc)
  }
  
  return new Response('OK')
}
```

### 2. search-handler
**Trigger**: HTTP request from frontend search  
**Purpose**: Process search queries and return formatted results

**What it does**:
- Parse text and tag components from search query
- Execute OpenSearch query with proper boosting
- Format results for frontend consumption
- Log search analytics (anonymized)
- Handle fallback to PostgreSQL if OpenSearch fails

```typescript
// Pseudo-code
export default async function(req: Request) {
  const { q, tags } = await req.json()
  
  // Parse query
  const textQuery = parseTextFromQuery(q)
  const tagFilters = parseTags(tags)
  
  try {
    // Search OpenSearch
    const results = await opensearch.search({
      query: textQuery,
      filters: { tags: tagFilters },
      boost: { title: 2, tags: 3 }
    })
    
    // Log analytics
    await logSearch(hashQuery(q), results.length)
    
    return Response.json(formatResults(results))
  } catch (error) {
    // Fallback to PostgreSQL
    const fallbackResults = await postgresSearch(textQuery, tagFilters)
    return Response.json(formatResults(fallbackResults))
  }
}
```

### 3. comment-filter
**Trigger**: HTTP request on comment submission  
**Purpose**: Filter comments based on admin-configured keywords

**What it does**:
- Load current filter keywords from database
- Check comment content against keyword list
- Support case-sensitive/insensitive matching
- Return approval status (approved/flagged)
- Handle keyword pattern matching

```typescript
// Pseudo-code
export default async function(req: Request) {
  const { content, author_name } = await req.json()
  
  // Load filter keywords from database
  const keywords = await supabase
    .from('filter_keywords')
    .select('keyword, case_sensitive')
  
  // Check content against keywords
  let flagged = false
  for (const { keyword, case_sensitive } of keywords) {
    const searchContent = case_sensitive ? content : content.toLowerCase()
    const searchKeyword = case_sensitive ? keyword : keyword.toLowerCase()
    
    if (searchContent.includes(searchKeyword)) {
      flagged = true
      break
    }
  }
  
  return Response.json({
    status: flagged ? 'flagged' : 'approved',
    flagged_keywords: flagged ? [keyword] : []
  })
}
```

### 4. comment-moderation
**Trigger**: HTTP request from admin moderation actions  
**Purpose**: Process admin moderation decisions on flagged comments

**What it does**:
- Update comment status (approved/deleted/flagged)
- Log moderation action with admin ID
- Trigger notification updates
- Handle bulk moderation operations
- Maintain audit trail

```typescript
// Pseudo-code
export default async function(req: Request) {
  const { comment_id, action, admin_id } = await req.json() // 'approve'|'delete'|'keep_flagged'
  
  let new_status
  switch (action) {
    case 'approve': new_status = 'approved'; break
    case 'delete': new_status = 'deleted'; break
    case 'keep_flagged': new_status = 'flagged'; break
  }
  
  // Update comment status
  await supabase
    .from('comments')
    .update({ status: new_status })
    .eq('id', comment_id)
  
  // Log moderation action
  await supabase
    .from('moderation_log')
    .insert({
      comment_id,
      action,
      admin_id,
      timestamp: new Date()
    })
  
  return Response.json({ success: true })
}
```

### 5. comment-notifications
**Trigger**: Database trigger when comment is flagged  
**Purpose**: Update real-time notification badges for admin

**What it does**:
- Count current flagged comments
- Send real-time notification via Supabase Realtime
- Update notification badge counter
- Handle notification clearing
- Maintain notification state

```typescript
// Pseudo-code
export default async function(req: Request) {
  const { type, record } = await req.json() // comment status change
  
  // Count flagged comments
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact' })
    .eq('status', 'flagged')
  
  // Send real-time notification
  await supabase
    .channel('admin_notifications')
    .send({
      type: 'broadcast',
      event: 'flagged_comments_count',
      payload: { count }
    })
  
  return new Response('OK')
}
```

### 6. image-processor
**Trigger**: HTTP request on image upload  
**Purpose**: Process and convert images to WebP format with multiple sizes

**What it does**:
- Validate uploaded image format and size
- Convert to WebP format for optimization
- Generate multiple sizes (320px, 480px, 720px)
- Store with hash-based file naming
- Return processed image URLs

```typescript
// Pseudo-code
export default async function(req: Request) {
  const formData = await req.formData()
  const file = formData.get('image') as File
  
  // Validate file
  if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 })
  }
  
  // Generate hash for filename
  const hash = await generateHash(file.name)
  
  // Convert to WebP and resize
  const originalBuffer = await file.arrayBuffer()
  const webpBuffer = await convertToWebP(originalBuffer)
  
  // Store original
  await supabase.storage
    .from('media')
    .upload(`${hash}/original`, file)
  
  // Store WebP version
  await supabase.storage
    .from('media')
    .upload(`${hash}/${getImageWidth(originalBuffer)}.webp`, webpBuffer)
  
  return Response.json({
    hash,
    original_url: `/media/${hash}/original`,
    webp_url: `/media/${hash}/${getImageWidth(originalBuffer)}.webp`
  })
}
```

### 7. media-cdn
**Trigger**: HTTP request for media with query parameters  
**Purpose**: Serve images with dynamic resizing and caching

**What it does**:
- Parse width parameter from URL query
- Resize image to requested dimensions
- Serve from cache if available
- Convert to WebP on-the-fly if needed
- Handle CDN caching headers

```typescript
// Pseudo-code
export default async function(req: Request) {
  const url = new URL(req.url)
  const hash = url.pathname.split('/')[2] // /media/{hash}
  const width = url.searchParams.get('width')
  
  // Check if cached version exists
  const cachedPath = `${hash}/${width}.webp`
  const cached = await supabase.storage
    .from('media')
    .download(cachedPath)
  
  if (cached.data) {
    return new Response(cached.data, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  }
  
  // Load original and resize
  const original = await supabase.storage
    .from('media')
    .download(`${hash}/original`)
  
  const resized = await resizeImage(original.data, parseInt(width))
  
  // Cache resized version
  await supabase.storage
    .from('media')
    .upload(cachedPath, resized)
  
  return new Response(resized, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000'
    }
  })
}
```

### 8. ai-tag-generator
**Trigger**: HTTP request during post creation  
**Purpose**: Generate relevant tags using Claude Haiku 3 API

**What it does**:
- Send post content to Claude Haiku 3
- Request tag generation with specific prompt
- Parse and validate returned tags
- Return formatted tag suggestions
- Handle API errors gracefully

```typescript
// Pseudo-code
export default async function(req: Request) {
  const { title, content } = await req.json()
  
  const prompt = `Generate 3-5 relevant tags for this blog post. Return only lowercase tags separated by commas.
  
  Title: ${title}
  Content: ${content.substring(0, 1000)}...`
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLAUDE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100
      })
    })
    
    const data = await response.json()
    const tags = data.content[0].text
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
    
    return Response.json({ tags })
  } catch (error) {
    return Response.json({ tags: [], error: 'AI service unavailable' })
  }
}
```

### 9. ai-abstract-generator
**Trigger**: HTTP request during post creation  
**Purpose**: Generate post abstract using Claude Haiku 3 API

**What it does**:
- Send post content to Claude Haiku 3
- Request abstract generation with specific prompt
- Validate abstract length and format
- Return formatted abstract text
- Handle API errors with fallback

```typescript
// Pseudo-code
export default async function(req: Request) {
  const { title, content } = await req.json()
  
  const prompt = `Write a concise 2-3 sentence abstract for this blog post. Keep it under 160 characters for SEO.
  
  Title: ${title}
  Content: ${content}`
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLAUDE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200
      })
    })
    
    const data = await response.json()
    const abstract = data.content[0].text.trim()
    
    // Validate length
    if (abstract.length > 160) {
      return Response.json({ 
        abstract: abstract.substring(0, 157) + '...',
        warning: 'Abstract truncated for SEO'
      })
    }
    
    return Response.json({ abstract })
  } catch (error) {
    return Response.json({ 
      abstract: title, // Fallback to title
      error: 'AI service unavailable' 
    })
  }
}
```

### 10. view-tracker
**Trigger**: HTTP request on page view  
**Purpose**: Track post views and dwell time with privacy compliance

**What it does**:
- Check for unique view cookie
- Update view count if new visitor
- Track dwell time for analytics
- Respect GDPR/CCPA privacy settings
- Store anonymized view data

```typescript
// Pseudo-code
export default async function(req: Request) {
  const { post_id, dwell_time, user_consent } = await req.json()
  
  if (!user_consent) {
    return Response.json({ tracked: false })
  }
  
  // Check for existing view cookie
  const cookies = parseCookies(req.headers.get('Cookie') || '')
  const viewCookie = cookies[`view_${post_id}`]
  
  if (!viewCookie) {
    // New view - increment counter
    await supabase
      .from('posts')
      .update({ view_count: supabase.sql`view_count + 1` })
      .eq('id', post_id)
    
    // Set view cookie
    const response = Response.json({ tracked: true, new_view: true })
    response.headers.set('Set-Cookie', 
      `view_${post_id}=1; HttpOnly; SameSite=Strict; Max-Age=86400`)
    return response
  } else {
    // Existing view - just update dwell time
    await supabase
      .from('view_analytics')
      .upsert({
        post_id,
        date: new Date().toISOString().split('T')[0],
        max_dwell_time: Math.max(dwell_time, getCurrentDwellTime(post_id))
      })
    
    return Response.json({ tracked: true, new_view: false })
  }
}
```

### 11. analytics-aggregator
**Trigger**: Scheduled cron job (daily)  
**Purpose**: Aggregate analytics data and clean up old records

**What it does**:
- Aggregate daily search analytics
- Calculate success rates and trends
- Clean up old analytics data (90-day retention)
- Generate dashboard metrics
- Optimize database performance

```typescript
// Pseudo-code
export default async function(req: Request) {
  const today = new Date().toISOString().split('T')[0]
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  
  // Aggregate search analytics
  const searchStats = await supabase
    .from('search_logs')
    .select('search_term_hash, result_count')
    .gte('created_at', ninetyDaysAgo)
  
  const aggregated = aggregateSearchData(searchStats)
  
  // Store aggregated data
  await supabase
    .from('search_analytics')
    .upsert({
      date: today,
      total_searches: aggregated.totalSearches,
      unique_searches: aggregated.uniqueSearches,
      avg_success_rate: aggregated.successRate,
      top_terms: aggregated.topTerms
    })
  
  // Clean up old raw data
  await supabase
    .from('search_logs')
    .delete()
    .lt('created_at', ninetyDaysAgo)
  
  // Clean up old view analytics
  await supabase
    .from('view_analytics')
    .delete()
    .lt('date', ninetyDaysAgo)
  
  return Response.json({ 
    aggregated: true, 
    cleaned_records: cleanedCount 
  })
}
```