import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface Reference {
  text: string;
  url?: string;
  sequence_number: number;
  start_position: number;
  end_position: number;
}

interface TocEntry {
  level: number;
  title: string;
  anchor: string;
  position_in_content: number;
}

interface PostManagerRequest {
  post_id?: string; // For updates
  title: string;
  content: string;
  abstract?: string;
  thumbnail_hash?: string;
  status?: "draft" | "published" | "archived";
  references?: Reference[];
  fixed_tag_ids?: string[];
  generated_tags?: { name: string; confidence_score: number }[];
}

interface PostManagerResponse {
  post_id: string;
  indexed: boolean;
  references_created: number;
  toc_entries_created: number;
  fixed_tags_linked: number;
  generated_tags_created: number;
}

class TocGenerator {
  static generate(content: string): TocEntry[] {
    const tocEntries: TocEntry[] = [];
    const lines = content.split('\n');
    let position = 0;
    
    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const anchor = this.generateAnchor(title);
        
        tocEntries.push({
          level,
          title,
          anchor,
          position_in_content: position
        });
      }
      position += line.length + 1; // +1 for newline
    }
    
    return tocEntries;
  }
  
  private static generateAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

class SearchIndexer {
  private opensearchEndpoint: string;
  private opensearchUsername: string;
  private opensearchPassword: string;
  
  constructor() {
    this.opensearchEndpoint = Deno.env.get('OPENSEARCH_ENDPOINT') || '';
    this.opensearchUsername = Deno.env.get('OPENSEARCH_USERNAME') || '';
    this.opensearchPassword = Deno.env.get('OPENSEARCH_PASSWORD') || '';
  }
  
  async indexPost(postData: {
    id: string;
    title: string;
    content: string;
    abstract?: string;
    tags: string[];
    published_at?: string;
    status: string;
  }): Promise<boolean> {
    if (!this.opensearchEndpoint) {
      console.warn('OpenSearch not configured, skipping indexing');
      return false;
    }
    
    try {
      const searchDoc = {
        id: postData.id,
        title: postData.title,
        content: postData.content,
        abstract: postData.abstract || '',
        tags: postData.tags,
        published_at: postData.published_at,
        status: postData.status,
        indexed_at: new Date().toISOString()
      };
      
      const auth = btoa(`${this.opensearchUsername}:${this.opensearchPassword}`);
      const response = await fetch(`${this.opensearchEndpoint}/posts/_doc/${postData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchDoc)
      });
      
      if (!response.ok) {
        console.error('OpenSearch indexing failed:', await response.text());
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('OpenSearch indexing error:', error);
      return false;
    }
  }
  
  async deletePost(postId: string): Promise<boolean> {
    if (!this.opensearchEndpoint) {
      return false;
    }
    
    try {
      const auth = btoa(`${this.opensearchUsername}:${this.opensearchPassword}`);
      const response = await fetch(`${this.opensearchEndpoint}/posts/_doc/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('OpenSearch delete error:', error);
      return false;
    }
  }
}

class PostManager {
  private supabase: any;
  private searchIndexer: SearchIndexer;
  
  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
    this.searchIndexer = new SearchIndexer();
  }
  
