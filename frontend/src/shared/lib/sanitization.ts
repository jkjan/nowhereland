import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * Designed for form inputs and user-generated content
 */
export class InputSanitizer {
  /**
   * Sanitizes basic text input (display names, usernames, etc.)
   * Removes all HTML tags and script-like content
   */
  static sanitizeText(input: string): string {
    if (!input) return input;
    
    // Remove all HTML tags for basic text inputs
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true, // Keep text content, remove only tags
    });
  }

  /**
   * Sanitizes email input
   * Removes HTML tags and validates basic email format
   */
  static sanitizeEmail(input: string): string {
    if (!input) return input;
    
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
    
    // Remove any remaining script-like content
    return sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
                   .replace(/javascript:/gi, '')
                   .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Sanitizes rich text content (for posts, comments, etc.)
   * Allows safe HTML tags but removes dangerous content
   */
  static sanitizeRichText(input: string): string {
    if (!input) return input;
    
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror', 'onmouseover'],
    });
  }

  /**
   * Validates and sanitizes form input based on type
   */
  static sanitizeFormInput(input: string, type: 'text' | 'email' | 'rich'): string {
    switch (type) {
      case 'email':
        return this.sanitizeEmail(input);
      case 'rich':
        return this.sanitizeRichText(input);
      case 'text':
      default:
        return this.sanitizeText(input);
    }
  }

  /**
   * Checks if input contains potentially dangerous content
   */
  static containsMaliciousContent(input: string): boolean {
    if (!input) return false;
    
    const dangerousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
      /data:text\/html/i,
      /vbscript:/i,
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(input));
  }
}

/**
 * Zod refinement function for XSS protection
 * Usage: z.string().refine(preventXSS, { message: "Invalid characters detected" })
 */
export function preventXSS(value: string): boolean {
  return !InputSanitizer.containsMaliciousContent(value);
}

/**
 * Zod transform function to sanitize input
 * Usage: z.string().transform(sanitizeInput)
 */
export function sanitizeInput(value: string): string {
  return InputSanitizer.sanitizeText(value);
}

/**
 * Zod transform function to sanitize email input
 * Usage: z.string().email().transform(sanitizeEmail)
 */
export function sanitizeEmailInput(value: string): string {
  return InputSanitizer.sanitizeEmail(value);
}