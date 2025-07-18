import { createClient } from "jsr:@supabase/supabase-js@2";

export class DatabaseService {
    private supabase;

    constructor() {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    async checkAdminExists(): Promise<boolean> {
        const { data, error } = await this.supabase.from("user").select().eq("is_admin", true);
        
        if (error) {
            console.error('Error checking admin exists:', error);
            throw error;
        }
        
        const adminCount = data?.length || 0;
        console.log('Admin check result:', { adminCount, data });

        return adminCount > 0;
    }
}