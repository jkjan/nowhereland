import { corsHeaders } from "../_shared/cors.ts";
import { SearchService } from "./services/search-service.ts";
import { validateSearchRequest } from "./validators/search-validator.ts";
import { SearchRequest, SearchResponse } from "./types/search-types.ts";

const searchService = new SearchService();

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

  const startTime = performance.now();

  try {
    // Parse and validate request body
    const data: SearchRequest = await req.json();
    
    const validation = validateSearchRequest(data);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set defaults
    const searchParams: SearchRequest = {
      query: data.query,
      tags: data.tags || [],
      limit: data.limit || 10,
      offset: data.offset || 0,
      sort: data.sort || 'relevance',
      include_draft: data.include_draft || false
    };

    // Perform search
    const searchResult = await searchService.performSearch(searchParams);

    // Track search history (async, don't wait)
    searchService.trackSearch(searchParams, searchResult.total, req).catch(error => {
      console.error('Failed to track search:', error);
    });

    const took = Math.round(performance.now() - startTime);

    // Build response
    const response: SearchResponse = {
      results: searchResult.results,
      pagination: {
        total: searchResult.total,
        limit: searchParams.limit,
        offset: searchParams.offset,
        has_more: searchParams.offset + searchParams.limit < searchResult.total
      },
      query_info: {
        query: searchParams.query,
        tags: searchParams.tags,
        took,
        engine: searchResult.engine,
        suggestions: [] // TODO: Add search suggestions for empty results
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in search-handler:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});