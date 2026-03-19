import { http } from "./http";

export type AdminUser = {
    user_id: number;
    username: string;
    email: string;
    role: string;
    created_at: string;
    wins: number;
    losses: number;
};

type AdminUsersResponse = {
    users: AdminUser[];
};

export async function getAdminUsersRequest() {
    const response = await http.get<AdminUsersResponse>("/admin");
    return response.data.users;
}
