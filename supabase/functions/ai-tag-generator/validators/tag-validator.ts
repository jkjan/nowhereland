import { TagGeneratorRequest } from "../types/tag-types.ts";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: any;
}

export function validateTagRequest(data: TagGeneratorRequest): ValidationResult {
  if (!data.title || !data.content) {
    return {
      isValid: false,
      error: "Title and content are required",
      details: {
        min_content_length: 10,
        max_content_length: 50000
      }
    };
  }

  if (data.content.length < 50) {
    return {
      isValid: false,
      error: "Content must be at least 50 characters long",
      details: {
        min_content_length: 50,
        max_content_length: 50000
      }
    };
  }

  if (data.content.length > 50000) {
    return {
      isValid: false,
      error: "Content exceeds maximum length of 50,000 characters",
      details: {
        min_content_length: 50,
        max_content_length: 50000
      }
    };
  }

  if (data.max_tags && (data.max_tags < 1 || data.max_tags > 10)) {
    return {
      isValid: false,
      error: "max_tags must be between 1 and 10",
      details: {
        max_tags_range: {
          min: 1,
          max: 10
        }
      }
    };
  }

  return { isValid: true };
}