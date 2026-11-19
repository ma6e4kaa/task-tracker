import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ApiError, apiFetch} from '../api/client';
import {useAuth} from '../context/AuthContext';

interface UseApiResult<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

export function useApi<T>(url: string | null): UseApiResult<T> & { refetch: () => void } {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(!!url);
    const [trigger, setTrigger] = useState(0);

    const {logout} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!url) {
            setLoading(false);
            return;
        }

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
                    navigate('/login', {replace: true});
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
    }, [url, logout, navigate, trigger]);

    const refetch = () => setTrigger(prev => prev + 1);

    return {data, error, loading, refetch};
}
