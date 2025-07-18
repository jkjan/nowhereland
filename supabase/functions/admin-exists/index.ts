import { corsHeaders } from "../_shared/cors.ts";
import { DatabaseService } from "./DatabaseService.ts";

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

    const databaseService = new DatabaseService();
    const adminExists = await databaseService.checkAdminExists();

    return new Response(
        JSON.stringify({ adminExists }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
});