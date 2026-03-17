import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loginRequest, registerRequest, meRequest } from "../api/auth";
import type { AuthUser, LoginRequest, RegisterRequest } from "../api/types";

const TOKEN_STORAGE_KEY = "compairy_jwt";

type AuthContextValue = {
    isAuthenticated: boolean;
    user: AuthUser | null;
    login: (payload: LoginRequest) => Promise<void>;
    register: (payload: RegisterRequest) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (!storedToken) {
            setIsLoading(false);
            return;
        }

        setToken(storedToken);
        fetchUserProfile().finally(() => setIsLoading(false));
    }, []);

    const fetchUserProfile = async () => {
        try {
            const userData = await meRequest();
            setUser(userData);
        } catch {
            // If fetch fails (401 or other error), clear auth
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            setToken(null);
            setUser(null);
        }
    };

    const login = async (payload: LoginRequest) => {
        const data = await loginRequest(payload);

        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);

        const userData = await meRequest();
        setUser(userData);
    };

    const register = async (payload: RegisterRequest) => {
        const data = await registerRequest(payload);

        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);

        const userData = await meRequest();
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
    };

    const value = useMemo<AuthContextValue>(
        () => ({
            isAuthenticated: Boolean(token && user),
            user,
            login,
            register,
            logout,
            isLoading,
        }),
        [token, user, isLoading],
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
