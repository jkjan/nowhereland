import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { TagService } from "./services/tag-service.ts";
import { validateTagRequest } from "./validators/tag-validator.ts";
import { TagGeneratorRequest, TagGeneratorResponse } from "./types/tag-types.ts";

const tagService = new TagService();

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
    const data: TagGeneratorRequest = await req.json();

    // Validate input
    const validation = validateTagRequest(data);
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

    // Simulate AI processing time (500ms - 2000ms)
    const processingDelay = 500 + Math.random() * 1500;
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    const maxTags = data.max_tags || 5;
    const includeFixed = data.include_fixed_tags !== false;

    // Generate mock tags
    const tags = await tagService.generateMockTags(data.title, data.content, maxTags, includeFixed);
    const confidenceScores = await tagService.generateConfidenceScores(tags);
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