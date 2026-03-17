import { getRoundRequest, voteRoundRequest, type GetGameResponse, type GetRoundResponse } from "@/api/game";
import { useEffect, useState } from "react";
import "./GameActive.scss";

const ROUND_REVEAL_DELAY_MS = 3000;

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

    const loadRound = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await getRoundRequest(game.game_id);
            const isRoundChanged = Boolean(round && round.current_round !== response.round.current_round);
            setRevealedUnknownVotes((prev) => (isRoundChanged ? null : prev));
            setSelectedImageId((prev) => (isRoundChanged ? null : prev));
            setWinnerImageId((prev) => (isRoundChanged ? null : prev));
            setRound(response.round);
        } catch (err) {
            const text = err instanceof Error ? err.message : "Не удалось загрузить текущий раунд";
            setError(text);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVote = async (imageId: number) => {
        if (isVoting) return;
        try {
            setIsVoting(true);
            setError(null);
            setMessage(null);
            setSelectedImageId(imageId);
            setWinnerImageId(null);

            const response = await voteRoundRequest(game.game_id, { voted_image_id: imageId });
            const winnerId = response.round?.winner_image_id;
            const isRoundCompleted = typeof winnerId === "number";

            if (isRoundCompleted) {
                setWinnerImageId(winnerId);
            }

            if (typeof response.round?.unknown_image_votes === "number") {
                setRevealedUnknownVotes(response.round.unknown_image_votes);
            } else {
                setMessage(response.message);
            }

            await new Promise((resolve) => setTimeout(resolve, ROUND_REVEAL_DELAY_MS));

            await loadRound();
            await onGameUpdated?.();
        } catch (err) {
            const text = err instanceof Error ? err.message : "Не удалось отправить голос";
            setError(text);
        } finally {
            setIsVoting(false);
        }
    };

    useEffect(() => {
        void loadRound();
    }, [game.game_id]);

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
        </section>
    );
}
