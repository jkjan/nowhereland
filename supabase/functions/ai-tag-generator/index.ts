import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface TagGeneratorRequest {
  title: string;
  content: string;
  existing_tags?: string[];
  max_tags?: number;
  include_fixed_tags?: boolean;
}

interface TagGeneratorResponse {
  tags: string[];
  confidence_scores: Record<string, number>;
  processing_time: number;
  model_used: string;
  cost_estimate: number;
  warning?: string | null;
  error?: string | null;
}

interface FixedTag {
  name: string;
  color: string;
}
const COMMON_TAGS = [
  'web development', 'javascript', 'typescript', 'react', 'nextjs',
  'nodejs', 'database', 'supabase', 'postgresql', 'api',
  'frontend', 'backend', 'fullstack', 'ui/ux', 'design',
  'tutorial', 'guide', 'tips', 'best practices', 'productivity',
  'software engineering', 'clean code', 'architecture', 'testing',
  'performance', 'security', 'deployment', 'ci/cd'
];

async function getFixedTags(): Promise<FixedTag[]> {
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

async function generateMockTags(title: string, content: string, maxTags: number = 5, includeFixed: boolean = true): Promise<string[]> {
  const tags: string[] = [];
  const combinedText = (title + ' ' + content).toLowerCase();
  
  // Add fixed tags based on content
  if (includeFixed) {
    const fixedTags = await getFixedTags();
    
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
  for (const tag of COMMON_TAGS) {
    if (tags.length >= maxTags) break;
    
    const keywords = tag.split(' ');
    const hasKeyword = keywords.some(keyword => combinedText.includes(keyword));
    
    if (hasKeyword && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  // Fill remaining slots with random relevant tags
  while (tags.length < maxTags && tags.length < 8) {
    const randomTag = COMMON_TAGS[Math.floor(Math.random() * COMMON_TAGS.length)];
    if (!tags.includes(randomTag)) {
      tags.push(randomTag);
    }
  }
  
  return tags.slice(0, maxTags);
}

async function generateConfidenceScores(tags: string[]): Promise<Record<string, number>> {
  const scores: Record<string, number> = {};
  const fixedTags = await getFixedTags();
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check authentication (admin only)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const startTime = Date.now();
    const data: TagGeneratorRequest = await req.json();

    // Validate input
    if (!data.title || !data.content) {
      return new Response(
        JSON.stringify({
          error: "content_too_short",
          message: "Title and content are required",
          details: {
            min_content_length: 10,
            max_content_length: 50000
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.content.length < 50) {
      return new Response(
        JSON.stringify({
          error: "content_too_short",
          message: "Content must be at least 50 characters long",
          details: {
            min_content_length: 50,
            max_content_length: 50000
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simulate AI processing time (500ms - 2000ms)
    const processingDelay = 500 + Math.random() * 1500;
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    const maxTags = data.max_tags || 5;
    const includeFixed = data.include_fixed_tags !== false;

    // Generate mock tags
    const tags = await generateMockTags(data.title, data.content, maxTags, includeFixed);
    const confidenceScores = await generateConfidenceScores(tags);
    const processingTime = Date.now() - startTime;

    const response: TagGeneratorResponse = {
      tags,
      confidence_scores: confidenceScores,
      processing_time: processingTime,
      model_used: "mock-tag-generator-v1",
      cost_estimate: 0.0001, // Mock cost
      warning: null,
      error: null
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in ai-tag-generator:", error);
    return new Response(
      JSON.stringify({
        error: "ai_service_unavailable",
        message: "AI service is temporarily unavailable. Please try again later.",
        fallback_available: true
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});