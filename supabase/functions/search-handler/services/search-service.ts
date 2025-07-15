import { SearchRequest, SearchResult } from "../types/search-types.ts";
import { DatabaseService } from "./database-service.ts";

export class SearchService {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  async performSearch(params: SearchRequest): Promise<{ results: SearchResult[]; total: number; engine: 'postgresql' | 'opensearch' }> {
    // Check if OpenSearch is enabled
    const isOpensearchEnabled = await this.databaseService.getSiteSetting('is_opensearch_enabled');

    if (isOpensearchEnabled === 'true') {
      // TODO: Implement OpenSearch integration
      console.log('OpenSearch is enabled but not yet implemented');
      return {
        results: [],
        total: 0,
        engine: 'opensearch'
      };
    }

    // Use PostgreSQL full-text search
    return await this.performPostgreSQLSearch(params);
  }

  private async performPostgreSQLSearch(params: SearchRequest): Promise<{ results: SearchResult[]; total: number; engine: 'postgresql' }> {
    const supabase = this.databaseService.getSupabaseClient();
    
    // Build query
    let query = supabase
      .from('published_post_with_tags')
      .select('id, title, abstract, thumbnail_hash, published_at, fixed_tags, generated_tags, comment_count', 
              { count: 'exact' });

    // Apply text search if query provided
    if (params.query && params.query.trim()) {
      // Sanitize query for PostgreSQL - remove special characters and escape for LIKE
      const sanitizedQuery = params.query.trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (sanitizedQuery) {
        // Use simple LIKE search which is more robust than textSearch
        const searchPattern = `%${sanitizedQuery}%`;
        query = query.or(`title.ilike.${searchPattern},abstract.ilike.${searchPattern}`);
      }
    }

    // Apply tag filtering if tags provided
    if (params.tags && params.tags.length > 0) {
      // Use contains operator for tag arrays - match ANY of the provided tags
      const tagConditions = params.tags.map(tag => 
        `fixed_tags.cs.{${tag.toLowerCase()}},generated_tags.cs.{${tag.toLowerCase()}}`
      );
      
      if (tagConditions.length === 1) {
        query = query.or(tagConditions[0]);
      } else {
        // For multiple tags, we want posts that have ANY of these tags
        query = query.or(tagConditions.join(','));
      }
    }

    // Apply sorting
    switch (params.sort) {
      case 'date_desc':
        query = query.order('published_at', { ascending: false });
        break;
      case 'date_asc':
        query = query.order('published_at', { ascending: true });
        break;
      case 'relevance':
      default:
        // For relevance, order by published_at desc as fallback
        // TODO: Implement proper relevance scoring
        query = query.order('published_at', { ascending: false });
        break;
    }

    // Apply pagination
    const limit = params.limit || 10;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('PostgreSQL search error:', error);
      throw new Error('Database search failed');
    }

    // Format results
    const results: SearchResult[] = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      abstract: row.abstract,
      thumbnail_hash: row.thumbnail_hash,
      published_at: row.published_at,
      tags: [...(row.fixed_tags || []), ...(row.generated_tags || [])],
      score: 1.0 // TODO: Calculate actual relevance score
    }));

    return {
      results,
      total: count || 0,
      engine: 'postgresql'
    };
  }

  async trackSearch(params: SearchRequest, resultCount: number, req: Request): Promise<void> {
    const searchType = params.query && params.tags?.length 
      ? 'combined' 
      : params.tags?.length 
        ? 'tag' 
        : 'text';

    const searchTerm = params.query || (params.tags?.join(',') || '');

    // Get client IP and user agent
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    await this.databaseService.trackSearchHistory({
      search_term: searchTerm,
      result_count: resultCount,
      search_type: searchType,
      ip_address: clientIP,
      user_agent: userAgent
    });
  }
}