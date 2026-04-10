import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./Header.scss";
import Button from "../ui/Button/Button";
import { useAuth } from "@/contexts/AuthContext";
import Popup from "../ui/Popup/Popup";
import { postConnectTgRequest } from "@/api/account";
import { postNews } from "@/api/news";

export default function Header() {
    const { isAuthenticated, user, logout } = useAuth();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const location = useLocation();

    const connectTg = async () => {
        try {
            const code = await postConnectTgRequest();
            window.open(`https://t.me/compairy_bot?start=${code}`, "_blank");
            alert("Вы успешно подтвердили свой аккаунт и подписались на новости в telegram!");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    (error.response?.data as { message?: string } | undefined)?.message ??
                        "Ошибка подтверждения аккаунта",
                );
            } else {
                setErrorMessage("Ошибка подтверждения аккаунта");
            }
            alert(`Error message: ${errorMessage}`);
        }
    };

    const popupActions = useMemo(
        () => [
            {
                key: "logout",
                label: "Выйти из аккаунта",
                danger: true,
                onClick: logout,
            },
            {
                key: "connectTg",
                label: "Подтвердить аккаунт",
                danger: false,
                onClick: connectTg,
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
            <div className="app-header__center">
                <Link
                    to="/"
                    data-active={location.pathname == "/"}>
                    Главная
                </Link>
                {user && (
                    <Link
                        to="/themes"
                        data-active={location.pathname == "/themes"}>
                        Игра
                    </Link>
                )}
                {user && (
                    <Link
                        to="/rating"
                        data-active={location.pathname == "/rating"}>
                        Рейтинг
                    </Link>
                )}
                {user?.role === "admin" && (
                    <Link
                        to="/admin"
                        data-active={location.pathname == "/admin"}>
                        Пользователи
                    </Link>
                )}
                {user?.role === "admin" && (
                    <Link
                        to="/news"
                        data-active={location.pathname == "/news"}>
                        Новости
                    </Link>
                )}
            </div>
            <div className="app-header__right-section">
                {!isAuthenticated ? (
                    <Link
                        to="/login"
                        className="app-header__link">
                        <Button>Войти</Button>
                    </Link>
                ) : (
                    <>
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
                    </>
                )}
            </div>
        </header>
    );
}
