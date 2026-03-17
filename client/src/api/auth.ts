import { http } from "./http";
import type { AuthResponse, LoginRequest, RegisterRequest } from "./types";

export async function loginRequest(payload: LoginRequest) {
    const response = await http.post<AuthResponse>("/auth/login", payload);
    return response.data;
}

export async function registerRequest(payload: RegisterRequest) {
    const response = await http.post<AuthResponse>("/auth/register", payload);
    return response.data;
}
