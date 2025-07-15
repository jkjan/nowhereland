import { CommentFilterRequest, ValidationResult } from "../types/comment-types.ts";

export function validateCommentRequest(data: CommentFilterRequest): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.post_id) {
    errors.push("post_id is required");
  }
  
  if (!data.username) {
    errors.push("username is required");
  } else if (data.username.length < 2 || data.username.length > 50) {
    errors.push("username must be between 2 and 50 characters");
  } else if (/<|>|\{|\}/.test(data.username)) {
    errors.push("username contains invalid characters");
  }

  if (!data.password) {
    errors.push("password is required");
  } else if (data.password.length < 4 || data.password.length > 100) {
    errors.push("password must be between 4 and 100 characters");
  }

  if (!data.content) {
    errors.push("content is required");
  } else if (data.content.length < 10 || data.content.length > 2000) {
    errors.push("content must be between 10 and 2000 characters");
  }

  // Optional fields validation
  if (data.parent_comment_id && typeof data.parent_comment_id !== 'string') {
    errors.push("parent_comment_id must be a string");
  }

  if (data.comment_id && typeof data.comment_id !== 'string') {
    errors.push("comment_id must be a string");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}