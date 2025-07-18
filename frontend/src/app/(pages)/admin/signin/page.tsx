import { getAdminExists } from "@/entities/user/api";
import SignInLayout from "@/widgets/signin-layout/SignInLayout";
import { redirect } from "next/navigation";

export default async function SignInPage() {
    const adminExists = await getAdminExists();
    
    if (!adminExists) {
        redirect("/admin/signup");
    } else {
        return <SignInLayout/>;
    }
}