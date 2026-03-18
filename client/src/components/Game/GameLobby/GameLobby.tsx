import Button from "@/components/ui/Button/Button";
import "./GameLobby.scss";
import { joinGameRequest, startGameRequest, type GetGameResponse } from "@/api/game";
import GameMember from "../GameMember/GameMember";
import { useMemo, useState } from "react";

interface Props {
    game: GetGameResponse["game"];
    currentUserId: number | null;
    onStatusUpdated: (status: string) => void;
    onGameUpdated: () => Promise<void> | void;
}

export default function GameLobby({ game, currentUserId, onStatusUpdated, onGameUpdated }: Props) {
    const [isJoining, setIsJoining] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const isCreator = currentUserId === game.creator.user_id;
    const isMember = useMemo(() => {
        if (!currentUserId) return false;
        if (isCreator) return true;
        return game.members.some((member) => member.user_id === currentUserId);
    }, [currentUserId, isCreator, game.members]);

    const maxPlayersReached = game.max_players !== null && game.members.length + 1 >= game.max_players;

    async function joinGame() {
        if (!currentUserId || isMember || maxPlayersReached) return;

        try {
            setIsJoining(true);
            setMessage(null);
            await joinGameRequest(game.game_id);
            await onGameUpdated();
        } catch (error) {
            console.error("Error joining game:", error);
            setMessage("Не удалось присоединиться к комнате");
        } finally {
            setIsJoining(false);
        }
    }

    async function startGame() {
        if (!isCreator) return;

        try {
            setIsStarting(true);
            setMessage(null);
            const response = await startGameRequest(game.game_id);
            onStatusUpdated(response.game.status);
        } catch (error) {
            console.error("Error starting game:", error);
            setMessage("Не удалось начать игру");
        } finally {
            setIsStarting(false);
        }
    }

    return (
        <div className="game-lobby">
            <Button>Скопировать ссылку</Button>
            <div className="rounds">Раундов: {game.max_rounds}</div>
            <div className="members">
                Участников: {game.members.length + 1} из {game.max_players}
            </div>
            {message ? <p className="message">{message}</p> : null}
            <div className="members-list">
                <GameMember
                    member={game.creator}
                    isCreator={true}
                />
                {game.members.map((member) => (
                    <GameMember
                        key={member.user_id}
                        member={member}
                    />
                ))}
            </div>

            {!isMember && (
                <Button
                    onClick={joinGame}
                    disabled={isJoining || maxPlayersReached}>
                    {isJoining ? "Входим..." : maxPlayersReached ? "Комната заполнена" : "Войти в комнату"}
                </Button>
            )}

            {isCreator && (
                <Button
                    onClick={startGame}
                    disabled={isStarting}>
                    {isStarting ? "Запуск..." : "Начать"}
                </Button>
            )}
        </div>
    );
}
