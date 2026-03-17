import { useParams } from "react-router-dom";
import "./GamePage.scss";
import { getGameRequest, type GetGameResponse } from "@/api/game";
import { useEffect, useState } from "react";
import GameLobby from "@/components/Game/GameLobby/GameLobby";
import GameActive from "@/components/Game/GameActive/GameActive";
import GameResults from "@/components/Game/GameResults/GameResults";

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

    function handleStatusUpdated(status: string) {
        setGame((prevGame) => (prevGame ? { ...prevGame, status } : prevGame));
    }

    return (
        <main>
            {loading && <div className="loading">Загрузка игры...</div>}
            {game && (
                <>
                    <h2>{game.criteria.name || "Название игры"}</h2>

                    {game.status === "lobby" && (
                        <GameLobby
                            game={game!}
                            onStatusUpdated={handleStatusUpdated}
                        />
                    )}
                    {game.status === "active" && (
                        <GameActive
                            game={game}
                            onGameUpdated={loadGame}
                        />
                    )}
                    {game.status === "finished" && <GameResults gameId={id} />}
                </>
            )}
        </main>
    );
}
