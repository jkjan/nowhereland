import { SignUpDTO } from "../model";
import { SignUpResponse } from "../model/types";


export async function getAdminExists() {
    // TODO: api call for user table, if is_admin=true exists
    return false;
}

export function signUp(signUpDto: SignUpDTO): SignUpResponse {
    return {
        email: signUpDto.email,
        status: "pending"
    }
}