import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ImageService } from "./services/image-service.ts";
import { validateImageFile } from "./validators/image-validator.ts";
import { ImageProcessorResponse } from "./types/image-types.ts";

const imageService = new ImageService();

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
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    // Validate file
    const validation = validateImageFile(imageFile);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          error: validation.error?.includes('exceeds maximum') ? "file_too_large" : "invalid_file_type",
          message: validation.error,
          details: validation.details
        }),
        { 
          status: validation.error?.includes('exceeds maximum') ? 413 : 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Process image
    const result = await imageService.processImage(imageFile);

    const response: ImageProcessorResponse = {
      hash: result.hash,
      webp_url: result.webp_url,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in image-processor:", error);
    return new Response(
      JSON.stringify({
        error: "processing_failed",
        message: "Image processing failed. Please try again.",
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});