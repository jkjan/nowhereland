# Search Handler Edge Function

Implements UC-SD-001: Basic Content Search for Nowhere Land blog.

## Overview

This Supabase Edge Function processes search queries and returns formatted results with pagination. It supports both text search and tag filtering using PostgreSQL full-text search, with a placeholder for future OpenSearch integration.

## Features

- **PostgreSQL Full-Text Search**: Primary search engine using `to_tsvector` and `plainto_tsquery`
- **Tag Filtering**: Support for both fixed and generated tags with AND logic
- **Search History**: Tracks all searches for admin analytics
- **Pagination**: Configurable limit/offset with metadata
- **Site Setting Integration**: Checks `is_opensearch_enabled` for future OpenSearch support
- **Input Validation**: Comprehensive request validation using Zod
- **CORS Support**: Proper CORS headers for web application integration

## API Specification

### Endpoint
```
POST /functions/v1/search-handler
```

### Request Body
```typescript
{
  query?: string;           // Search text (max 255 chars)
  tags?: string[];          // Tag filters (max 10 items, 50 chars each)
  limit?: number;           // Results per page (1-50, default: 10)
  offset?: number;          // Results to skip (min: 0, default: 0)
  sort?: 'relevance' | 'date_desc' | 'date_asc'; // Sort order (default: relevance)
  include_draft?: boolean;  // Include draft posts (admin only, default: false)
}
```

### Response Body
```typescript
{
  results: Array<{
    id: string;
    title: string;
    abstract: string | null;
    thumbnail_hash: string | null;
    published_at: string;
    tags: string[];
    score?: number;
    highlights?: {
      title?: string[];
      content?: string[];
    };
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  query_info: {
    query?: string;
    tags: string[];
    took: number;
    engine: 'postgresql' | 'opensearch';
    suggestions: string[];
  };
}
```

## Database Dependencies

### Tables Used
- `site_setting` - Check OpenSearch configuration
- `published_post_with_tags` - Main search view with posts, tags, and metadata
- `search_history` - Track searches for analytics

### Required Views
- `published_post_with_tags` - Aggregated view of published posts with tags

## Search Logic

### Text Search
- Uses PostgreSQL `to_tsvector('english', column)` for full-text indexing
- Searches across `title`, `abstract`, and `content` fields
- Uses `plainto_tsquery('english', query)` for natural language queries

### Tag Search
- Filters posts that contain ALL specified tags (AND logic)
- Searches both `fixed_tags` and `generated_tags` arrays
- Case-insensitive tag matching

### Combined Search
- When both query and tags provided, applies both filters
- Text search first, then tag filtering on results

## OpenSearch Integration

Currently implements a placeholder for OpenSearch:
- Checks `site_setting.is_opensearch_enabled`
- When enabled, returns empty results with `engine: 'opensearch'`
- TODO comment indicates future implementation needed

## Testing

### Deno Tests
```bash
# Run Deno tests
deno test supabase/functions/search-handler/tests/search-handler.test.ts --allow-net --allow-env
```

### Node.js Integration Tests
```bash
# Run Node.js integration tests
node supabase/functions/search-handler/tests/integration.test.mjs
```

### Local Testing with Supabase CLI
```bash
# Start local Supabase
npx supabase start

# Serve the function
npx supabase functions serve search-handler --no-verify-jwt

# Test the function
curl -X POST http://localhost:54321/functions/v1/search-handler \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "tags": ["dev"], "limit": 5}'
```

## Environment Variables

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous API key

## Error Handling

- **400 Bad Request**: Invalid input parameters (Zod validation)
- **405 Method Not Allowed**: Non-POST requests
- **500 Internal Server Error**: Database errors or unexpected failures

## Performance Considerations

- Uses `published_post_with_tags` view for optimized queries
- Implements pagination to limit result sets
- Tracks query execution time in response
- Async search history tracking (doesn't block response)

## Future Enhancements

1. **OpenSearch Integration**: Replace TODO with actual OpenSearch implementation
2. **Relevance Scoring**: Implement proper search relevance calculations
3. **Search Suggestions**: Add query suggestions for empty results
4. **Highlighting**: Implement search term highlighting in results
5. **Caching**: Add result caching for popular queries
6. **Analytics**: Enhanced search analytics and metrics

## Related Files

- `/docs/prd/04-search-discovery.md` - Product requirements
- `/docs/api/nowhereland-api-search.yaml` - API specification
- `/supabase/migrations/202507150000001_supabase_schema.sql` - Database schema