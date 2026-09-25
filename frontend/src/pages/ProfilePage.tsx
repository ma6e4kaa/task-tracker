import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface MeResponse {
    email: string;
    roles: string[];
}

export function ProfilePage() {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        apiFetch<MeResponse>('/api/me')
            .then(setMe)
            .catch((err) => setError(err.message));
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (error) return <div style={{ padding: 20, color: 'red' }}>Ошибка: {error}</div>;
    if (!me) return <div style={{ padding: 20 }}>Загрузка...</div>;

    return (
        <div style={{ maxWidth: 600, margin: '50px auto', padding: 20 }}>
            <h1>Профиль</h1>
            <p><strong>Email:</strong> {me.email}</p>
            <p><strong>Роли:</strong> {me.roles.join(', ')}</p>
            <button
                onClick={handleLogout}
                style={{ padding: '10px 20px', marginTop: 20 }}
            >
                Выйти
            </button>
        </div>
    );
}
