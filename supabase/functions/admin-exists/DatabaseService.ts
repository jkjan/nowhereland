import { createClient } from "jsr:@supabase/supabase-js@2";

export class DatabaseService {
    private supabase;

    constructor() {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    async checkAdminExists(): Promise<boolean> {
        const adminUser = await this.supabase.from("user").select().eq("is_admin", true);
        const adminCount = adminUser.data.length
        console.log(adminUser);

        return adminCount > 0;
    }
}