  async createPost(data: PostManagerRequest): Promise<PostManagerResponse> {
    // Generate UUIDv7 for post ID
    const postId = crypto.randomUUID();
    const tocEntries = TocGenerator.generate(data.content);
    
    // For testing, use the test user
    let userId = 'test-user-001';
    
    // In production, get user from auth
    try {
      const { data: userData } = await this.supabase.auth.getUser();
      if (userData?.user) {
        const { data: userRecord } = await this.supabase
          .from('user')
          .select('id')
          .eq('auth_user_id', userData.user.id)
          .single();
        
        if (userRecord) {
          userId = userRecord.id;
        }
      }
    } catch (error) {
      console.log('Using test user for development');
    }
    
    try {
      // 1. Insert post
      const { error: postError } = await this.supabase
        .from('post')
        .insert({
          id: postId,
          user_id: userId,
          title: data.title,
          content: data.content,
          abstract: data.abstract,
          thumbnail_hash: data.thumbnail_hash,
          status: data.status || 'draft',
          published_at: data.status === 'published' ? new Date().toISOString() : null
        });
      
      if (postError) throw postError;
      
      // 2. Insert TOC entries
      let tocCreated = 0;
      if (tocEntries.length > 0) {
        const tocData = tocEntries.map(entry => ({
          id: crypto.randomUUID(),
          post_id: postId,
          ...entry
        }));
        
        const { error: tocError } = await this.supabase
          .from('toc_entry')
          .insert(tocData);
        
        if (tocError) throw tocError;
        tocCreated = tocData.length;
      }
      
      // 3. Insert references
      let referencesCreated = 0;
      if (data.references && data.references.length > 0) {
        const referenceData = data.references.map(ref => ({
          id: crypto.randomUUID(),
          post_id: postId,
          ...ref
        }));
        
        const { error: refError } = await this.supabase
          .from('reference')
          .insert(referenceData);
        
        if (refError) throw refError;
        referencesCreated = referenceData.length;
      }
      
      // 4. Link fixed tags
      let fixedTagsLinked = 0;
      if (data.fixed_tag_ids && data.fixed_tag_ids.length > 0) {
        const fixedTagData = data.fixed_tag_ids.map(tagId => ({
          id: crypto.randomUUID(),
          post_id: postId,
          fixed_tag_id: tagId
        }));
        
        const { error: fixedTagError } = await this.supabase
          .from('post_fixed_tag')
          .insert(fixedTagData);
        
        if (fixedTagError) throw fixedTagError;
        fixedTagsLinked = fixedTagData.length;
      }
      
      // 5. Create and link generated tags
      let generatedTagsCreated = 0;
      if (data.generated_tags && data.generated_tags.length > 0) {
        for (const genTag of data.generated_tags) {
          // Create generated tag
          const generatedTagId = crypto.randomUUID();
          const { error: genTagError } = await this.supabase
            .from('generated_tag')
            .insert({
              id: generatedTagId,
              name: genTag.name,
              confidence_score: genTag.confidence_score
            });
          
          if (genTagError) throw genTagError;
          
          // Link to post
          const { error: linkError } = await this.supabase
            .from('post_generated_tag')
            .insert({
              id: crypto.randomUUID(),
              post_id: postId,
              generated_tag_id: generatedTagId
            });
          
          if (linkError) throw linkError;
          generatedTagsCreated++;
        }
      }
      
      // 6. Index for search
      const allTags = await this.getAllTags(postId);
      const indexed = await this.searchIndexer.indexPost({
        id: postId,
        title: data.title,
        content: data.content,
        abstract: data.abstract,
        tags: allTags,
        published_at: data.status === 'published' ? new Date().toISOString() : undefined,
        status: data.status || 'draft'
      });
      
      return {
        post_id: postId,
        indexed,
        references_created: referencesCreated,
        toc_entries_created: tocCreated,
        fixed_tags_linked: fixedTagsLinked,
        generated_tags_created: generatedTagsCreated
      };
      
    } catch (error) {
      // Cleanup on failure
      await this.cleanupFailedPost(postId);
      throw error;
    }
  }
  
