import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loginRequest, registerRequest } from "../api/auth";
import type { AuthUser, LoginRequest, RegisterRequest } from "../api/types";

const TOKEN_STORAGE_KEY = "compairy_jwt";

type AuthContextValue = {
    isAuthenticated: boolean;
    user: AuthUser | null;
    login: (payload: LoginRequest) => Promise<void>;
    register: (payload: RegisterRequest) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJwtPayload(token: string): { user_id?: number; role?: number } | null {
    try {
        const parts = token.split(".");

        if (parts.length < 2) {
            return null;
        }

        const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
        const decoded = atob(padded);
        return JSON.parse(decoded) as { user_id?: number; role?: number };
    } catch {
        return null;
    }
}

function mapUserFromToken(token: string, fallbackUserId?: number): AuthUser {
    const payload = decodeJwtPayload(token);

    return {
        user_id: payload?.user_id ?? fallbackUserId ?? 0,
        role: payload?.role,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (!storedToken) {
            return;
        }

        setToken(storedToken);
        setUser(mapUserFromToken(storedToken));
    }, []);

    const login = async (payload: LoginRequest) => {
        const data = await loginRequest(payload);

        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);
        setUser(mapUserFromToken(data.token, data.user_id));
    };

    const register = async (payload: RegisterRequest) => {
        const data = await registerRequest(payload);

        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);
        setUser(mapUserFromToken(data.token, data.user_id));
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
    };

    const value = useMemo<AuthContextValue>(
        () => ({
            isAuthenticated: Boolean(token),
            user,
            login,
            register,
            logout,
        }),
        [token, user],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
}
