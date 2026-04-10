export type AuthResponse = {
    message: string;
    user_id: number;
    token: string;
};

export type LoginRequest = {
    // Вместо email'а будет вводиться id в телеграме
    email: string;
    password: string;
};

export type RegisterRequest = {
    username: string;
    // Вместо email'а будет вводиться id в телеграме
    email: string;
    password: string;
};

export type AuthUser = {
    user_id: number;
    username: string;
    // Вместо email'а будет вводиться id в телеграме
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

