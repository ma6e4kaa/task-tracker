import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { apiFetch } from '../api/client';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { TaskTable, Task } from '../components/ui/TaskTable';
import styles from './MyTasksPage.module.css';

type Tab = 'assigned' | 'reported';

export function MyTasksPage() {
    const [activeTab, setActiveTab] = useState<Tab>('assigned');
    const [search, setSearch] = useState('');

    const { data: tasks, loading, error } = useApi<Task[]>(`/api/me/tasks/${activeTab}`);

    const handleDelete = async (taskId: number) => {
        if (window.confirm('Удалить задачу?')) {
            const task = tasks?.find(t => t.id === taskId);
            if (task && task.project) {
                await apiFetch(`/api/projects/${task.project.id}/tasks/${taskId}`, { method: 'DELETE' });
                window.location.reload();
            }
        }
    };

    const filteredTasks = tasks?.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <div className={styles.wrapper}>
            <Card>
                <div className={styles.header}>
                    <h1 className={styles.title}>Мои задачи</h1>
                    <div className={styles.searchBox}>
                        <Input
                            label=""
                            placeholder="Поиск по названию..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.segmentedControl}>
                    <button
                        className={`${styles.segment} ${activeTab === 'assigned' ? styles.activeSegment : ''}`}
                        onClick={() => setActiveTab('assigned')}
                    >
                        Входящие
                    </button>
                    <button
                        className={`${styles.segment} ${activeTab === 'reported' ? styles.activeSegment : ''}`}
                        onClick={() => setActiveTab('reported')}
                    >
                        Мои постановки
                    </button>
                </div>

                {loading && <div className={styles.message}>Загрузка...</div>}
                {error && <div className={styles.error}>{error}</div>}

                {!loading && !error && (
                    <TaskTable
                        tasks={filteredTasks}
                        onDelete={handleDelete}
                        showProjectColumn={true}
                        emptyMessage="У вас нет задач в этой категории"
                    />
                )}
            </Card>
        </div>
    );
}
