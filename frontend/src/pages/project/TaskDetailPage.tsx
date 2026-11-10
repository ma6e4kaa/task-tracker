import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { apiFetch } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { EditIcon, TrashIcon } from '../../components/icons';
import styles from './TaskDetailPage.module.css';
import {Button} from "../../components/ui/Button";

const STATUS_LABELS: Record<string, string> = {
    todo: 'К выполнению',
    in_progress: 'В работе',
    review: 'На проверке',
    done: 'Готово'
};

const PRIORITY_LABELS: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    critical: 'Критический'
};

export function TaskDetailPage() {
    const { id, taskId } = useParams<{ id: string; taskId: string }>();
    const navigate = useNavigate();
    const { data: task, loading, error } = useApi<any>(`/api/projects/${id}/tasks/${taskId}`);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm('Удалить задачу?')) return;
        setDeleting(true);
        try {
            await apiFetch(`/api/projects/${id}/tasks/${taskId}`, { method: 'DELETE' });
            navigate(`/projects/${id}`);
        } catch (err) {
            alert('Ошибка удаления');
            setDeleting(false);
        }
    };

    if (loading) return <div className={styles.wrapper}><Card>Загрузка...</Card></div>;
    if (error || !task) return <div className={styles.wrapper}><Card>Ошибка</Card></div>;

    return (
        <div className={styles.wrapper}>
            <div className={styles.topNav}>
                <Link to={`/projects/${id}`} className={styles.backLink}>← Назад к проекту</Link>
            </div>

            <Card>
                <div className={styles.header}>
                    <h1 className={styles.title}>{task.title}</h1>
                    <div className={styles.actions}>
                        <Button to={`/projects/${id}/tasks/${taskId}/edit`}>
                            <EditIcon size={18} /> Редактировать
                        </Button>
                        <Button variant={"danger"} onClick={handleDelete} disabled={deleting}>
                            <TrashIcon size={18} /> {deleting ? 'Удаление...' : 'Удалить'}
                        </Button>
                    </div>
                </div>

                <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                        <span className={styles.label}>Статус</span>
                        <strong>{STATUS_LABELS[task.status] || task.status}</strong>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.label}>Приоритет</span>
                        <strong>{PRIORITY_LABELS[task.priority] || task.priority}</strong>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.label}>Исполнитель</span>
                        <strong>{task.assignee?.email || 'Не назначен'}</strong>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.label}>Дедлайн</span>
                        <strong>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : 'Нет'}</strong>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.label}>Автор задачи</span>
                        <strong>{task.reporter?.email}</strong>
                    </div>
                </div>

                <div className={styles.descriptionBox}>
                    <h3>Описание</h3>
                    <p className={styles.description}>{task.description || 'Без описания'}</p>
                </div>
            </Card>
        </div>
    );
}
