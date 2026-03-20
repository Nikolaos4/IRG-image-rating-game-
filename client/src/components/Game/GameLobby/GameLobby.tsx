import Button from "@/components/ui/Button/Button";
import "./GameLobby.scss";
import { editGameSettingsRequest, joinGameRequest, startGameRequest, type GetGameResponse } from "@/api/game";
import GameMember from "../GameMember/GameMember";
import { useEffect, useMemo, useState } from "react";
import Select, { type SelectOption } from "@/components/ui/Select/Select";

interface Props {
    game: GetGameResponse["game"];
    currentUserId: number | null;
    onStatusUpdated: (status: string) => void;
    onGameUpdated: () => Promise<void> | void;
}

export default function GameLobby({ game, currentUserId, onStatusUpdated, onGameUpdated }: Props) {
    const [isJoining, setIsJoining] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [maxRounds, setMaxRounds] = useState<number>(game.max_rounds ?? 5);
    const [maxPlayers, setMaxPlayers] = useState<number>(game.max_players ?? 2);

    const roundsOptions: SelectOption<string>[] = useMemo(
        () =>
            Array.from({ length: 10 }, (_, index) => index + 1).map((value) => ({
                value: String(value),
                label: String(value),
            })),
        [],
    );
    const playersOptions: SelectOption<string>[] = useMemo(
        () =>
            Array.from({ length: 7 }, (_, index) => index + 2).map((value) => ({
                value: String(value),
                label: String(value),
            })),
        [],
    );

    const isCreator = currentUserId === game.creator.user_id;
    const isMember = useMemo(() => {
        if (!currentUserId) return false;
        if (isCreator) return true;
        return game.members.some((member) => member.user_id === currentUserId);
    }, [currentUserId, isCreator, game.members]);

    const maxPlayersReached = game.max_players !== null && game.members.length + 1 >= game.max_players;
    const currentParticipants = game.members.length + 1;

    useEffect(() => {
        setMaxRounds(game.max_rounds ?? 5);
        setMaxPlayers(game.max_players ?? 2);
    }, [game.max_rounds, game.max_players]);

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

    async function saveLobbySettings(nextMaxRounds: number, nextMaxPlayers: number) {
        if (!isCreator) return;

        if (nextMaxPlayers < currentParticipants) {
            setMessage(`Максимум игроков не может быть меньше текущего количества (${currentParticipants})`);
            return;
        }

        try {
            setIsSavingSettings(true);
            setMessage(null);
            await editGameSettingsRequest(game.game_id, {
                max_rounds: nextMaxRounds,
                max_players: nextMaxPlayers,
            });
            await onGameUpdated();
        } catch (error) {
            console.error("Error updating game settings:", error);
            setMessage("Не удалось обновить настройки лобби");
        } finally {
            setIsSavingSettings(false);
        }
    }

    function copyLink() {
        window.navigator.clipboard.writeText(`${window.location.host}/game/${game.game_id}`);
    }

    return (
        <div className="game-lobby">
            <Button onClick={copyLink}>Скопировать ссылку</Button>
            <div className="rounds">
                Раундов:{" "}
                {isCreator ? (
                    <Select
                        value={String(maxRounds)}
                        options={roundsOptions}
                        onChange={(value) => {
                            const nextMaxRounds = Number(value);
                            setMaxRounds(nextMaxRounds);
                            saveLobbySettings(nextMaxRounds, maxPlayers);
                        }}
                        disabled={isSavingSettings || isStarting}
                    />
                ) : (
                    <span>{game.max_rounds}</span>
                )}
            </div>
            <div className="members">
                Участников: {game.members.length + 1} из{" "}
                {isCreator ? (
                    <Select
                        value={String(maxPlayers)}
                        options={playersOptions}
                        onChange={(value) => {
                            const nextMaxPlayers = Number(value);
                            setMaxPlayers(nextMaxPlayers);
                            saveLobbySettings(maxRounds, nextMaxPlayers);
                        }}
                        disabled={isSavingSettings || isStarting}
                    />
                ) : (
                    <span>{game.max_players}</span>
                )}
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
