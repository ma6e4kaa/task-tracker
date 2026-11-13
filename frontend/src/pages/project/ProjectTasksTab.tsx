import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {apiFetch} from '../../api/client';
import {Button} from '../../components/ui/Button';
import {Input} from '../../components/ui/Input';
import {ActionButtons} from '../../components/ui/ActionButtons';
import styles from './ProjectTasksTab.module.css';
import {useAuth} from '../../context/AuthContext';
import {StatusBadge} from '../../components/ui/StatusBadge';
import {PriorityBadge} from '../../components/ui/PriorityBadge';

interface Task {
    id: number;
    title: string;
    status: string;
    priority: string;
    reporter: { id: number; email: string };
    assignee: { id: number; email: string } | null;
}

interface Props {
    projectId: number;
    ownerEmail: string;
}

const STATUS_LABELS: Record<string, string> = {
    todo: 'К выполнению',
    in_progress: 'В работе',
    review: 'На проверке',
    done: 'Готово'
};

export function ProjectTasksTab({projectId, ownerEmail}: Props) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const {user, isAdmin} = useAuth();
    const navigate = useNavigate();
    const isProjectOwner = user?.email === ownerEmail;

    useEffect(() => {
        apiFetch<Task[]>(`/api/projects/${projectId}/tasks`)
            .then(setTasks)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [projectId]);

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: number) => {
        if (window.confirm('Удалить задачу?')) {
            await apiFetch(`/api/projects/${projectId}/tasks/${id}`, {method: 'DELETE'});
            apiFetch<Task[]>(`/api/projects/${projectId}/tasks`).then(setTasks);
        }
    };

    if (loading) return <div className={styles.loading}>Загрузка задач...</div>;

    return (
        <div>
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Input
                        label=""
                        type="text"
                        placeholder="Поиск по названию..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button to={`/projects/${projectId}/tasks/new`}>
                    Добавить задачу
                </Button>
            </div>

            <table className={styles.table}>
                <thead>
                <tr>
                    <th>Название</th>
                    <th>Статус</th>
                    <th>Приоритет</th>
                    <th>Исполнитель</th>
                    <th className={styles.textRight}>Действия</th>
                </tr>
                </thead>
                <tbody>
                {filteredTasks.map(task => {
                    // Проверяем права на редактирование КОНКРЕТНОЙ задачи
                    const canEdit = isAdmin || isProjectOwner || task.reporter?.email === user?.email;

                    return (
                        <tr key={task.id}>
                            <td>{task.title}</td>
                            <td>
                                <StatusBadge status={task.status}/>
                            </td>
                            <td>
                                <PriorityBadge priority={task.priority}/>
                            </td>
                            <td>{task.assignee ? task.assignee.email : ''}</td>
                            <td className={styles.textRight}>
                                <ActionButtons
                                    onView={() => navigate(`/projects/${projectId}/tasks/${task.id}`)}
                                    onEdit={canEdit ? () => navigate(`/projects/${projectId}/tasks/${task.id}/edit`) : undefined}
                                    onDelete={canEdit ? () => handleDelete(task.id) : undefined}
                                />
                            </td>
                        </tr>
                    );
                })}
                {filteredTasks.length === 0 && (
                    <tr>
                        <td colSpan={5} className={styles.emptyState}>Задачи не найдены</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}
