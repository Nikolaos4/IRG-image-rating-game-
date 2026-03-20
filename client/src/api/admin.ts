import { http } from "./http";

export type AdminUser = {
    user_id: number;
    username: string;
    email: string;
    role: string;
    created_at: string;
    wins: number;
    losses: number;
    is_blocked: boolean;
    ban_reason: string | null;
    banned_at: string | null;
};

export type UpdateAdminUserRequest = {
    username?: string;
    role?: "user" | "admin";
};

type AdminUsersResponse = {
    users: AdminUser[];
};

export async function getAdminUsersRequest() {
    const response = await http.get<AdminUsersResponse>("/admin");
    return response.data.users;
}

export async function blockUserRequest(userId: number) {
    const response = await http.post<{ message: string }>(`/admin/${userId}/ban`);
    return response.data;
}

export async function unblockUserRequest(userId: number) {
    const response = await http.delete<{ message: string }>(`/admin/${userId}/ban`);
    return response.data;
}

export async function updateAdminUserRequest(userId: number, payload: UpdateAdminUserRequest) {
    const response = await http.patch<{ message: string }>(`/admin/${userId}`, payload);
    return response.data;
}
