export interface ImageProcessorResponse {
  webp_url: string;
  hash: string;
}

export interface ImageMetadata {
  original_width: number;
  original_height: number;
  file_size: number;
  mime_type: string;
  created_at: string;
}