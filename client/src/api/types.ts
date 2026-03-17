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
    username: string;
    email: string;
    role: string;
    created_at: string;
    rating: {
        wins: number;
        losses: number;
    };
};

export type MeResponse = {
    user: AuthUser;
};
