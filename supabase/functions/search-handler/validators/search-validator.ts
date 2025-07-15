import { SearchRequest, ValidationResult } from "../types/search-types.ts";

export function validateSearchRequest(data: any): ValidationResult {
  const errors: string[] = [];

  // Validate query length
  if (data.query !== undefined) {
    if (typeof data.query !== 'string') {
      errors.push("Query must be a string");
    } else if (data.query.length > 255) {
      errors.push("Query must be 255 characters or less");
    }
  }

  // Validate tags array
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push("Tags must be an array");
    } else {
      if (data.tags.length > 10) {
        errors.push("Maximum 10 tags allowed");
      }
      
      for (const tag of data.tags) {
        if (typeof tag !== 'string') {
          errors.push("All tags must be strings");
          break;
        }
        if (tag.length > 50) {
          errors.push("Each tag must be 50 characters or less");
          break;
        }
      }
    }
  }

  // Validate pagination
  if (data.limit !== undefined) {
    if (typeof data.limit !== 'number' || !Number.isInteger(data.limit)) {
      errors.push("Limit must be an integer");
    } else if (data.limit < 1 || data.limit > 50) {
      errors.push("Limit must be between 1 and 50");
    }
  }

  if (data.offset !== undefined) {
    if (typeof data.offset !== 'number' || !Number.isInteger(data.offset)) {
      errors.push("Offset must be an integer");
    } else if (data.offset < 0) {
      errors.push("Offset must be 0 or greater");
    }
  }

  // Validate sort option
  if (data.sort !== undefined) {
    const validSorts = ['relevance', 'date_desc', 'date_asc'];
    if (!validSorts.includes(data.sort)) {
      errors.push("Sort must be one of: relevance, date_desc, date_asc");
    }
  }

  // Validate include_draft
  if (data.include_draft !== undefined && typeof data.include_draft !== 'boolean') {
    errors.push("Include_draft must be a boolean");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}