import { useEffect, useState } from "react";
import {
    blockUserRequest,
    getAdminUsersRequest,
    type AdminUser,
    unblockUserRequest,
    updateAdminUserRequest,
} from "@/api/admin";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/ui/Modal/Modal";
import "@/assets/scss/pages.scss";
import "./AdminPage.scss";
import Input from "@/components/ui/Input/Input";
import Select from "@/components/ui/Select/Select";

export default function AdminPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingUserId, setPendingUserId] = useState<number | null>(null);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editUsername, setEditUsername] = useState("");
    const [editRole, setEditRole] = useState<"user" | "admin">("user");
    const [isEditSaving, setIsEditSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
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

    const openEditModal = (target: AdminUser) => {
        setEditingUser(target);
        setEditUsername(target.username);
        setEditRole(target.role.toLowerCase() === "admin" ? "admin" : "user");
        setEditError(null);
    };

    const closeEditModal = () => {
        setEditingUser(null);
        setEditError(null);
    };

    const handleSaveEdit = async () => {
        if (!editingUser) {
            return;
        }

        const trimmedUsername = editUsername.trim();

        if (!trimmedUsername) {
            setEditError("Имя пользователя не может быть пустым");
            return;
        }

        try {
            setIsEditSaving(true);
            setEditError(null);

            await updateAdminUserRequest(editingUser.user_id, {
                username: trimmedUsername,
                role: editRole,
            });

            await fetchUsers();
            closeEditModal();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Не удалось обновить пользователя";
            setEditError(message);
        } finally {
            setIsEditSaving(false);
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
                                        <div className="actions-cell">
                                            <button
                                                type="button"
                                                className="action-btn action-btn--edit"
                                                disabled={isPending}
                                                onClick={() => openEditModal(user)}>
                                                Редактировать
                                            </button>
                                            <button
                                                type="button"
                                                className={`action-btn ${user.is_blocked ? "action-btn--unblock" : "action-btn--block"}`}
                                                disabled={actionDisabled}
                                                onClick={() => handleToggleBlock(user)}>
                                                {isPending
                                                    ? "..."
                                                    : user.is_blocked
                                                      ? "Разблокировать"
                                                      : "Заблокировать"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={Boolean(editingUser)}
                title="Редактирование пользователя"
                onClose={closeEditModal}>
                <div className="edit-user-form">
                    <Input
                        value={editUsername}
                        onChange={(event) => setEditUsername(event.target.value)}
                        placeholder="Введите имя"
                    />

                    <Select
                        value={editRole}
                        onChange={setEditRole}
                        disabled={editingUser?.user_id === currentUser?.user_id}
                        options={[
                            { value: "user", label: "user" },
                            { value: "admin", label: "admin" },
                        ]}
                    />

                    {editError ? <p className="edit-error">{editError}</p> : null}

                    <div className="edit-actions">
                        <button
                            type="button"
                            className="action-btn action-btn--secondary"
                            onClick={closeEditModal}
                            disabled={isEditSaving}>
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="action-btn action-btn--edit"
                            onClick={handleSaveEdit}
                            disabled={isEditSaving}>
                            {isEditSaving ? "Сохранение..." : "Сохранить"}
                        </button>
                    </div>
                </div>
            </Modal>
        </main>
    );
}
