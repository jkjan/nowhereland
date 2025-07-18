import { createClient } from "@/shared/lib/supabase/client";
import { SignUpDTO } from "../model";

export async function getAdminExists() {
    // TODO: api call for user table, if is_admin=true exists
    const supabase = createClient();
    const adminExists = await supabase.functions.invoke("admin-exists",
        {
            method: "GET"
        })

    if (adminExists.error) throw Error;

    return adminExists.data.adminExists;
}

export async function signUp(signUpDto: SignUpDTO) {
    const { email, password } = signUpDto;

    console.log("asdf");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    // set cookie and redirect to pending page. user should be approved by admin. 

    if (error) throw error;
}