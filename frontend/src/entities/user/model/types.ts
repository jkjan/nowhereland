export interface SignUpDTO {
    email: string,
    password: string,
    displayName: string
}

export interface SignUpResponse {
    email: string,
    status: string
}

export interface SignInDTO {
    email: string,
    password: string
}

export interface SignInResponse {
    user: any,
    session: any
}