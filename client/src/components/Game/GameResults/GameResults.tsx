import { getGameResultRequest, type GameResultResponse } from "@/api/game";
import { Fragment, useEffect, useState } from "react";
import "./GameResults.scss";

interface Props {
    gameId: string;
}

export default function GameResults({ gameId }: Props) {
    const [result, setResult] = useState<GameResultResponse["game"] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadResult = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await getGameResultRequest(gameId);
                setResult(response.game);
            } catch (err) {
                const text = err instanceof Error ? err.message : "Не удалось загрузить результаты игры";
                setError(text);
            } finally {
                setIsLoading(false);
            }
        };

        void loadResult();
    }, [gameId]);

    if (isLoading) {
        return <section className="game-results">Загрузка результатов...</section>;
    }

    if (error) {
        return (
            <section className="game-results">
                <p className="error">{error}</p>
            </section>
        );
    }

    if (!result) {
        return <section className="game-results">Результаты не найдены</section>;
    }

    return (
        <section className="game-results">
            <h3>Игра завершена</h3>
            <p>Раундов сыграно: {result.played_rounds}</p>
            <p>Всего голосов: {result.total_votes}</p>

            <h4>Статистика игроков</h4>
            <div className="stats-table">
                <div className="head">Игрок</div>
                <div className="head">Правильных ответов</div>

                {result.player_stats.map((player) => (
                    <Fragment key={player.user_id}>
                        <div>{player.username}</div>
                        <div>{player.correct_answers}</div>
                    </Fragment>
                ))}
            </div>

            <h4>Топ изображений</h4>
            <ol className="images-rating">
                {result.results.map((image) => (
                    <li key={image.image_id}>
                        <span>#{image.position}</span>
                        <span>image {image.image_id}</span>
                        <span>{image.votes} голосов</span>
                    </li>
                ))}
            </ol>
        </section>
    );
}
