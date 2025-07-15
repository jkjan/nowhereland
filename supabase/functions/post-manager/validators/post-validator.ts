import { PostManagerRequest, ValidationResult } from "../types/post-types.ts";
import { z } from "npm:zod";

const ReferenceSchema = z.object({
  text: z.string().min(1, "Reference text is required").max(1000, "Reference text must be 1000 characters or less"),
  url: z.string().url().optional().or(z.literal("")),
  sequence_number: z.number().positive("Sequence number must be positive"),
  start_position: z.number().nonnegative("Start position must be non-negative"),
  end_position: z.number().nonnegative("End position must be non-negative"),
}).refine(data => data.start_position <= data.end_position, {
  message: "Start position must be <= end position",
  path: ["start_position"]
});

const PostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  content: z.string().min(1, "Content is required"),
  abstract: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  thumbnail_hash: z.string().optional(),
  user_id: z.string().optional(),
  references: z.array(ReferenceSchema).optional(),
});

const UpdatePostSchema = PostSchema.extend({
  post_id: z.string().min(1, "post_id is required for updates"),
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less").optional(),
  content: z.string().min(1, "Content is required").optional(),
});

export function validatePostRequest(data: PostManagerRequest, method: string): ValidationResult {
  try {
    if (method === "PATCH") {
      UpdatePostSchema.parse(data);
    } else {
      PostSchema.parse(data);
    }
    
    return {
      isValid: true,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = (error.errors || []).map(err => 
        err.path && err.path.length > 0 
          ? `${err.path.join('.')}: ${err.message}`
          : err.message
      );
      
      return {
        isValid: false,
        errors: errors.length > 0 ? errors : ["Validation failed"]
      };
    }
    
    return {
      isValid: false,
      errors: [`Validation failed: ${error.message || 'Unknown error'}`]
    };
  }
}