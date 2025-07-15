// CommentFilterRequest is now exported from validator using Zod

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