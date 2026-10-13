import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface UseApiResult<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

export function useApi<T>(url: string): UseApiResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);

        apiFetch<T>(url)
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((err) => {
                if (cancelled) return;

                if (err instanceof ApiError && err.status === 401) {
                    logout();
                    navigate('/login', { replace: true });
                    return;
                }

                setError(err.message || 'Ошибка загрузки');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [url, logout, navigate]);

    return { data, error, loading };
}
