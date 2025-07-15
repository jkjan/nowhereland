import { PostManagerRequest, PostManagerResponse } from "../types/post-types.ts";
import { DatabaseService } from "./database-service.ts";
import { TocService } from "./toc-service.ts";
import { SearchService } from "./search-service.ts";
import { nanoid } from "npm:nanoid";

export class PostService {
  private dbService = new DatabaseService();
  private tocService = new TocService();
  private searchService = new SearchService();

  async createPost(userId: string, data: PostManagerRequest): Promise<PostManagerResponse> {
    const postId = nanoid(10);
    const tocEntries = this.tocService.generateToc(data.content);

    try {
      // Create post in database
      await this.dbService.insertPost(postId, userId, data);
      
      // Create related data
      const referencesCreated = await this.dbService.insertReferences(postId, data.references || []);
      const tocEntriesCreated = await this.dbService.insertTocEntries(postId, tocEntries);
      await this.dbService.insertTags(postId, data.fixed_tags, data.generated_tags);

      // Index for search if published
      const indexed = await this.indexPostIfPublished(postId, data);

      return {
        post_id: postId,
        indexed,
        references_created: referencesCreated,
        toc_entries_created: tocEntriesCreated,
      };
    } catch (error) {
      console.error("Create post failed:", error);
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  async updatePost(data: PostManagerRequest & { post_id: string }): Promise<PostManagerResponse> {
    const tocEntries = data.content ? this.tocService.generateToc(data.content) : [];

    try {
      // Update post
      await this.dbService.updatePost(data.post_id, data);
      
      // Update related data
      const referencesUpdated = await this.dbService.updateReferences(data.post_id, data.references || []);
      const tocEntriesUpdated = data.content ? 
        await this.dbService.updateTocEntries(data.post_id, tocEntries) : 0;
      
      if (data.fixed_tags || data.generated_tags) {
        await this.dbService.updateTags(data.post_id, data.fixed_tags, data.generated_tags);
      }

      // Re-index for search if published
      const indexed = await this.indexPostIfPublished(data.post_id, data);

      return {
        post_id: data.post_id,
        updated: true,
        indexed,
        references_updated: referencesUpdated,
        toc_entries_updated: tocEntriesUpdated,
      };
    } catch (error) {
      console.error("Update post failed:", error);
      throw new Error(`Failed to update post: ${error.message}`);
    }
  }

  private async indexPostIfPublished(postId: string, data: PostManagerRequest): Promise<boolean> {
    if (data.status !== "published") return false;
    
    try {
      await this.searchService.indexPost({
        id: postId,
        title: data.title,
        content: data.content,
        abstract: data.abstract || "",
        tags: [
          ...(data.fixed_tags || []),
          ...(data.generated_tags?.map(t => t.name) || [])
        ],
        published_at: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("Search indexing failed:", error);
      return false;
    }
  }
}