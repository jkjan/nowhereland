import { corsHeaders } from "../_shared/cors.ts";
import { CommentFilterService } from "./services/comment-filter-service.ts";
import { RateLimitService } from "./services/rate-limit-service.ts";
import { validateCommentRequest } from "./validators/comment-validator.ts";
import { CommentFilterRequest } from "./validators/comment-validator.ts";

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
    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || 
                    req.headers.get("x-real-ip") || 
                    req.headers.get("cf-connecting-ip") || 
                    "unknown";
    
    if (!RateLimitService.checkRateLimit(clientIP)) {
      const resetTime = RateLimitService.getResetTime(clientIP);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded", 
          message: "Too many comments submitted. Please try again later.",
          resetTime
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toString()
          } 
        }
      );
    }

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
    
    // Add rate limit headers to successful response
    const remaining = RateLimitService.getRemainingRequests(clientIP);
    const resetTime = RateLimitService.getResetTime(clientIP);
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": resetTime.toString()
      }
    });

  } catch (error) {
    console.error("Error in comment-filter:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});