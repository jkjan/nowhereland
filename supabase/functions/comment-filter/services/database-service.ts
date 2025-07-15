import { createClient } from "jsr:@supabase/supabase-js@2";
import { FilterKeyword } from "../types/comment-types.ts";

export class DatabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async checkPostExists(postId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('post')
      .select('id')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      console.error("Error checking post existence:", error);
      return false;
    }

    return !!data;
  }

  async validateParentComment(parentCommentId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('comment')
      .select('id, parent_comment_id')
      .eq('id', parentCommentId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      console.error("Error validating parent comment:", error);
      return false;
    }

    // Check if parent comment exists and is not already a reply (1 depth limit)
    return !!data && !data.parent_comment_id;
  }

  async getFilterKeywords(): Promise<FilterKeyword[]> {
    const { data, error } = await this.supabase
      .from('filter_keyword')
      .select('id, keyword, is_case_sensitive, is_active')
      .eq('is_active', true);

    if (error) {
      console.error("Error fetching filter keywords:", error);
      return [];
    }

    return data || [];
  }

  async createComment(commentData: {
    id: string;
    post_id: string;
    parent_comment_id?: string;
    username: string;
    password_hash: string;
    content: string;
    status: string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('comment')
      .insert([{
        id: commentData.id,
        post_id: commentData.post_id,
        parent_comment_id: commentData.parent_comment_id,
        username: commentData.username,
        password_hash: commentData.password_hash,
        content: commentData.content,
        status: commentData.status,
        ip_address: commentData.ip_address,
        user_agent: commentData.user_agent,
        created_at: commentData.created_at
      }]);

    if (error) {
      console.error("Error creating comment:", error);
      throw new Error(`Failed to create comment: ${error.message}`);
    }
  }

  async updateComment(commentId: string, updates: {
    content: string;
    status: string;
    password_hash: string;
    updated_at: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('comment')
      .update(updates)
      .eq('id', commentId)
      .eq('is_deleted', false);

    if (error) {
      console.error("Error updating comment:", error);
      throw new Error(`Failed to update comment: ${error.message}`);
    }
  }

  async getCommentById(commentId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('comment')
      .select('*')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      console.error("Error fetching comment:", error);
      throw new Error(`Failed to fetch comment: ${error.message}`);
    }

    return data;
  }
}