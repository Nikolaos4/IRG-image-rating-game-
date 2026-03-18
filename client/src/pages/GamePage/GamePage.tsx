import { useParams } from "react-router-dom";
import "./GamePage.scss";
import { getGameRequest, getGameWsUrl, type GetGameResponse } from "@/api/game";
import { useCallback, useEffect, useState } from "react";
import GameLobby from "@/components/Game/GameLobby/GameLobby";
import GameActive from "@/components/Game/GameActive/GameActive";
import GameResults from "@/components/Game/GameResults/GameResults";
import { useAuth } from "@/contexts/AuthContext";

const TOKEN_STORAGE_KEY = "compairy_jwt";

export default function GamePage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [game, setGame] = useState<GetGameResponse["game"] | null>(null);
    const [loading, setLoading] = useState(true);

    if (!id) {
        return <div className="error">Игра не найдена</div>;
    }

    const loadGame = useCallback(async () => {
        try {
            const response = await getGameRequest(id!);
            setGame(response.game);
            setLoading(false);
        } catch (error) {
            console.error("Error loading game:", error);
        }
    }, [id]);

    useEffect(() => {
        void loadGame();
    }, [loadGame]);

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) {
            return;
        }

        let isMounted = true;
        const ws = new WebSocket(getGameWsUrl(id, token));

        ws.onmessage = (event) => {
            if (!isMounted) {
                return;
            }

            try {
                const payload = JSON.parse(event.data as string) as {
                    type?: string;
                    status?: string;
                    members?: Array<{ user_id: number; username: string }>;
                };

                if (payload.type === "game:updated") {
                    setGame((prevGame) => {
                        if (!prevGame) return prevGame;
                        return {
                            ...prevGame,
                            status: payload.status ?? prevGame.status,
                            members: payload.members ?? prevGame.members,
                        };
                    });
                }
            } catch {
                // Ignore malformed websocket payloads.
            }
        };

        ws.onerror = () => {
            if (!isMounted) {
                return;
            }
            console.error("WebSocket error");
        };

        return () => {
            isMounted = false;
            ws.close();
        };
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
                            game={game}
                            currentUserId={user?.user_id ?? null}
                            onStatusUpdated={handleStatusUpdated}
                            onGameUpdated={loadGame}
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
