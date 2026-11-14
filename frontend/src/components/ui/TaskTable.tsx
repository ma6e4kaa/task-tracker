import React from 'react';
import {Link, useNavigate, useLocation} from 'react-router-dom';
import {ActionButtons} from './ActionButtons';
import {StatusBadge} from './StatusBadge';
import {PriorityBadge} from './PriorityBadge';
import {useAuth} from '../../context/AuthContext';
import styles from './TaskTable.module.css';

export interface Task {
    id: number;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    project?: { id: number; name: string };
    reporter?: { id: number; email: string };
    assignee: { id: number; email: string } | null;
}

interface Props {
    tasks: Task[];
    onDelete?: (id: number) => void;
    showProjectColumn?: boolean;
    projectId?: number;
    emptyMessage?: string;
}

export function TaskTable({
                              tasks,
                              onDelete,
                              showProjectColumn = false,
                              projectId,
                              emptyMessage = 'Задачи не найдены'
                          }: Props) {
    const navigate = useNavigate();
    const {user, isAdmin} = useAuth();
    const location = useLocation();

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                <tr>
                    <th>Название</th>
                    {showProjectColumn && <th>Проект</th>}
                    <th>Дедлайн</th>
                    <th>Статус</th>
                    <th>Приоритет</th>
                    <th>Исполнитель</th>
                    <th>Постановщик</th>
                    <th className={styles.textRight}>Действия</th>
                </tr>
                </thead>
                <tbody>
                {tasks.map(task => {
                    const isReporter = task.reporter?.email === user?.email;
                    const canEdit = isAdmin || isReporter;

                    const baseUrl = projectId ? `/projects/${projectId}/tasks/${task.id}` :
                        task.project ? `/projects/${task.project.id}/tasks/${task.id}` : ``;

                    return (
                        <tr key={task.id}>
                            <td>{task.title}</td>
                            {showProjectColumn && (
                                <td>
                                    {task.project ? (
                                        <Link to={`/projects/${task.project.id}`} className={styles.projectLink}>
                                            {task.project.name}
                                        </Link>
                                    ) : ''}
                                </td>
                            )}
                            <td className={styles.dateCell}>
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : ''}
                            </td>
                            <td><StatusBadge status={task.status}/></td>
                            <td><PriorityBadge priority={task.priority}/></td>
                            <td>{task.assignee ? task.assignee.email : ''}</td>
                            <td>{task.reporter ? task.reporter.email : ''}</td>
                            <td className={styles.textRight}>
                                <ActionButtons
                                    onView={() => navigate(baseUrl)}
                                    onEdit={canEdit ? () => navigate(`${baseUrl}/edit`, { state: { from: location.pathname } }) : undefined}
                                    onDelete={canEdit && onDelete ? () => onDelete(task.id) : undefined}
                                />
                            </td>
                        </tr>
                    );
                })}
                {tasks.length === 0 && (
                    <tr>
                        <td colSpan={showProjectColumn ? 8 : 7} className={styles.emptyState}>
                            {emptyMessage}
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}
