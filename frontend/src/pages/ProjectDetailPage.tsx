import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import styles from './ProjectDetailPage.module.css';
import { useAuth } from '../context/AuthContext';
import { ProjectTasksTab } from './project/ProjectTasksTab';
import { ProjectMembersTab } from './project/ProjectMembersTab';

interface Project {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    owner: { id: number; email: string };
}

type Tab = 'tasks' | 'members';

export function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { data: project, error, loading } = useApi<Project>(`/api/projects/${id}`);
    const [activeTab, setActiveTab] = useState<Tab>('tasks');

    if (loading) return <div className={styles.wrapper}><Card>Загрузка...</Card></div>;
    if (error) return <div className={styles.wrapper}><Card>Ошибка: {error}</Card></div>;
    if (!project) return null;

    const isOwner = project.owner.email === user?.email;

    return (
        <div className={styles.wrapper}>
            <div className={styles.topNav}>
                <Link to="/projects" className={styles.backLink}>← Назад к проектам</Link>
            </div>

            <Card className={styles.projectHeaderCard}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>{project.name}</h1>
                    {isOwner && (
                        <Link to={`/projects/${project.id}/edit`} className={styles.editBtn} title="Редактировать проект">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            <span>Редактировать</span>
                        </Link>
                    )}
                </div>

                {project.description && project.description.trim() !== '' && (
                    <p className={styles.description}>{project.description}</p>
                )}

                <div className={styles.meta}>
                    <span><strong>Владелец:</strong> {project.owner?.email}</span>
                    <span><strong>Создан:</strong> {new Date(project.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
            </Card>

            <div className={styles.segmentedControl}>
                <button
                    className={`${styles.segment} ${activeTab === 'tasks' ? styles.activeSegment : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    Задачи
                </button>
                <button
                    className={`${styles.segment} ${activeTab === 'members' ? styles.activeSegment : ''}`}
                    onClick={() => setActiveTab('members')}
                >
                    Участники
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'tasks' && (
                    <Card>
                        <ProjectTasksTab />
                    </Card>
                )}

                {activeTab === 'members' && (
                    <Card>
                        <ProjectMembersTab
                            projectId={project.id}
                            ownerEmail={project.owner.email}
                        />
                    </Card>
                )}
            </div>
        </div>
    );
}
