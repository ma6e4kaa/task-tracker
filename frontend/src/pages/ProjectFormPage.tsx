import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import styles from './ProjectFormPage.module.css';

export function ProjectFormPage() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const project = await apiFetch<{ id: number }>('/api/projects', {
                method: 'POST',
                body: JSON.stringify({ name, description }),
            });
            navigate(`/projects/${project.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка создания');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <Card className={styles.card}>
                <h1 className={styles.title}>Новый проект</h1>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="Название"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <div className={styles.textareaField}>
                        <label className={styles.label}>Описание</label>
                        <textarea
                            className={styles.textarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={loading}
                            rows={4}
                        />
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.actions}>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Создание...' : 'Создать'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>
                            Отменить
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
