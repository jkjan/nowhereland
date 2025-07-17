export interface SignUpDTO {
    email: string,
    username: string,
    password: string
}

export interface SignUpResponse {
    email: string,
    status: string
}