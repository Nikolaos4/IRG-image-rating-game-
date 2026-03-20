import { useEffect, useState } from "react";
import { getRatingRequest, type RatingItem } from "@/api/rating";
import "@/assets/scss/pages.scss";
import "./RatingPage.scss";
import { useAuth } from "@/contexts/AuthContext";

export default function RatingPage() {
    const [rating, setRating] = useState<RatingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchRating = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getRatingRequest();
                setRating(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Не удалось загрузить рейтинг";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchRating();
    }, []);

    if (isLoading) {
        return <main>Загрузка рейтинга...</main>;
    }

    if (error) {
        return <main>Ошибка: {error}</main>;
    }

    return (
        <main className="rating-page">
            <h2>Рейтинг</h2>

            <div className="rating-table-wrap">
                <table className="rating-table">
                    <thead>
                        <tr>
                            <th> </th>
                            <th>Игрок</th>
                            <th>Победы</th>
                            <th>Поражения</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rating.map((item) => (
                            <tr
                                key={item.user_id}
                                className={user?.user_id === item.user_id ? "current-user" : ""}>
                                <td className="position">{item.position}</td>
                                <td className="user">
                                    <div className="avatar"></div>
                                    <div className="name">{item.username}</div>
                                </td>
                                <td>{item.wins}</td>
                                <td>{item.losses}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
