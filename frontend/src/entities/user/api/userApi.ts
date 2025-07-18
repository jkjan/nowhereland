import { createClient } from "@/shared/lib/supabase/client";
import { SignUpDTO, SignInDTO } from "../model";

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
    const { email, password, displayName } = signUpDto;

    const supabase = createClient();

    // Check if admin already exists - only allow signup if no admin exists
    const adminExists = await getAdminExists();
    if (adminExists) {
        throw new Error("This blog already has an owner");
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName
            }
        }
    });

    if (error) throw error;
}

export async function signIn(signInDto: SignInDTO) {
    const { email, password } = signInDto;

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;

    // Check if user is admin
    if (data.user) {
        const { data: userData, error: userError } = await supabase
            .from('user')
            .select('is_admin')
            .eq('auth_user_id', data.user.id)
            .single();

        if (userError) throw userError;

        if (!userData?.is_admin) {
            throw new Error("Access denied: Only admin can login");
        }
    }

    return data;
}