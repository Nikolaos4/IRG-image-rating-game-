import { Link } from "react-router-dom";
import "./Header.scss";
import Button from "../ui/Button/Button";

export default function Header() {
    return (
        <header className="app-header">
            <Link
                to="/"
                className="app-header__title">
                Compairy
            </Link>
            <div className="app-header__right-section">
                <Link
                    to="/login"
                    className="app-header__link">
                    <Button>Войти</Button>
                </Link>
            </div>
        </header>
    );
}
