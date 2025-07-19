export interface TagGeneratorRequest {
  title: string;
  content: string;
  existing_tags?: string[];
  max_tags?: number;
  include_fixed_tags?: boolean;
}

export interface TagGeneratorResponse {
  tags: string[];
  confidence_scores: Record<string, number>;
  processing_time: number;
  model_used: string;
  cost_estimate: number;
  warning?: string | null;
  error?: string | null;
}

export interface FixedTag {
  name: string;
  color: string;
}