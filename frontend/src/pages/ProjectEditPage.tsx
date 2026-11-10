import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { apiFetch } from '../api/client';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import styles from './ProjectFormPage.module.css';

interface Project {
    id: number;
    name: string;
    description: string | null;
}

export function ProjectEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: project, error: loadError, loading: isLoading } = useApi<Project>(`/api/projects/${id}`);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || '');
        }
    }, [project]);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            await apiFetch(`/api/projects/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ name, description }),
            });
            navigate(`/projects/${id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) return <div className={styles.wrapper}><Card>Загрузка...</Card></div>;
    if (loadError) return <div className={styles.wrapper}><Card>Ошибка: {loadError}</Card></div>;

    return (
        <div className={styles.wrapper}>
            <Card className={styles.card}>
                <h1 className={styles.title}>Редактировать проект</h1>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="Название"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={saving}
                    />
                    <div className={styles.textareaField}>
                        <label className={styles.label}>Описание</label>
                        <textarea
                            className={styles.textarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={saving}
                            rows={4}
                        />
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.actions}>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => navigate(`/projects/${id}`)}
                        >
                            Отменить
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
