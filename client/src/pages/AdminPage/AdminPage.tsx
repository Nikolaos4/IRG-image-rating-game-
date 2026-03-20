import { useEffect, useState } from "react";
import { blockUserRequest, getAdminUsersRequest, type AdminUser, unblockUserRequest } from "@/api/admin";
import { useAuth } from "@/contexts/AuthContext";
import "@/assets/scss/pages.scss";
import "./AdminPage.scss";

export default function AdminPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingUserId, setPendingUserId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { user: currentUser } = useAuth();

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

    useEffect(() => {
        void fetchUsers();
    }, []);

    const handleToggleBlock = async (target: AdminUser) => {
        try {
            setPendingUserId(target.user_id);
            setError(null);

            if (target.is_blocked) {
                await unblockUserRequest(target.user_id);
            } else {
                await blockUserRequest(target.user_id);
            }

            await fetchUsers();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Не удалось изменить статус блокировки";
            setError(message);
        } finally {
            setPendingUserId(null);
        }
    };

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
                            <th>Статус</th>
                            <th>Победы</th>
                            <th>Поражения</th>
                            <th>Создан</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => {
                            const isSelf = user.user_id === currentUser?.user_id;
                            const isAdmin = user.role.toLowerCase() === "admin";
                            const isPending = pendingUserId === user.user_id;
                            const actionDisabled = isSelf || isAdmin || isPending;

                            return (
                                <tr key={user.user_id}>
                                    <td>{user.user_id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        {user.is_blocked ? (
                                            <span className="status-badge status-badge--blocked">Заблокирован</span>
                                        ) : (
                                            <span className="status-badge status-badge--active">Активен</span>
                                        )}
                                    </td>
                                    <td>{user.wins}</td>
                                    <td>{user.losses}</td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className={`action-btn ${user.is_blocked ? "action-btn--unblock" : "action-btn--block"}`}
                                            disabled={actionDisabled}
                                            onClick={() => handleToggleBlock(user)}>
                                            {isPending ? "..." : user.is_blocked ? "Разблокировать" : "Заблокировать"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
