import React from 'react';
import {Link, useParams} from 'react-router-dom';
import {useApi} from '../hooks/useApi';
import {Card} from '../components/ui/Card';
import styles from './ProjectDetailPage.module.css';

interface Project {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    owner: { id: number; email: string };
}

export function ProjectDetailPage() {
    const {id} = useParams<{ id: string }>();
    const {data: project, error, loading} = useApi<Project>(`/api/projects/${id}`);

    if (loading) return <div className={styles.wrapper}><Card>Загрузка...</Card></div>;
    if (error) return <div className={styles.wrapper}><Card>Ошибка: {error}</Card></div>;
    if (!project) return null;

    return (
        <div className={styles.wrapper}>
            <Card className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{project.name}</h1>
                    <Link to="/projects" className={styles.backLink}>← Назад</Link>
                </div>
                <p className={styles.description}>
                    {project.description || 'Без описания'}
                </p>
                <div className={styles.meta}>
                    <span><strong>Владелец:</strong> {project.owner.email}</span>
                    <span><strong>Создан:</strong> {new Date(project.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
            </Card>
        </div>
    );
}
