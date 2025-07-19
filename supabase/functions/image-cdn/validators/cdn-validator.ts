import { z } from "npm:zod";
import { ValidationResult } from "../types/cdn-types.ts";

const ImageCdnQuerySchema = z.object({
  width: z.string().optional()
    .transform((val) => val ? parseInt(val, 10) : undefined)
    .refine((num) => {
      if (num === undefined) return true;
      return !isNaN(num) && num >= 1 && num <= 2000;
    }, {
      message: "Width must be between 1 and 2000 pixels"
    }),
});

const ImageHashSchema = z.string()
  .min(1, "Image hash is required")
  .max(50, "Image hash is too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Image hash contains invalid characters");

export function validateImageCdnRequest(hash: string, searchParams: URLSearchParams): ValidationResult {
  try {
    // Validate hash
    ImageHashSchema.parse(hash);
    
    // Convert URLSearchParams to object for Zod validation
    const queryParams: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      queryParams[key] = value;
    }
    
    // Validate query parameters
    const validatedParams = ImageCdnQuerySchema.parse(queryParams);
    console.log('Validated params:', validatedParams);
    
    // Additional validation: if width is 'original', it should be the only parameter
    if (queryParams.width === 'original' && Object.keys(queryParams).length > 1) {
      return {
        isValid: false,
        errors: ["When requesting original image, no other parameters are allowed"]
      };
    }
    
    return {
      isValid: true,
      errors: []
    };
  } catch (error) {
    console.log('Validation error:', error);
    
    if (error instanceof z.ZodError) {
      const errors = error.errors?.map(err => 
        err.path.length > 0 
          ? `${err.path.join('.')}: ${err.message}`
          : err.message
      ) || ["Validation failed"];
      
      return {
        isValid: false,
        errors: errors.length > 0 ? errors : ["Validation failed"]
      };
    }
    
    return {
      isValid: false,
      errors: [`Validation failed: ${error?.message || 'Unknown error'}`]
    };
  }
}

export function parseImageCdnParams(searchParams: URLSearchParams) {
  const width = searchParams.get('width');
  
  return {
    width: width ? parseInt(width, 10) : undefined,
  };
}