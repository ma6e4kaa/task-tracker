import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { apiFetch } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import styles from './ProfilePage.module.css';

interface MeResponse {
    id: number;
    email: string;
    roles: string[];
    isActive: boolean;
    createdAt: string;
}

export function ProfilePage() {
    const { data: me, error, loading } = useApi<MeResponse>('/api/me');
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const [editMode, setEditMode] = useState(false);
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Заполняем email, когда me загрузился
    useEffect(() => {
        if (me && !editMode) {
            setEmail(me.email);
        }
    }, [me, editMode]);

    const handleEdit = () => {
        setEditMode(true);
        setEmail(me?.email ?? '');
        setCurrentPassword('');
        setNewPassword('');
        setSaveError(null);
        setSuccessMessage(null);
    };

    const handleCancel = () => {
        setEditMode(false);
        setSaveError(null);
    };

    const handleSave = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveError(null);

        const payload: Record<string, string> = {};
        if (email !== me?.email) payload.email = email;
        if (newPassword) {
            payload.password = newPassword;
            payload.currentPassword = currentPassword;
        }

        if (Object.keys(payload).length === 0) {
            setSaving(false);
            setEditMode(false);
            return;
        }

        try {
            await apiFetch('/api/me', {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
            setEditMode(false);
            setSuccessMessage('Профиль обновлён');
            // Перезагрузить страницу, чтобы useApi перезапросил /api/me
            window.location.reload();
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async () => {
        if (!window.confirm('Деактивировать аккаунт? Вы не сможете войти.')) return;
        try {
            await apiFetch('/api/me', { method: 'DELETE' });
            logout();
            navigate('/login');
        } catch (err) {
            alert('Ошибка: ' + (err instanceof Error ? err.message : 'unknown'));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className={styles.wrapper}><Card>Загрузка...</Card></div>;
    if (error) return <div className={styles.wrapper}><Card>Ошибка: {error}</Card></div>;
    if (!me) return null;

    return (
        <div className={styles.wrapper}>
            <Card className={styles.card}>
                <h1 className={styles.title}>Профиль</h1>

                {successMessage && <div className={styles.success}>{successMessage}</div>}

                {!editMode ? (
                    <>
                        <div className={styles.info}>
                            <div className={styles.row}>
                                <span className={styles.label}>Email:</span>
                                <span className={styles.value}>{me.email}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Роли:</span>
                                <span className={styles.value}>{me.roles.join(', ')}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Создан:</span>
                                <span className={styles.value}>
                                    {new Date(me.createdAt).toLocaleString('ru-RU')}
                                </span>
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <Button onClick={handleEdit}>Редактировать</Button>
                            <Button variant="danger" onClick={handleDeactivate}>
                                Деактивировать
                            </Button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSave} className={styles.form}>
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={saving}
                        />
                        {newPassword && (
                            <Input
                                label="Текущий пароль"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                disabled={saving}
                            />
                        )}
                        <Input
                            label="Новый пароль (оставьте пустым, если не меняете)"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={saving}
                        />
                        {saveError && <div className={styles.error}>{saveError}</div>}
                        <div className={styles.actions}>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                            <Button type="button" variant="secondary" onClick={handleCancel}>
                                Отмена
                            </Button>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    );
}
