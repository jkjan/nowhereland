import { AbstractGeneratorRequest } from "../types/abstract-types.ts";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: any;
}

export function validateAbstractRequest(data: AbstractGeneratorRequest): ValidationResult {
  if (!data.title || !data.content) {
    return {
      isValid: false,
      error: "Title and content are required",
      details: {
        min_content_length: 100,
        max_content_length: 50000,
        target_length_range: {
          min: 50,
          max: 500
        }
      }
    };
  }

  if (data.content.length < 100) {
    return {
      isValid: false,
      error: "Content must be at least 100 characters long for abstract generation",
      details: {
        min_content_length: 100,
        max_content_length: 50000,
        target_length_range: {
          min: 50,
          max: 500
        }
      }
    };
  }

  if (data.content.length > 50000) {
    return {
      isValid: false,
      error: "Content exceeds maximum length of 50,000 characters",
      details: {
        min_content_length: 100,
        max_content_length: 50000
      }
    };
  }

  if (data.target_length && (data.target_length < 50 || data.target_length > 500)) {
    return {
      isValid: false,
      error: "Target length must be between 50 and 500 characters",
      details: {
        target_length_range: {
          min: 50,
          max: 500
        }
      }
    };
  }

  return { isValid: true };
}