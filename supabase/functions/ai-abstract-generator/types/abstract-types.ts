export interface AbstractGeneratorRequest {
  title: string;
  content: string;
  target_length?: number;
  style?: 'academic' | 'casual' | 'technical' | 'blog';
  include_keywords?: string[];
}

export interface AbstractGeneratorResponse {
  abstract: string;
  word_count: number;
  character_count: number;
  readability_score: number;
  keywords_included: string[];
  processing_time: number;
  model_used: string;
  cost_estimate: number;
  alternative_versions: string[];
  warning?: string | null;
  error?: string | null;
}