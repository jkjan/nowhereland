import { getAdminExists } from "@/entities/user/api";
import SignInLayout from "@/widgets/signin-layout/SignInLayout";
import { redirect } from "next/navigation";

export default async function SignInPage() {
    try {
        const adminExists = await getAdminExists();
        
        if (!adminExists) {
            redirect("/admin/signup");
        } else {
            return <SignInLayout/>;
        }
    } catch (error) {
        console.error('Error checking admin exists:', error);
        return <SignInLayout/>;
    }
}