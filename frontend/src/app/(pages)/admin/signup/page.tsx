import { getAdminExists } from "@/entities/user/api";
import SignUpLayout from "@/widgets/signup-layout/SignUpLayout";
import { forbidden } from "next/navigation";

export default async function SignUpPage() {
    try {
        const adminExists = await getAdminExists()
        console.log(adminExists)
        if (adminExists) {
            forbidden();
        } else {
            return <SignUpLayout/>;
        }
    } catch {
        
    }
}
