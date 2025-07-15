import { z } from "npm:zod";
import { ValidationResult } from "../types/comment-types.ts";

const CommentFilterRequestSchema = z.object({
  post_id: z.string().min(1, "post_id is required"),
  username: z.string()
    .min(2, "username must be between 2 and 50 characters")
    .max(50, "username must be between 2 and 50 characters")
    .regex(/^[^<>{}]*$/, "username contains invalid characters"),
  password: z.string()
    .min(4, "password must be between 4 and 100 characters")
    .max(100, "password must be between 4 and 100 characters"),
  content: z.string()
    .min(10, "content must be between 10 and 2000 characters")
    .max(2000, "content must be between 10 and 2000 characters"),
  parent_comment_id: z.string().optional(),
  comment_id: z.string().optional()
});

export type CommentFilterRequest = z.infer<typeof CommentFilterRequestSchema>;

export function validateCommentRequest(data: unknown): ValidationResult {
  try {
    CommentFilterRequestSchema.parse(data);
    return {
      isValid: true,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors?.map(err => err.message) || ["Validation failed"]
      };
    }
    return {
      isValid: false,
      errors: ["Invalid input format"]
    };
  }
}