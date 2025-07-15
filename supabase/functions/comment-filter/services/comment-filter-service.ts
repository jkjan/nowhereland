import { CommentFilterRequest, CommentFilterResponse, FilterKeyword } from "../types/comment-types.ts";
import { DatabaseService } from "./database-service.ts";
import { FilterService } from "./filter-service.ts";
import { PasswordService } from "./password-service.ts";
import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";

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

      // Load filter keywords
      const keywords = await this.dbService.getFilterKeywords();
      
      // Check content against keywords
      const filterResult = this.filterService.checkContent(data.content, keywords);

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(data.password);

      const commentId = data.comment_id || nanoid(10);
      const status = filterResult.flagged ? 'flagged' : 'approved';

      if (data.comment_id) {
        // Update existing comment
        await this.dbService.updateComment(data.comment_id, {
          content: data.content,
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
          content: data.content,
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