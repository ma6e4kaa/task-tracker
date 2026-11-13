import React, {useState} from 'react';
import {useNavigate, useParams, Link} from 'react-router-dom';
import {useApi} from '../../hooks/useApi';
import {apiFetch} from '../../api/client';
import {Card} from '../../components/ui/Card';
import {EditIcon, TrashIcon} from '../../components/icons';
import styles from './TaskDetailPage.module.css';
import {Button} from "../../components/ui/Button";
import {useAuth} from '../../context/AuthContext';
import {StatusBadge} from '../../components/ui/StatusBadge';
import {PriorityBadge} from '../../components/ui/PriorityBadge';

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
    const {id, taskId} = useParams<{ id: string; taskId: string }>();
    const navigate = useNavigate();
    const {data: task, loading, error} = useApi<any>(`/api/projects/${id}/tasks/${taskId}`);
    const {user, isAdmin} = useAuth();
    const [deleting, setDeleting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm('Удалить задачу?')) return;
        setDeleting(true);
        try {
            await apiFetch(`/api/projects/${id}/tasks/${taskId}`, {method: 'DELETE'});
            navigate(`/projects/${id}`);
        } catch (err) {
            alert('Ошибка удаления');
            setDeleting(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        setUpdatingStatus(true);
        try {
            await apiFetch(`/api/projects/${id}/tasks/${taskId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({status: newStatus})
            });
            window.location.reload();
        } catch (err) {
            alert('Ошибка смены статуса');
            setUpdatingStatus(false);
        }
    };

    if (loading) return <div className={styles.wrapper}><Card>Загрузка...</Card></div>;
    if (error || !task) return <div className={styles.wrapper}><Card>Ошибка</Card></div>;

    const isReporter = task.reporter?.email === user?.email;
    const isAssignee = task.assignee?.email === user?.email;
    const canEdit = isAdmin || isReporter;

    return (
        <div className={styles.wrapper}>
            <div className={styles.topNav}>
                <Link to={`/projects/${id}`} className={styles.backLink}>← Назад к проекту</Link>
            </div>

            <div className={styles.layout}>
                {/* ЛЕВАЯ КОЛОНКА: Контент */}
                <div className={styles.mainContent}>
                    <Card>
                        <div className={styles.header}>
                            <h1 className={styles.title}>{task.title}</h1>
                            {canEdit && (
                                <div className={styles.actions}>
                                    <Button to={`/projects/${id}/tasks/${taskId}/edit`}>
                                        <EditIcon size={18}/> Редактировать
                                    </Button>
                                    <Button variant={"danger"} onClick={handleDelete} disabled={deleting}>
                                        <TrashIcon size={18}/> {deleting ? 'Удаление...' : 'Удалить'}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className={styles.descriptionBox}>
                            <h3>Описание</h3>
                            <p className={styles.description}>{task.description || 'Без описания'}</p>
                        </div>

                        <div className={styles.actionFooter} style={{display: 'flex', gap: '10px'}}>

                            {/* 1. Исполнитель (или админ/владелец) видит кнопку "Начать", если задача в TO DO */}
                            {(isAssignee || isAdmin) && task.status === 'todo' && (
                                <Button variant="primary" onClick={() => handleStatusChange('in_progress')}
                                        disabled={updatingStatus}>
                                    {updatingStatus ? 'Обновление...' : 'Начать задачу'}
                                </Button>
                            )}

                            {/* 2. Исполнитель (или админ/владелец) видит кнопку "На проверку", если задача IN_PROGRESS */}
                            {(isAssignee || isAdmin) && task.status === 'in_progress' && (
                                <Button variant="success" onClick={() => handleStatusChange('review')}
                                        disabled={updatingStatus}>
                                    {updatingStatus ? 'Обновление...' : 'Отправить на проверку'}
                                </Button>
                            )}

                            {/* 3. Постановщик (или админ/владелец) видит кнопки проверки, если статус REVIEW */}
                            {(isReporter || isAdmin) && task.status === 'review' && (
                                <>
                                    <Button variant="success" onClick={() => handleStatusChange('done')}
                                            disabled={updatingStatus}>
                                        Подтвердить выполнение
                                    </Button>
                                    <Button variant="danger" onClick={() => handleStatusChange('in_progress')}
                                            disabled={updatingStatus}>
                                        Вернуть в работу
                                    </Button>
                                </>
                            )}
                        </div>
                    </Card>
                </div>

                <div className={styles.sidebar}>
                    <Card>
                        <h4 className={styles.sidebarTitle}>Детали</h4>

                        <div className={styles.metaList}>
                            <div className={styles.metaItem}>
                                <span className={styles.label}>Статус</span>
                                <StatusBadge status={task.status}/>
                            </div>

                            <div className={styles.metaItem}>
                                <span className={styles.label}>Приоритет</span>
                                <PriorityBadge priority={task.priority}/>
                            </div>

                            <div className={styles.metaItem}>
                                <span className={styles.label}>Дедлайн</span>
                                <strong>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : 'Нет'}</strong>
                            </div>

                            <div className={styles.metaItem}>
                                <span className={styles.label}>Исполнитель</span>
                                <strong>{task.assignee?.email || '—'}</strong>
                            </div>

                            <div className={styles.metaItem}>
                                <span className={styles.label}>Постановщик</span>
                                <strong>{task.reporter?.email}</strong>
                            </div>

                            <div className={styles.metaItem}>
                                <span className={styles.label}>Создана</span>
                                <span
                                    className={styles.dateText}>{new Date(task.createdAt).toLocaleString('ru-RU')}</span>
                            </div>

                            {task.completedAt && (
                                <div className={styles.metaItem}>
                                    <span className={styles.label}>Завершена</span>
                                    <span
                                        className={styles.dateText}>{new Date(task.completedAt).toLocaleString('ru-RU')}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