  async updatePost(data: PostManagerRequest): Promise<PostManagerResponse> {
    if (!data.post_id) {
      throw new Error('Post ID required for update');
    }
    
    const tocEntries = TocGenerator.generate(data.content);
    
    try {
      // 1. Update post
      const { error: postError } = await this.supabase
        .from('post')
        .update({
          title: data.title,
          content: data.content,
          abstract: data.abstract,
          thumbnail_hash: data.thumbnail_hash,
          status: data.status,
          published_at: data.status === 'published' ? new Date().toISOString() : null
        })
        .eq('id', data.post_id);
      
      if (postError) throw postError;
      
      // 2. Delete and recreate TOC entries
      await this.supabase
        .from('toc_entry')
        .delete()
        .eq('post_id', data.post_id);
      
      let tocCreated = 0;
      if (tocEntries.length > 0) {
        const tocData = tocEntries.map(entry => ({
          id: crypto.randomUUID(),
          post_id: data.post_id,
          ...entry
        }));
        
        const { error: tocError } = await this.supabase
          .from('toc_entry')
          .insert(tocData);
        
        if (tocError) throw tocError;
        tocCreated = tocData.length;
      }
      
      // 3. Delete and recreate references
      await this.supabase
        .from('reference')
        .delete()
        .eq('post_id', data.post_id);
      
      let referencesCreated = 0;
      if (data.references && data.references.length > 0) {
        const referenceData = data.references.map(ref => ({
          id: crypto.randomUUID(),
          post_id: data.post_id,
          ...ref
        }));
        
        const { error: refError } = await this.supabase
          .from('reference')
          .insert(referenceData);
        
        if (refError) throw refError;
        referencesCreated = referenceData.length;
      }
      
      // 4. Update fixed tag relationships
      await this.supabase
        .from('post_fixed_tag')
        .delete()
        .eq('post_id', data.post_id);
      
      let fixedTagsLinked = 0;
      if (data.fixed_tag_ids && data.fixed_tag_ids.length > 0) {
        const fixedTagData = data.fixed_tag_ids.map(tagId => ({
          id: crypto.randomUUID(),
          post_id: data.post_id,
          fixed_tag_id: tagId
        }));
        
        const { error: fixedTagError } = await this.supabase
          .from('post_fixed_tag')
          .insert(fixedTagData);
        
        if (fixedTagError) throw fixedTagError;
        fixedTagsLinked = fixedTagData.length;
      }
      
      // 5. Update generated tags
      await this.supabase
        .from('post_generated_tag')
        .delete()
        .eq('post_id', data.post_id);
      
      let generatedTagsCreated = 0;
      if (data.generated_tags && data.generated_tags.length > 0) {
        for (const genTag of data.generated_tags) {
          const generatedTagId = crypto.randomUUID();
          const { error: genTagError } = await this.supabase
            .from('generated_tag')
            .insert({
              id: generatedTagId,
              name: genTag.name,
              confidence_score: genTag.confidence_score
            });
          
          if (genTagError) throw genTagError;
          
          const { error: linkError } = await this.supabase
            .from('post_generated_tag')
            .insert({
              id: crypto.randomUUID(),
              post_id: data.post_id,
              generated_tag_id: generatedTagId
            });
          
          if (linkError) throw linkError;
          generatedTagsCreated++;
        }
      }
      
      // 6. Re-index for search
      const allTags = await this.getAllTags(data.post_id);
      const indexed = await this.searchIndexer.indexPost({
        id: data.post_id,
        title: data.title,
        content: data.content,
        abstract: data.abstract,
        tags: allTags,
        published_at: data.status === 'published' ? new Date().toISOString() : undefined,
        status: data.status || 'draft'
      });
      
      return {
        post_id: data.post_id,
        indexed,
        references_created: referencesCreated,
        toc_entries_created: tocCreated,
        fixed_tags_linked: fixedTagsLinked,
        generated_tags_created: generatedTagsCreated
      };
      
    } catch (error) {
      throw error;
    }
  }
  
  private async getAllTags(postId: string): Promise<string[]> {
    const tags: string[] = [];
    
    // Get fixed tags
    const { data: fixedTags } = await this.supabase
      .from('post_fixed_tag')
      .select(`
        fixed_tag:fixed_tag_id (
          name
        )
      `)
      .eq('post_id', postId);
    
    if (fixedTags) {
      tags.push(...fixedTags.map((t: any) => t.fixed_tag.name));
    }
    
    // Get generated tags
    const { data: generatedTags } = await this.supabase
      .from('post_generated_tag')
      .select(`
        generated_tag:generated_tag_id (
          name
        )
      `)
      .eq('post_id', postId);
    
    if (generatedTags) {
      tags.push(...generatedTags.map((t: any) => t.generated_tag.name));
    }
    
    return tags;
  }
  
  private async cleanupFailedPost(postId: string): Promise<void> {
    try {
      await this.supabase.from('post_generated_tag').delete().eq('post_id', postId);
      await this.supabase.from('post_fixed_tag').delete().eq('post_id', postId);
      await this.supabase.from('reference').delete().eq('post_id', postId);
      await this.supabase.from('toc_entry').delete().eq('post_id', postId);
      await this.supabase.from('post').delete().eq('id', postId);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const postManager = new PostManager(supabaseClient);

    if (req.method === 'POST') {
      const data: PostManagerRequest = await req.json();
      const result = await postManager.createPost(data);
      
      return new Response(
        JSON.stringify(result),
        { 
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } 
    else if (req.method === 'PATCH') {
      const data: PostManagerRequest = await req.json();
      const result = await postManager.updatePost(data);
      
      return new Response(
        JSON.stringify(result),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } 
    else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Post manager error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});