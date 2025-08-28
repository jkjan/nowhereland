import { createClient } from "@/shared/lib/supabase/server";
import AdminLayout from "@/widgets/admin-layout/AdminLayout";

export default async function AdminPage() {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();
    const userMetadata = user?.app_metadata || {};

    return <AdminLayout userMetadata={userMetadata} />;
}