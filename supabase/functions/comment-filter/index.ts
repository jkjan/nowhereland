import { corsHeaders } from "../_shared/cors.ts";
import { CommentFilterService } from "./services/comment-filter-service.ts";
import { validateCommentRequest } from "./validators/comment-validator.ts";
import { CommentFilterRequest } from "./types/comment-types.ts";

const commentFilterService = new CommentFilterService();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST method
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let data: CommentFilterRequest;
    try {
      data = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const validation = validateCommentRequest(data);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await commentFilterService.processComment(data);
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in comment-filter:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});