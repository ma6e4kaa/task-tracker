import React, {useState, useEffect} from 'react';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import {apiFetch} from '../../api/client';
import {useApi} from '../../hooks/useApi';
import {Card} from '../../components/ui/Card';
import {Input} from '../../components/ui/Input';
import {Button} from '../../components/ui/Button';
import styles from './TaskFormPage.module.css';

interface Member {
    id: number;
    user: { id: number; email: string };
}

export function TaskFormPage() {
    const {id, taskId} = useParams<{ id: string; taskId: string }>();
    const isEdit = !!taskId;
    const navigate = useNavigate();
    const location = useLocation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('todo');
    const [priority, setPriority] = useState('medium');
    const [assigneeId, setAssigneeId] = useState<string>('');
    const [dueDate, setDueDate] = useState('');
    const [members, setMembers] = useState<Member[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const returnUrl = (location.state as any)?.from || `/projects/${id}`;

    // Загружаем участников для выпадающего списка
    useEffect(() => {
        apiFetch<Member[]>(`/api/projects/${id}/members`).then(setMembers);
    }, [id]);

    // Если редактируем — загружаем задачу. Если создаем — передаем null
    const {data: task, loading: taskLoading} = useApi<any>(isEdit ? `/api/projects/${id}/tasks/${taskId}` : null);

    useEffect(() => {
        if (task) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setStatus(task.status || 'todo');
            setPriority(task.priority || 'medium');
            setAssigneeId(task.assignee?.id?.toString() || '');
            // Безопасное извлечение даты
            if (task.dueDate) {
                setDueDate(task.dueDate.split('T')[0]);
            } else {
                setDueDate('');
            }
        }
    }, [task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            title,
            description,
            status,
            priority,
            assigneeId: assigneeId ? parseInt(assigneeId) : null,
            clearAssignee: !assigneeId && isEdit,
            dueDate: dueDate ? dueDate : null,
        };

        try {
            const url = isEdit ? `/api/projects/${id}/tasks/${taskId}` : `/api/projects/${id}/tasks`;
            await apiFetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                body: JSON.stringify(payload),
            });
            navigate(returnUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    if (isEdit && taskLoading) {
        return (
            <div className={styles.wrapper}>
                <Card className={styles.card}>
                    <div style={{textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)'}}>
                        Загрузка данных задачи...
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <Card className={styles.card}>
                <h1 className={styles.title}>{isEdit ? 'Редактировать задачу' : 'Новая задача'}</h1>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} required/>

                    <div className={styles.textareaField}>
                        <label className={styles.label}>Описание</label>
                        <textarea className={styles.textarea} value={description}
                                  onChange={(e) => setDescription(e.target.value)} rows={4}/>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.selectWrapper}>
                            <label className={styles.label}>Статус</label>
                            <select className={styles.select} value={status}
                                    onChange={(e) => setStatus(e.target.value)}>
                                <option value="todo">К выполнению</option>
                                <option value="in_progress">В работе</option>
                                <option value="review">На проверке</option>
                                <option value="done">Готово</option>
                            </select>
                        </div>

                        <div className={styles.selectWrapper}>
                            <label className={styles.label}>Приоритет</label>
                            <select className={styles.select} value={priority}
                                    onChange={(e) => setPriority(e.target.value)}>
                                <option value="low">Низкий</option>
                                <option value="medium">Средний</option>
                                <option value="high">Высокий</option>
                                <option value="critical">Критический</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.selectWrapper}>
                            <label className={styles.label}>Исполнитель</label>
                            <select className={styles.select} value={assigneeId}
                                    onChange={(e) => setAssigneeId(e.target.value)}>
                                <option value="">Не назначен</option>
                                {members.map(m => (
                                    <option key={m.user.id} value={m.user.id}>{m.user.email}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.selectWrapper}>
                            <label className={styles.label}>Дедлайн</label>
                            <input type="date" className={styles.input} value={dueDate}
                                   onChange={(e) => setDueDate(e.target.value)}/>
                        </div>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.actions}>
                        <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
                        <Button type="button" variant="danger"
                                onClick={() => navigate(returnUrl)}>Отменить</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
