import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import styles from './RegisterPage.module.css';

interface RegisterError {
    violations?: Array<{ propertyPath: string; message: string }>;
    message?: string;
}

export function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        if (password !== passwordConfirm) {
            setFieldErrors({ password: 'Пароли не совпадают' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.status === 201) {
                navigate('/login', { state: { registered: true } });
                return;
            }

            if (response.status === 422) {
                const data: RegisterError = await response.json();
                const errors: Record<string, string> = {};
                data.violations?.forEach((v) => {
                    errors[v.propertyPath] = v.message;
                });
                setFieldErrors(errors);
                return;
            }

            if (response.status === 409) {
                setFieldErrors({ email: 'Этот email уже зарегистрирован' });
                return;
            }

            throw new Error('Не удалось зарегистрироваться');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка регистрации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <Card className={styles.card}>
                <h1 className={styles.title}>Регистрация</h1>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={fieldErrors.email}
                        required
                        autoComplete="email"
                        disabled={loading}
                    />
                    <Input
                        label="Пароль"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={fieldErrors.password}
                        required
                        autoComplete="new-password"
                        disabled={loading}
                    />
                    <Input
                        label="Повторите пароль"
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        error={fieldErrors.passwordConfirm}
                        required
                        autoComplete="new-password"
                        disabled={loading}
                    />
                    {error && <div className={styles.error}>{error}</div>}
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </Button>
                </form>
                <div className={styles.footer}>
                    Уже есть аккаунт? <Link to="/login" className={styles.link}>Войти</Link>
                </div>
            </Card>
        </div>
    );
}
