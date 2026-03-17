import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "@/components/ui/Button/Button";
import "./IndexPage.scss";

export default function HomePage() {
    return (
        <main>
            <section className="hero">
                <h1>Compairy</h1>
                <p>
                    Кого выберешь ты? Мы показали 100 людям две фотографии и спросили:{" "}
                    <span className="highlight">Кто тупее?</span> <br></br>А теперь угадай, кого выбрало большинство.
                </p>
                <Button>Играть</Button>
            </section>
        </main>
    );
}
