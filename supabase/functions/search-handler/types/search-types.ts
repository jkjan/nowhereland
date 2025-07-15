export interface SearchRequest {
  query?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sort?: 'relevance' | 'date_desc' | 'date_asc';
  include_draft?: boolean;
}

export interface SearchResult {
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
}

export interface SearchPagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface SearchQueryInfo {
  query?: string;
  tags: string[];
  took: number;
  engine: 'postgresql' | 'opensearch';
  suggestions: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  pagination: SearchPagination;
  query_info: SearchQueryInfo;
}

export interface SearchHistoryEntry {
  search_term: string;
  result_count: number;
  search_type: 'text' | 'tag' | 'combined';
  ip_address?: string;
  user_agent?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}