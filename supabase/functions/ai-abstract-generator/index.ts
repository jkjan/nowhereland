import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { AbstractService } from "./services/abstract-service.ts";
import { validateAbstractRequest } from "./validators/abstract-validator.ts";
import { AbstractGeneratorRequest, AbstractGeneratorResponse } from "./types/abstract-types.ts";

const abstractService = new AbstractService();

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

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: userData } = await supabaseClient.auth.getUser(token);
  if (!userData?.user) {
    return new Response(
      JSON.stringify({ error: "Invalid authentication" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if user is admin from JWT metadata
  const userMetadata = userData.user.app_metadata || {};
  const isAdmin = userMetadata.is_admin === true;

  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const startTime = Date.now();
    const data: AbstractGeneratorRequest = await req.json();

    // Validate input
    const validation = validateAbstractRequest(data);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          error: "content_too_short",
          message: validation.error,
          details: validation.details
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
    const abstract = abstractService.generateMockAbstract(data.title, data.content, targetLength, style, keywords);
    const wordCount = abstract.split(/\s+/).filter(w => w.length > 0).length;
    const characterCount = abstract.length;
    const readabilityScore = abstractService.calculateReadabilityScore(abstract);
    const keywordsIncluded = keywords.filter(keyword => 
      abstract.toLowerCase().includes(keyword.toLowerCase())
    );
    const alternativeVersions = abstractService.generateAlternativeVersions(abstract);
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