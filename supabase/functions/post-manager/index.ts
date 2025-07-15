import { corsHeaders } from "../_shared/cors.ts";
import { PostService } from "./services/post-service.ts";
import { validatePostRequest } from "./validators/post-validator.ts";
import { PostManagerRequest } from "./types/post-types.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const postService = new PostService();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Check for supported methods before parsing JSON
  if (!["POST", "PATCH"].includes(req.method)) {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check authentication
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: userData } = await supabaseClient.auth.getUser(token)
  if (!userData?.user) {
    return new Response(
      JSON.stringify({ error: "Invalid authentication" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const data: PostManagerRequest = await req.json();
    
    const validation = validatePostRequest(data, req.method);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const result = await postService.createPost(userData.user.id, data);
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (req.method === "PATCH") {
      const result = await postService.updatePost(userData.user.id, data as PostManagerRequest & { post_id: string });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // This should never be reached due to method check above
    throw new Error("Unexpected method reached handler");

  } catch (error) {
    console.error("Error in post-manager:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});