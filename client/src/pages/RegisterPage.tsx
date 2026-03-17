import { useState, type ChangeEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "@/assets/scss/auth.scss";

export default function RegisterPage() {
    const navigate = useNavigate();
    const { isAuthenticated, register } = useAuth();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (isAuthenticated) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    const handleSubmit = async (event: ChangeEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            await register({ username, email, password });
            navigate("/");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    (error.response?.data as { message?: string } | undefined)?.message ??
                        "Произошла ошибка при регистрации",
                );
            } else {
                setErrorMessage("Произошла ошибка при регистрации");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-layout">
            <section className="auth-card">
                <h1>Регистрация</h1>
                <form
                    onSubmit={handleSubmit}
                    className="auth-form">
                    <input
                        type="text"
                        autoComplete="username"
                        minLength={1}
                        value={username}
                        placeholder="Имя"
                        onChange={(event) => setUsername(event.target.value)}
                        required
                    />

                    <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        placeholder="Почта"
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    <input
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        value={password}
                        placeholder="Пароль"
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

                    {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

                    <button
                        type="submit"
                        disabled={isSubmitting}>
                        {isSubmitting ? "Загрузка..." : "Зарегистрироваться"}
                    </button>
                </form>

                <p>
                    Есть аккаунт? <Link to="/login">Войти</Link>
                </p>
            </section>
        </main>
    );
}
