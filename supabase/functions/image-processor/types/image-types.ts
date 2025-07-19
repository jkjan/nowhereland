export interface ImageProcessorRequest {
  image: File;
  description?: string;
  alt_text?: string;
}

export interface ImageProcessorResponse {
  hash: string;
  original_url: string;
  webp_url: string;
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  original_width: number;
  original_height: number;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    max_size?: string;
    allowed_types?: string[];
    file_size?: number;
  };
}