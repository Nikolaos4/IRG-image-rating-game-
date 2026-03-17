import { Link } from "react-router-dom";
import "./Header.scss";
import Button from "../ui/Button/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
    const { isAuthenticated, user } = useAuth();
    return (
        <header className="app-header">
            <Link
                to="/"
                className="app-header__title">
                Compairy
            </Link>
            <div className="app-header__right-section">
                {!isAuthenticated ? (
                    <Link
                        to="/login"
                        className="app-header__link">
                        <Button>Войти</Button>
                    </Link>
                ) : (
                    <div className="current-user">
                        <div className="current-user__avatar"></div>
                        <span className="current-user__name">{user?.username}</span>
                    </div>
                )}
            </div>
        </header>
    );
}
