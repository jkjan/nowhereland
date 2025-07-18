import { redirect } from "next/navigation";
import AdminLayout from "@/widgets/admin-layout/AdminLayout";
import { createClient } from "@/shared/lib/supabase/server";

export default async function AdminPage() {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        redirect("/admin/signin");
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
        .from('user')
        .select('is_admin')
        .eq('auth_user_id', user.id)
        .single();
    
    if (userError || !userData?.is_admin) {
        redirect("/admin/signin");
    }
    
    return <AdminLayout />;
}