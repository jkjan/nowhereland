import { PostManagerRequest, ValidationResult } from "../types/post-types.ts";

export function validatePostRequest(data: PostManagerRequest, method: string): ValidationResult {
  const errors: string[] = [];

  // Common validations
  if (!data.title?.trim()) {
    errors.push("Title is required");
  }

  if (!data.content?.trim()) {
    errors.push("Content is required");
  }

  if (data.title && data.title.length > 255) {
    errors.push("Title must be 255 characters or less");
  }

  // Method-specific validations
  if (method === "PATCH") {
    const updateData = data as PostManagerRequest & { post_id: string };
    if (!updateData.post_id?.trim()) {
      errors.push("post_id is required for updates");
    }
  }

  // References validation
  if (data.references) {
    data.references.forEach((ref, index) => {
      if (!ref.text?.trim()) {
        errors.push(`Reference ${index + 1}: text is required`);
      }
      if (ref.sequence_number < 1) {
        errors.push(`Reference ${index + 1}: sequence_number must be positive`);
      }
      if (ref.start_position < 0 || ref.end_position < 0) {
        errors.push(`Reference ${index + 1}: positions must be non-negative`);
      }
      if (ref.start_position > ref.end_position) {
        errors.push(`Reference ${index + 1}: start_position must be <= end_position`);
      }
    });
  }

  // Status validation
  if (data.status && !["draft", "published", "archived"].includes(data.status)) {
    errors.push("Status must be one of: draft, published, archived");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}