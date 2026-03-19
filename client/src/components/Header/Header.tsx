import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Header.scss";
import Button from "../ui/Button/Button";
import { useAuth } from "@/contexts/AuthContext";
import Popup from "../ui/Popup/Popup";

export default function Header() {
    const { isAuthenticated, user, logout } = useAuth();
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const popupActions = useMemo(
        () => [
            {
                key: "logout",
                label: "Выйти из аккаунта",
                danger: true,
                onClick: logout,
            },
        ],
        [logout],
    );

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
                    <div className="current-user-wrap">
                        <button
                            type="button"
                            className="current-user"
                            onClick={() => setIsPopupOpen((prev) => !prev)}>
                            <div className="current-user__avatar"></div>
                            <span className="current-user__name">{user?.username}</span>
                        </button>
                        <Popup
                            isOpen={isPopupOpen}
                            actions={popupActions}
                            onClose={() => setIsPopupOpen(false)}
                        />
                    </div>
                )}
            </div>
        </header>
    );
}
