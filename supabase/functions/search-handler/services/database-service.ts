import { createClient } from "jsr:@supabase/supabase-js@2";

export class DatabaseService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async getSiteSetting(key: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('site_setting')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        // Return null to use defaults if error occurs
        return null;
      }

      return data?.value || null;
    } catch (error) {
      // Return null to use defaults if error occurs
      return null;
    }
  }

  async trackSearchHistory(historyEntry: {
    search_term: string;
    result_count: number;
    search_type: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('search_history')
        .insert(historyEntry);

      if (error) {
        console.error('Failed to track search history:', error);
      }
    } catch (error) {
      // Don't fail the search if history tracking fails
      console.error('Failed to track search history:', error);
    }
  }

  getSupabaseClient() {
    return this.supabase;
  }
}