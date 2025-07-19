import { ImageValidationResult } from "../types/image-types.ts";

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return {
      isValid: false,
      error: "No image file provided",
      details: {
        max_size: "5MB",
        allowed_types: ["JPEG", "PNG", "GIF", "WebP"]
      }
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size ${file.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
      details: {
        max_size: "5MB",
        allowed_types: ["JPEG", "PNG", "GIF", "WebP"],
        file_size: file.size
      }
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Supported types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      details: {
        max_size: "5MB",
        allowed_types: ["JPEG", "PNG", "GIF", "WebP"],
        file_size: file.size
      }
    };
  }

  return { isValid: true };
}

export function validateImageBuffer(buffer: ArrayBuffer, mimeType: string): ImageValidationResult {
  if (!buffer || buffer.byteLength === 0) {
    return {
      isValid: false,
      error: "Empty or invalid image buffer"
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      error: `Invalid MIME type: ${mimeType}`
    };
  }

  return { isValid: true };
}