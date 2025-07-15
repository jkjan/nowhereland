import { CommentFilterResponse, FilterKeyword } from "../types/comment-types.ts";
import { CommentFilterRequest } from "../validators/comment-validator.ts";
import { DatabaseService } from "./database-service.ts";
import { FilterService } from "./filter-service.ts";
import { PasswordService } from "./password-service.ts";
import { uuidv7 } from "npm:uuidv7";

export class CommentFilterService {
  private dbService = new DatabaseService();
  private filterService = new FilterService();
  private passwordService = new PasswordService();

  async processComment(data: CommentFilterRequest): Promise<CommentFilterResponse> {
    try {
      // Check if post exists
      const postExists = await this.dbService.checkPostExists(data.post_id);
      if (!postExists) {
        throw new Error("Post not found");
      }

      // Check parent comment if specified
      if (data.parent_comment_id) {
        const parentValid = await this.dbService.validateParentComment(data.parent_comment_id);
        if (!parentValid) {
          throw new Error("Invalid parent comment or reply depth exceeded");
        }
      }

      // Sanitize content
      const sanitizedContent = this.filterService.sanitizeContent(data.content);
      
      // Load filter keywords
      const keywords = await this.dbService.getFilterKeywords();
      
      // Check content against keywords
      const filterResult = this.filterService.checkContent(sanitizedContent, keywords);

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(data.password);

      const commentId = data.comment_id || uuidv7();
      const status = filterResult.flagged ? 'flagged' : 'approved';

      if (data.comment_id) {
        // Update existing comment
        await this.dbService.updateComment(data.comment_id, {
          content: sanitizedContent,
          status,
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        });
      } else {
        // Create new comment
        await this.dbService.createComment({
          id: commentId,
          post_id: data.post_id,
          parent_comment_id: data.parent_comment_id,
          username: data.username,
          password_hash: passwordHash,
          content: sanitizedContent,
          status,
          ip_address: null, // Will be set by database trigger if needed
          user_agent: null,
          created_at: new Date().toISOString()
        });
      }

      return {
        comment_id: commentId,
        status,
        message: status === 'flagged' ? 
          "Comment submitted for review" : 
          "Comment posted successfully",
        flagged_keywords: filterResult.flagged ? filterResult.matchedKeywords : undefined
      };

    } catch (error) {
      console.error("Comment filter service error:", error);
      throw new Error(`Comment processing failed: ${error.message}`);
    }
  }
}