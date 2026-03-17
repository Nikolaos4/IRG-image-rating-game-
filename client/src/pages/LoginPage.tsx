import { useState, type ChangeEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import Input from "../components/ui/Input/Input";
import "@/assets/scss/auth.scss";
import Button from "@/components/ui/Button/Button";

export default function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuth();

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
            await login({ email, password });
            navigate("/");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    (error.response?.data as { message?: string } | undefined)?.message ?? "При входе произошла ошибка",
                );
            } else {
                setErrorMessage("При входе произошла ошибка");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-layout">
            <section className="auth-card">
                <h1>Вход</h1>
                <form
                    onSubmit={handleSubmit}
                    className="auth-form">
                    <div className="fields">
                        <Input
                            type="email"
                            autoComplete="email"
                            value={email}
                            placeholder="Почта"
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />

                        <Input
                            type="password"
                            autoComplete="current-password"
                            minLength={6}
                            value={password}
                            placeholder="Пароль"
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

                    <Button
                        type="submit"
                        disabled={isSubmitting}>
                        {isSubmitting ? "Загрузка..." : "Войти"}
                    </Button>
                </form>

                <p>
                    Нет аккаунта? <Link to="/register">Создать</Link>
                </p>
            </section>
        </main>
    );
}
