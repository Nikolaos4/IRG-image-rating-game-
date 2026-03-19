import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import "./assets/scss/app.scss";
import IndexPage from "./pages/IndexPage/IndexPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Header from "./components/Header/Header";
import ThemesPage from "./pages/ThemesPage/ThemesPage";
import GamePage from "./pages/GamePage/GamePage";
import RatingPage from "./pages/RatingPage/RatingPage";
import { useAuth } from "./contexts/AuthContext";

function GuestOnlyRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    if (isAuthenticated) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return children;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return children;
}

function App() {
    return (
        <>
            <Header />
            <Routes>
                <Route
                    path="/"
                    element={<IndexPage />}
                />
                <Route
                    path="/themes"
                    element={
                        <ProtectedRoute>
                            <ThemesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/game/:id"
                    element={
                        <ProtectedRoute>
                            <GamePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/rating"
                    element={
                        <ProtectedRoute>
                            <RatingPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <GuestOnlyRoute>
                            <LoginPage />
                        </GuestOnlyRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <GuestOnlyRoute>
                            <RegisterPage />
                        </GuestOnlyRoute>
                    }
                />
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />
            </Routes>
        </>
    );
}

export default App;
