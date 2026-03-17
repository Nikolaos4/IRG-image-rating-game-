import { useParams } from "react-router-dom";
import "./GamePage.scss";
import { getGameRequest, type GetGameResponse } from "@/api/game";
import { useEffect, useState } from "react";
import GameLobby from "@/components/Game/GameLobby/GameLobby";

export default function GamePage() {
    const { id } = useParams<{ id: string }>();

    const [game, setGame] = useState<GetGameResponse["game"] | null>(null);
    const [loading, setLoading] = useState(true);

    if (!id) {
        return <div className="error">Игра не найдена</div>;
    }

    async function loadGame() {
        try {
            const response = await getGameRequest(id!);
            setGame(response.game);
            setLoading(false);
        } catch (error) {
            console.error("Error loading game:", error);
        }
    }

    useEffect(() => {
        loadGame();
    }, [id]);

    return (
        <main>
            {loading && <div className="loading">Загрузка игры...</div>}
            {game && (
                <>
                    <h2>{game.criteria.name || "Название игры"}</h2>

                    {game.status === "lobby" && <GameLobby game={game!} />}
                </>
            )}
        </main>
    );
}
