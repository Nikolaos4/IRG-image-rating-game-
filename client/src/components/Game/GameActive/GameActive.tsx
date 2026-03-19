import {
    getRoundRequest,
    getRoundWsUrl,
    voteRoundRequest,
    type GetGameResponse,
    type GetRoundResponse,
} from "@/api/game";
import { useCallback, useEffect, useRef, useState } from "react";
import "./GameActive.scss";

const ROUND_REVEAL_DELAY_MS = 3000;
const TOKEN_STORAGE_KEY = "compairy_jwt";

interface Props {
    game: GetGameResponse["game"];
    onGameUpdated?: () => Promise<void> | void;
}

export default function GameActive({ game, onGameUpdated }: Props) {
    const [round, setRound] = useState<GetRoundResponse["round"] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [revealedUnknownVotes, setRevealedUnknownVotes] = useState<number | null>(null);
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const [winnerImageId, setWinnerImageId] = useState<number | null>(null);
    const latestRoundRef = useRef<GetRoundResponse["round"] | null>(null);
    const onGameUpdatedRef = useRef<Props["onGameUpdated"]>(onGameUpdated);
    const blockRealtimeUpdatesRef = useRef(false);

    useEffect(() => {
        onGameUpdatedRef.current = onGameUpdated;
    }, [onGameUpdated]);

    const loadRound = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await getRoundRequest(game.game_id);
            const isRoundChanged = Boolean(
                latestRoundRef.current && latestRoundRef.current.current_round !== response.round.current_round,
            );
            setRevealedUnknownVotes((prev) => (isRoundChanged ? null : prev));
            setSelectedImageId((prev) => (isRoundChanged ? null : prev));
            setWinnerImageId((prev) => (isRoundChanged ? null : prev));
            setRound(response.round);
            latestRoundRef.current = response.round;
        } catch (err) {
            const text = err instanceof Error ? err.message : "Не удалось загрузить текущий раунд";
            setError(text);
        } finally {
            setIsLoading(false);
        }
    }, [game.game_id]);

    const handleVote = async (imageId: number) => {
        if (isVoting) return;
        try {
            setIsVoting(true);
            setError(null);
            setMessage(null);
            setSelectedImageId(imageId);

            await voteRoundRequest(game.game_id, { voted_image_id: imageId });

            setRound((prev) => {
                if (!prev) {
                    return prev;
                }

                return {
                    ...prev,
                    votes_received: Math.min(prev.votes_received + 1, prev.votes_required),
                };
            });
            await onGameUpdatedRef.current?.();
        } catch (err) {
            const text = err instanceof Error ? err.message : "Не удалось отправить голос";
            setError(text);
        } finally {
            setIsVoting(false);
        }
    };

    useEffect(() => {
        void loadRound();
    }, [loadRound]);

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) {
            return;
        }

        let isMounted = true;
        const ws = new WebSocket(getRoundWsUrl(game.game_id, token));

        ws.onmessage = async (event) => {
            if (!isMounted) {
                return;
            }

            try {
                const payload = JSON.parse(event.data as string) as {
                    type?: string;
                    status?: string;
                    current_round?: number;
                    completedRound?: {
                        current_round: number;
                        first_image: number;
                        second_image: number;
                        first_image_url: string;
                        second_image_url: string;
                        winner_image_id: number;
                        first_image_votes: number;
                        second_image_votes: number;
                        votes_received: number;
                        votes_required: number;
                    };
                    round?: {
                        current_round: number;
                        first_image: number;
                        second_image: number;
                        first_image_url: string;
                        second_image_url: string;
                        first_image_votes: number;
                        second_image_votes: null;
                        votes_received: number;
                        votes_required: number;
                    };
                };

                if (payload.type === "round:current") {
                    if (payload.completedRound) {
                        blockRealtimeUpdatesRef.current = true;

                        setWinnerImageId(payload.completedRound.winner_image_id);
                        setRevealedUnknownVotes(payload.completedRound.second_image_votes);
                        setRound((prev) => {
                            if (!prev || prev.current_round !== payload.completedRound?.current_round) {
                                return prev;
                            }

                            return {
                                ...prev,
                                votes_received: payload.completedRound.votes_received,
                                votes_required: payload.completedRound.votes_required,
                            };
                        });

                        await new Promise((resolve) => setTimeout(resolve, ROUND_REVEAL_DELAY_MS));

                        blockRealtimeUpdatesRef.current = false;

                        if (payload.round) {
                            setRound(payload.round);
                            latestRoundRef.current = payload.round;
                            setRevealedUnknownVotes(null);
                            setSelectedImageId(null);
                            setWinnerImageId(null);
                        }
                    } else if (payload.round && !blockRealtimeUpdatesRef.current) {
                        void loadRound();
                    }

                    void onGameUpdatedRef.current?.();
                }
            } catch {
                // Ignore malformed websocket payloads.
            }
        };

        ws.onerror = () => {
            if (!isMounted) {
                return;
            }

            setError((prev) => prev ?? "Проблема с realtime-соединением");
        };

        return () => {
            isMounted = false;
            ws.close();
        };
    }, [game.game_id, loadRound]);

    if (isLoading) {
        return <div className="game-active">Загрузка раунда...</div>;
    }

    if (error) {
        return (
            <div className="game-active">
                <p className="error">{error}</p>
            </div>
        );
    }

    if (!round) {
        return <div className="game-active">Раунд не найден</div>;
    }

    return (
        <section className="game-active">
            <div className="round-counter">
                {round.current_round}/{game.max_rounds} раунд
            </div>

            {message ? <p className="message">{message}</p> : null}

            <div className="images-grid">
                <div
                    className={`image-card ${selectedImageId === round.first_image ? "is-selected" : ""} ${
                        winnerImageId === round.first_image ? "is-winner" : ""
                    }`}
                    onClick={() => handleVote(round.first_image)}>
                    <img
                        src={round.first_image_url}
                        alt={`Image ${round.first_image}`}
                    />
                    <div className="votes">{round.first_image_votes}</div>
                </div>

                <div
                    className={`image-card ${selectedImageId === round.second_image ? "is-selected" : ""} ${
                        winnerImageId === round.second_image ? "is-winner" : ""
                    }`}
                    onClick={() => handleVote(round.second_image)}>
                    <img
                        src={round.second_image_url}
                        alt={`Image ${round.second_image}`}
                    />
                    <div className="votes">{revealedUnknownVotes !== null ? revealedUnknownVotes : "?"}</div>
                </div>
            </div>

            <div className="round-voters-counter">
                {round.votes_received}/{round.votes_required} проголосовало
            </div>
        </section>
    );
}
