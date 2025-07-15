export interface PostManagerRequest {
  user_id?: string;
  title: string;
  content: string;
  abstract?: string;
  thumbnail_hash?: string;
  status?: "draft" | "published" | "archived";
  references?: ReferenceData[];
  fixed_tags?: string[];
  generated_tags?: GeneratedTagData[];
}

export interface ReferenceData {
  text: string;
  url?: string;
  sequence_number: number;
  start_position: number;
  end_position: number;
}

export interface GeneratedTagData {
  name: string;
  confidence_score?: number;
}

export interface TocEntry {
  level: number;
  title: string;
  anchor: string;
  position_in_content: number;
}

export interface PostManagerResponse {
  post_id: string;
  indexed: boolean;
  references_created?: number;
  toc_entries_created?: number;
  updated?: boolean;
  references_updated?: number;
  toc_entries_updated?: number;
}

export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  abstract: string;
  tags: string[];
  published_at: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}