import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import styles from './UsersPage.module.css';

interface User {
    id: number;
    email: string;
    isActive: boolean;
    createdAt: string;
}

export function UsersPage() {
    const [search, setSearch] = useState('');
    const url = search
        ? `/api/users?search=${encodeURIComponent(search)}`
        : '/api/users';

    const { data: users, error, loading } = useApi<User[]>(url);

    return (
        <div className={styles.wrapper}>
            <Card className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Пользователи</h1>
                </div>

                <div className={styles.searchRow}>
                    <Input
                        label="Поиск по email"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Введите email..."
                    />
                </div>

                {loading && <div className={styles.loading}>Загрузка...</div>}

                {error && <div className={styles.error}>Ошибка: {error}</div>}

                {users && users.length === 0 && (
                    <div className={styles.empty}>Ничего не найдено</div>
                )}

                {users && users.length > 0 && (
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Статус</th>
                            <th>Создан</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className={styles.idCell}>#{user.id}</td>
                                <td>{user.email}</td>
                                <td>
                                        <span
                                            className={
                                                user.isActive
                                                    ? styles.statusActive
                                                    : styles.statusInactive
                                            }
                                        >
                                            {user.isActive ? 'Активен' : 'Заблокирован'}
                                        </span>
                                </td>
                                <td className={styles.dateCell}>
                                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                </td>
                                <td>
                                    <Link to={`/users/${user.id}`} className={styles.editLink}>
                                        Редактировать
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
}
