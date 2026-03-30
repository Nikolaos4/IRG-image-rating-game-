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
            <div className="center">
                {result.played_rounds} / {result.max_rounds} раунд
            </div>

            <div>
                <img src={`https://avatars.githubusercontent.com/u/112552699?v=4`} alt='profile photo' className="photo-kolyan"/>
                <div className="player_name">{result.player_stats.map((player) => <Fragment key={player.user_id}>{player.username}</Fragment>)}</div>
            </div>

            <div className="center-votes">
                Угадано {result.player_stats.map((player) => <Fragment key={player.user_id}>{player.correct_answers}</Fragment>)} / {result.total_votes}
            </div>

            <h2 className="header-center">Статистика игроков</h2>
            <div className="stats-table">
                <div className="head">Игрок</div>
                <div className="head">Правильные ответы</div>

                {result.player_stats.map((player) => (
                    <Fragment key={player.user_id}>
                        <div className="user"><div className="avatar"></div>{player.username}</div>
                        <div className="answers">{player.correct_answers} / {result.total_votes}</div>
                    </Fragment>
                ))}
            </div>
        </section>
    );
}
