export type AuthResponse = {
    message: string;
    user_id: number;
    token: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type RegisterRequest = {
    username: string;
    email: string;
    password: string;
};

export type AuthUser = {
    user_id: number;
    role?: number;
};
