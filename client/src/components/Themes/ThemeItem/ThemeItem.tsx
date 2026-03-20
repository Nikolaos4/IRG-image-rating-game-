import type { Theme } from "@/api/themes";
import "./ThemeItem.scss";
import { createGameRequest } from "@/api/game";
import { useNavigate } from "react-router-dom";

interface Props {
    theme: Theme;
}

export default function ThemeItem({ theme }: Props) {
    const navigate = useNavigate();

    const handleCreateGame = async () => {
        try {
            const response = await createGameRequest({ criteria: theme.criteria_id });
            navigate(`/game/${response.game.game_id}`);
        } catch (error) {
            console.error("Error creating game:", error);
        }
    };

    return (
        <div
            className="theme-item"
            onClick={handleCreateGame}>
            <img
                src="/images/theme-placeholder.png"
                alt={theme.name}
            />
            <div className="data">
                <h3>{theme.name}</h3>
                <div className="images-count">{theme.images_count} картинок</div>
            </div>
        </div>
    );
}
