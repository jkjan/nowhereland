import { FilterKeyword } from "../types/comment-types.ts";

export interface FilterResult {
  flagged: boolean;
  matchedKeywords: string[];
}

export class FilterService {
  checkContent(content: string, keywords: FilterKeyword[]): FilterResult {
    const matchedKeywords: string[] = [];
    
    for (const keywordObj of keywords) {
      const { keyword, is_case_sensitive } = keywordObj;
      
      const searchContent = is_case_sensitive ? content : content.toLowerCase();
      const searchKeyword = is_case_sensitive ? keyword : keyword.toLowerCase();
      
      if (searchContent.includes(searchKeyword)) {
        matchedKeywords.push(keyword);
      }
    }

    return {
      flagged: matchedKeywords.length > 0,
      matchedKeywords
    };
  }

  sanitizeContent(content: string): string {
    // Basic XSS prevention - remove script tags and dangerous attributes
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '');
  }
}