import { corsHeaders } from "../_shared/cors.ts";
import { CdnService } from "./services/cdn-service.ts";
import { validateImageCdnRequest, parseImageCdnParams } from "./validators/cdn-validator.ts";

const cdnService = new CdnService();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Extract hash from URL path: /functions/v1/image-cdn/{hash}
    const hash = pathSegments[pathSegments.length - 1];
    
    if (!hash) {
      return new Response(
        JSON.stringify({ error: "Image hash is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate request parameters
    const validation = validateImageCdnRequest(hash, url.searchParams);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid parameters", 
          details: validation.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse parameters
    const { width } = parseImageCdnParams(url.searchParams);

    // Process image request
    const imageBuffer = await cdnService.processImageRequest(hash, width);

    // Set cache headers
    const cacheHeaders = {
      ...corsHeaders,
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable", // 1 year cache
      "ETag": `"${hash}-${width || 'main'}"`,
      "Vary": "Accept-Encoding"
    };

    return new Response(imageBuffer, {
      status: 200,
      headers: cacheHeaders
    });

  } catch (error) {
    console.error("Error in image-cdn:", error);
    
    if (error.message === 'Image not found') {
      return new Response(
        JSON.stringify({ 
          error: "Image not found",
          message: "The requested image does not exist"
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Image processing failed",
        message: "Unable to process image. Please try again later.",
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});