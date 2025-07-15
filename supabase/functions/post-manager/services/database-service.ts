import { createClient } from "jsr:@supabase/supabase-js@2";
import { PostManagerRequest, ReferenceData, TocEntry, GeneratedTagData } from "../types/post-types.ts";
import { nanoid } from "npm:nanoid";
import { uuidv7 } from "npm:uuidv7";
import DOMPurify from "npm:isomorphic-dompurify";

export class DatabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  private sanitizeContent(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a', 'img'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });
  }

  async insertPost(postId: string, userId: string, data: PostManagerRequest): Promise<void> {
    const { error } = await this.supabase
      .from("post")
      .insert({
        id: postId,
        user_id: userId,
        title: data.title,
        content: this.sanitizeContent(data.content),
        abstract: data.abstract ? this.sanitizeContent(data.abstract) : data.abstract,
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
    if (data.content) updateData.content = this.sanitizeContent(data.content);
    if (data.abstract !== undefined) updateData.abstract = data.abstract ? this.sanitizeContent(data.abstract) : data.abstract;
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
      id: nanoid(10),
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
    if (references.length === 0) {
      // If no references, delete all existing ones
      await this.supabase
        .from("reference")
        .delete()
        .eq("post_id", postId);
      return 0;
    }

    const referencesToUpsert = references.map((ref) => ({
      id: nanoid(10),
      post_id: postId,
      text: ref.text,
      url: ref.url || null,
      sequence_number: ref.sequence_number,
      start_position: ref.start_position,
      end_position: ref.end_position,
    }));

    // Delete existing references first, then insert new ones
    // Note: True UPSERT would require unique constraints which we don't have for references
    await this.supabase
      .from("reference")
      .delete()
      .eq("post_id", postId);

    const { error } = await this.supabase
      .from("reference")
      .insert(referencesToUpsert);

    if (error) {
      throw new Error(`Failed to update references: ${error.message}`);
    }

    return referencesToUpsert.length;
  }

  async insertTocEntries(postId: string, tocEntries: TocEntry[]): Promise<number> {
    if (tocEntries.length === 0) return 0;

    const tocToInsert = tocEntries.map((toc) => ({
      id: nanoid(10),
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
    if (tocEntries.length === 0) {
      // If no TOC entries, delete all existing ones
      await this.supabase
        .from("toc_entry")
        .delete()
        .eq("post_id", postId);
      return 0;
    }

    const tocToUpsert = tocEntries.map((toc) => ({
      id: nanoid(10),
      post_id: postId,
      level: toc.level,
      title: toc.title,
      anchor: toc.anchor,
      position_in_content: toc.position_in_content,
    }));

    // Delete existing TOC entries first, then insert new ones
    await this.supabase
      .from("toc_entry")
      .delete()
      .eq("post_id", postId);

    const { error } = await this.supabase
      .from("toc_entry")
      .insert(tocToUpsert);

    if (error) {
      throw new Error(`Failed to update TOC entries: ${error.message}`);
    }

    return tocToUpsert.length;
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
      id: uuidv7(),
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
    // Get or create all tags in parallel
    const tagIds = await Promise.all(
      generatedTags.map(tag => this.getOrCreateGeneratedTag(tag))
    );
    
    // Insert all tag links in one batch
    const tagsToInsert = tagIds.map(tagId => ({
      id: uuidv7(),
      post_id: postId,
      generated_tag_id: tagId,
    }));

    const { error } = await this.supabase
      .from("post_generated_tag")
      .insert(tagsToInsert);

    if (error) {
      throw new Error(`Failed to link generated tags: ${error.message}`);
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
        id: uuidv7(),
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