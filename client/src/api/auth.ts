import { http } from "./http";
import type { AuthResponse, LoginRequest, RegisterRequest, MeResponse } from "./types";

export async function loginRequest(payload: LoginRequest) {
    const response = await http.post<AuthResponse>("/auth/login", payload);
    return response.data;
}

export async function registerRequest(payload: RegisterRequest) {
    const response = await http.post<AuthResponse>("/auth/register", payload);
    return response.data;
}

export async function meRequest() {
    const response = await http.get<MeResponse>("/auth/me");
    return response.data.user;
}
