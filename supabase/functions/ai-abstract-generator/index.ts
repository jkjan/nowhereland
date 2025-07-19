import { corsHeaders } from "../_shared/cors.ts";

interface AbstractGeneratorRequest {
  title: string;
  content: string;
  target_length?: number;
  style?: 'academic' | 'casual' | 'technical' | 'blog';
  include_keywords?: string[];
}

interface AbstractGeneratorResponse {
  abstract: string;
  word_count: number;
  character_count: number;
  readability_score: number;
  keywords_included: string[];
  processing_time: number;
  model_used: string;
  cost_estimate: number;
  alternative_versions: string[];
  warning?: string | null;
  error?: string | null;
}

function generateMockAbstract(title: string, content: string, targetLength: number = 150, style: string = 'blog', keywords: string[] = []): string {
  const sentences = [
    `This post explores ${title.toLowerCase()} and its implications.`,
    `A comprehensive guide covering the key concepts and practical applications.`,
    `Learn about best practices and common pitfalls to avoid.`,
    `Discover insights gained from real-world experience and case studies.`,
    `Essential knowledge for developers and enthusiasts alike.`,
    `An in-depth analysis of current trends and future possibilities.`,
    `Practical tips and techniques you can apply immediately.`,
    `Everything you need to know to get started effectively.`
  ];

  // Select sentences based on style
  let selectedSentences: string[] = [];
  
  if (style === 'academic') {
    selectedSentences = [
      `This ${title.toLowerCase()} presents a systematic examination of key concepts and methodologies.`,
      `The analysis reveals significant insights into practical applications and theoretical frameworks.`,
      `Findings demonstrate the importance of best practices in implementation strategies.`
    ];
  } else if (style === 'technical') {
    selectedSentences = [
      `Technical implementation of ${title.toLowerCase()} requires understanding of core principles.`,
      `This guide covers architecture patterns, performance considerations, and optimization techniques.`,
      `Code examples and real-world scenarios illustrate practical applications.`
    ];
  } else if (style === 'casual') {
    selectedSentences = [
      `Let me share what I've learned about ${title.toLowerCase()} recently.`,
      `Here are some practical tips and thoughts from my experience.`,
      `Hope you find these insights helpful for your own projects!`
    ];
  } else {
    // Blog style (default)
    selectedSentences = sentences.slice(0, 3);
  }

  // Include keywords naturally
  if (keywords.length > 0) {
    const keywordPhrase = keywords.slice(0, 2).join(' and ');
    selectedSentences.push(`Special focus on ${keywordPhrase} throughout the discussion.`);
  }

  let abstract = selectedSentences.join(' ');
  
  // Adjust length to target
  if (abstract.length > targetLength) {
    abstract = abstract.substring(0, targetLength - 3) + '...';
  } else if (abstract.length < targetLength - 50) {
    abstract += ' Additional insights and detailed explanations provide comprehensive coverage of the topic.';
  }

  return abstract;
}

function calculateReadabilityScore(text: string): number {
  // Simple Flesch Reading Ease approximation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const syllables = text.split(/[aeiouAEIOU]/).length - 1; // Very rough syllable count
  
  if (sentences === 0 || words === 0) return 0;
  
  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;
  
  // Flesch Reading Ease formula approximation
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
}

function generateAlternativeVersions(original: string): string[] {
  const alternatives: string[] = [];
  
  // Shorter version
  const sentences = original.split('. ');
  if (sentences.length > 1) {
    alternatives.push(sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.');
  }
  
  // Different opening
  const alt1 = original.replace(/^[^.]*\./, 'Explore the essential concepts and practical applications in this comprehensive guide.');
  if (alt1 !== original) {
    alternatives.push(alt1);
  }
  
  return alternatives.slice(0, 2); // Return max 2 alternatives
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
    const data: AbstractGeneratorRequest = await req.json();

    // Validate input
    if (!data.title || !data.content) {
      return new Response(
        JSON.stringify({
          error: "content_too_short",
          message: "Title and content are required",
          details: {
            min_content_length: 100,
            max_content_length: 50000,
            target_length_range: {
              min: 50,
              max: 500
            }
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.content.length < 100) {
      return new Response(
        JSON.stringify({
          error: "content_too_short",
          message: "Content must be at least 100 characters long for abstract generation",
          details: {
            min_content_length: 100,
            max_content_length: 50000,
            target_length_range: {
              min: 50,
              max: 500
            }
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simulate AI processing time (800ms - 2500ms)
    const processingDelay = 800 + Math.random() * 1700;
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    const targetLength = data.target_length || 150;
    const style = data.style || 'blog';
    const keywords = data.include_keywords || [];

    // Generate mock abstract
    const abstract = generateMockAbstract(data.title, data.content, targetLength, style, keywords);
    const wordCount = abstract.split(/\s+/).filter(w => w.length > 0).length;
    const characterCount = abstract.length;
    const readabilityScore = calculateReadabilityScore(abstract);
    const keywordsIncluded = keywords.filter(keyword => 
      abstract.toLowerCase().includes(keyword.toLowerCase())
    );
    const alternativeVersions = generateAlternativeVersions(abstract);
    const processingTime = Date.now() - startTime;

    const response: AbstractGeneratorResponse = {
      abstract,
      word_count: wordCount,
      character_count: characterCount,
      readability_score: readabilityScore,
      keywords_included: keywordsIncluded,
      processing_time: processingTime,
      model_used: "mock-abstract-generator-v1",
      cost_estimate: 0.0002, // Mock cost
      alternative_versions: alternativeVersions,
      warning: null,
      error: null
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in ai-abstract-generator:", error);
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