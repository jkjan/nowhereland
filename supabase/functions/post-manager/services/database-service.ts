import { createClient } from "jsr:@supabase/supabase-js@2";
import { PostManagerRequest, ReferenceData, TocEntry, GeneratedTagData } from "../types/post-types.ts";

export class DatabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async insertPost(postId: string, data: PostManagerRequest): Promise<void> {
    const { error } = await this.supabase
      .from("post")
      .insert({
        id: postId,
        user_id: data.user_id || "admin",
        title: data.title,
        content: data.content,
        abstract: data.abstract,
        thumbnail_hash: data.thumbnail_hash,
        status: data.status || "draft",
        published_at: data.status === "published" ? new Date().toISOString() : null,
      });

    if (error) {
      throw new Error(`Failed to insert post: ${error.message}`);
    }
  }

  async updatePost(postId: string, data: PostManagerRequest): Promise<void> {
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.abstract !== undefined) updateData.abstract = data.abstract;
    if (data.thumbnail_hash !== undefined) updateData.thumbnail_hash = data.thumbnail_hash;
    if (data.status) {
      updateData.status = data.status;
      if (data.status === "published") {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { error } = await this.supabase
      .from("post")
      .update(updateData)
      .eq("id", postId);

    if (error) {
      throw new Error(`Failed to update post: ${error.message}`);
    }
  }

  async insertReferences(postId: string, references: ReferenceData[]): Promise<number> {
    if (references.length === 0) return 0;

    const referencesToInsert = references.map((ref) => ({
      id: crypto.randomUUID(),
      post_id: postId,
      text: ref.text,
      url: ref.url || null,
      sequence_number: ref.sequence_number,
      start_position: ref.start_position,
      end_position: ref.end_position,
    }));

    const { error } = await this.supabase
      .from("reference")
      .insert(referencesToInsert);

    if (error) {
      throw new Error(`Failed to insert references: ${error.message}`);
    }

    return referencesToInsert.length;
  }

  async updateReferences(postId: string, references: ReferenceData[]): Promise<number> {
    // Delete existing references
    await this.supabase
      .from("reference")
      .delete()
      .eq("post_id", postId);

    return await this.insertReferences(postId, references);
  }

  async insertTocEntries(postId: string, tocEntries: TocEntry[]): Promise<number> {
    if (tocEntries.length === 0) return 0;

    const tocToInsert = tocEntries.map((toc) => ({
      id: crypto.randomUUID(),
      post_id: postId,
      level: toc.level,
      title: toc.title,
      anchor: toc.anchor,
      position_in_content: toc.position_in_content,
    }));

    const { error } = await this.supabase
      .from("toc_entry")
      .insert(tocToInsert);

    if (error) {
      throw new Error(`Failed to insert TOC entries: ${error.message}`);
    }

    return tocToInsert.length;
  }

  async updateTocEntries(postId: string, tocEntries: TocEntry[]): Promise<number> {
    // Delete existing TOC entries
    await this.supabase
      .from("toc_entry")
      .delete()
      .eq("post_id", postId);

    return await this.insertTocEntries(postId, tocEntries);
  }

  async insertTags(postId: string, fixedTags?: string[], generatedTags?: GeneratedTagData[]): Promise<void> {
    if (fixedTags?.length) {
      await this.insertFixedTags(postId, fixedTags);
    }

    if (generatedTags?.length) {
      await this.insertGeneratedTags(postId, generatedTags);
    }
  }

  async updateTags(postId: string, fixedTags?: string[], generatedTags?: GeneratedTagData[]): Promise<void> {
    if (fixedTags) {
      await this.supabase.from("post_fixed_tag").delete().eq("post_id", postId);
      await this.insertFixedTags(postId, fixedTags);
    }

    if (generatedTags) {
      await this.supabase.from("post_generated_tag").delete().eq("post_id", postId);
      await this.insertGeneratedTags(postId, generatedTags);
    }
  }

  private async insertFixedTags(postId: string, fixedTags: string[]): Promise<void> {
    const fixedTagsToInsert = fixedTags.map((tagId) => ({
      id: crypto.randomUUID(),
      post_id: postId,
      fixed_tag_id: tagId,
    }));

    const { error } = await this.supabase
      .from("post_fixed_tag")
      .insert(fixedTagsToInsert);

    if (error) {
      throw new Error(`Failed to insert fixed tags: ${error.message}`);
    }
  }

  private async insertGeneratedTags(postId: string, generatedTags: GeneratedTagData[]): Promise<void> {
    for (const tag of generatedTags) {
      const tagId = await this.getOrCreateGeneratedTag(tag);
      
      const { error } = await this.supabase
        .from("post_generated_tag")
        .insert({
          id: crypto.randomUUID(),
          post_id: postId,
          generated_tag_id: tagId,
        });

      if (error) {
        throw new Error(`Failed to link generated tag: ${error.message}`);
      }
    }
  }

  private async getOrCreateGeneratedTag(tag: GeneratedTagData): Promise<string> {
    const { data: existingTag } = await this.supabase
      .from("generated_tag")
      .select("id")
      .eq("name", tag.name)
      .single();

    if (existingTag) {
      return existingTag.id;
    }

    const { data: newTag, error } = await this.supabase
      .from("generated_tag")
      .insert({
        id: crypto.randomUUID(),
        name: tag.name,
        confidence_score: tag.confidence_score || 0.8,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create generated tag: ${error.message}`);
    }

    return newTag.id;
  }
}