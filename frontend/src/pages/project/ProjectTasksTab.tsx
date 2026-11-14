import React, {useState, useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {apiFetch} from '../../api/client';
import {Button} from '../../components/ui/Button';
import {Input} from '../../components/ui/Input';
import styles from './ProjectTasksTab.module.css';
import {TaskTable, Task} from "../../components/ui/TaskTable";

interface Props {
    projectId: number;
    ownerEmail: string;
}

export function ProjectTasksTab({projectId, ownerEmail}: Props) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const location = useLocation();

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
                <Button to={`/projects/${projectId}/tasks/new`} state={{from: location.pathname}}>
                    Добавить задачу
                </Button>
            </div>

            <TaskTable tasks={filteredTasks} projectId={projectId} onDelete={handleDelete}/>
        </div>
    );
}
