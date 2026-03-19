import { useEffect, useState } from "react";
import { getAdminUsersRequest, type AdminUser } from "@/api/admin";
import "@/assets/scss/pages.scss";
import "./AdminPage.scss";

export default function AdminPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getAdminUsersRequest();
                setUsers(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Не удалось загрузить список пользователей";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchUsers();
    }, []);

    if (isLoading) {
        return <main>Загрузка пользователей...</main>;
    }

    if (error) {
        return <main>Ошибка: {error}</main>;
    }

    return (
        <main className="admin-page">
            <h2>Панель администратора</h2>
            <p className="admin-page__subtitle">Все пользователи системы</p>

            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Email</th>
                            <th>Роль</th>
                            <th>Победы</th>
                            <th>Поражения</th>
                            <th>Создан</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.user_id}>
                                <td>{user.user_id}</td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{user.wins}</td>
                                <td>{user.losses}</td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
