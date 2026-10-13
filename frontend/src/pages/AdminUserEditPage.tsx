import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import styles from './AdminUserEditPage.module.css';

interface User {
    id: number;
    email: string;
    roles: string[];
    isActive: boolean;
    createdAt: string;
}

export function AdminUserEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: user, error, loading } = useApi<User>(`/api/users/${id}`);

    const [email, setEmail] = useState('');
    const [roles, setRoles] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setEmail(user.email);
            setRoles(user.roles);
            setIsActive(user.isActive);
        }
    }, [user]);

    const toggleRole = (role: string) => {
        setRoles((prev) =>
            prev.includes(role)
                ? prev.filter((r) => r !== role)
                : [...prev, role]
        );
    };

    const handleSave = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            await apiFetch(`/api/users/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ email, roles, isActive }),
            });
            setSaveSuccess(true);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.wrapper}><Card>Загрузка...</Card></div>;
    if (error) return <div className={styles.wrapper}><Card>Ошибка: {error}</Card></div>;
    if (!user) return null;

    return (
        <div className={styles.wrapper}>
            <Card className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Пользователь #{user.id}</h1>
                    <Link to="/users" className={styles.backLink}>← Назад</Link>
                </div>

                {saveSuccess && <div className={styles.success}>Сохранено</div>}

                <form onSubmit={handleSave} className={styles.form}>
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={saving}
                    />

                    <div className={styles.field}>
                        <span className={styles.label}>Роли</span>
                        <div className={styles.checkboxes}>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={roles.includes('ROLE_USER')}
                                    onChange={() => toggleRole('ROLE_USER')}
                                    disabled={saving}
                                />
                                ROLE_USER
                            </label>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={roles.includes('ROLE_ADMIN')}
                                    onChange={() => toggleRole('ROLE_ADMIN')}
                                    disabled={saving}
                                />
                                ROLE_ADMIN
                            </label>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                disabled={saving}
                            />
                            Активен
                        </label>
                    </div>

                    {saveError && <div className={styles.error}>{saveError}</div>}

                    <div className={styles.actions}>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/users')}
                        >
                            Отмена
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
