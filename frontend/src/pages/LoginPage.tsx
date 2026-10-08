import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import styles from './LoginPage.module.css';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('/api/login_check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Неверный email или пароль');
            }

            const data = await response.json();
            login(data.token);
            navigate('/profile');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <Card className={styles.card}>
                <h1 className={styles.title}>Вход</h1>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={loading}
                    />
                    <Input
                        label="Пароль"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        disabled={loading}
                    />
                    {error && <div className={styles.error}>{error}</div>}
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
