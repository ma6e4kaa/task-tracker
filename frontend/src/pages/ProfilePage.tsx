import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import styles from './ProfilePage.module.css';

interface MeResponse {
    email: string;
    roles: string[];
}

export function ProfilePage() {
    const { data: me, error, loading } = useApi<MeResponse>('/api/me');
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <Card className={styles.card}>
                    <div className={styles.loading}>Загрузка...</div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.wrapper}>
                <Card className={styles.card}>
                    <div className={styles.error}>Ошибка: {error}</div>
                </Card>
            </div>
        );
    }

    if (!me) return null;

    return (
        <div className={styles.wrapper}>
            <Card className={styles.card}>
                <h1 className={styles.title}>Профиль</h1>
                <div className={styles.info}>
                    <div className={styles.row}>
                        <span className={styles.label}>Email:</span>
                        <span className={styles.value}>{me.email}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Роли:</span>
                        <span className={styles.value}>{me.roles.join(', ')}</span>
                    </div>
                </div>
                <div className={styles.actions}>
                    <Button variant="danger" onClick={handleLogout}>
                        Выйти
                    </Button>
                </div>
            </Card>
        </div>
    );
}
