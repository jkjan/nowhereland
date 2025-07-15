export interface CommentFilterRequest {
  post_id: string;
  username: string;
  password: string;
  content: string;
  parent_comment_id?: string;
  comment_id?: string; // For updates
}

export interface CommentFilterResponse {
  comment_id: string;
  status: 'approved' | 'flagged';
  message: string;
  flagged_keywords?: string[];
}

export interface FilterKeyword {
  id: string;
  keyword: string;
  is_case_sensitive: boolean;
  is_active: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}