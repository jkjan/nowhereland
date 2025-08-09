import { createClient } from "jsr:@supabase/supabase-js@2";
import { FixedTag } from "../types/tag-types.ts";

export class TagService {
  private COMMON_TAGS = [
    'web development', 'javascript', 'typescript', 'react', 'nextjs',
    'nodejs', 'database', 'supabase', 'postgresql', 'api',
    'frontend', 'backend', 'fullstack', 'ui/ux', 'design',
    'tutorial', 'guide', 'tips', 'best practices', 'productivity',
    'software engineering', 'clean code', 'architecture', 'testing',
    'performance', 'security', 'deployment', 'ci/cd'
  ];

  async getFixedTags(): Promise<FixedTag[]> {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabaseClient
      .from('fixed_tag')
      .select('name, color')
      .eq('is_active', true)
      .eq('is_deleted', false);
      
    if (error) {
      console.error('Error fetching fixed tags:', error);
      return [];
    }
    
    return data || [];
  }

  async generateMockTags(title: string, content: string, maxTags: number = 5, includeFixed: boolean = true): Promise<string[]> {
    const tags: string[] = [];
    const combinedText = (title + ' ' + content).toLowerCase();
    
    // Add fixed tags based on content
    if (includeFixed) {
      const fixedTags = await this.getFixedTags();
      
      for (const fixedTag of fixedTags) {
        if (fixedTag.name === 'dev' && (combinedText.includes('dev') || combinedText.includes('code') || combinedText.includes('programming'))) {
          tags.push('dev');
        }
        if (fixedTag.name === 'beer' && (combinedText.includes('beer') || combinedText.includes('alcohol') || combinedText.includes('brewery'))) {
          tags.push('beer');
        }
        // Add other fixed tag matching logic as needed
      }
    }
    
    // Add common tags based on keywords
    for (const tag of this.COMMON_TAGS) {
      if (tags.length >= maxTags) break;
      
      const keywords = tag.split(' ');
      const hasKeyword = keywords.some(keyword => combinedText.includes(keyword));
      
      if (hasKeyword && !tags.includes(tag)) {
        tags.push(tag);
      }
    }
    
    // Fill remaining slots with random relevant tags
    while (tags.length < maxTags && tags.length < 8) {
      const randomTag = this.COMMON_TAGS[Math.floor(Math.random() * this.COMMON_TAGS.length)];
      if (!tags.includes(randomTag)) {
        tags.push(randomTag);
      }
    }
    
    return tags.slice(0, maxTags);
  }

  async generateConfidenceScores(tags: string[]): Promise<Record<string, number>> {
    const scores: Record<string, number> = {};
    const fixedTags = await this.getFixedTags();
    const fixedTagNames = fixedTags.map(tag => tag.name);
    
    tags.forEach((tag, index) => {
      // Fixed tags have higher confidence
      if (fixedTagNames.includes(tag)) {
        scores[tag] = 0.85 + Math.random() * 0.15; // 0.85-1.0
      } else {
        // Earlier tags have higher confidence
        const baseConfidence = 0.6 + (tags.length - index) * 0.05;
        scores[tag] = Math.min(baseConfidence + Math.random() * 0.2, 1.0);
      }
    });
    
    return scores;
  }
}