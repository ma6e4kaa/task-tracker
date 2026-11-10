import React, {useState} from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {useApi} from '../hooks/useApi';
import {Card} from '../components/ui/Card';
import styles from './ProjectDetailPage.module.css';
import {useAuth} from '../context/AuthContext';
import {ProjectTasksTab} from './project/ProjectTasksTab';
import {ProjectMembersTab} from './project/ProjectMembersTab';
import { apiFetch } from '../api/client';
import { EditIcon, TrashIcon } from '../components/icons';
import {Button} from "../components/ui/Button";

interface Project {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    owner: { id: number; email: string };
}

type Tab = 'tasks' | 'members';

export function ProjectDetailPage() {
    const {id} = useParams<{ id: string }>();
    const {user} = useAuth();
    const navigate = useNavigate();
    const {data: project, error, loading} = useApi<Project>(`/api/projects/${id}`);
    const [activeTab, setActiveTab] = useState<Tab>('tasks');
    const [deleting, setDeleting] = useState(false);

    if (loading) return <div className={styles.wrapper}><Card>Загрузка...</Card></div>;
    if (error) return <div className={styles.wrapper}><Card>Ошибка: {error}</Card></div>;
    if (!project) return null;

    const isOwner = project.owner.email === user?.email;

    const handleDelete = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить этот проект? Все задачи и участники будут удалены безвозвратно.')) {
            return;
        }

        setDeleting(true);
        try {
            await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
            navigate('/projects');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Ошибка удаления');
            setDeleting(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.topNav}>
                <Link to="/projects" className={styles.backLink}>← Назад к проектам</Link>
            </div>

            <Card className={styles.projectHeaderCard}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>{project.name}</h1>
                    {isOwner && (
                        <div className={styles.buttons}>
                            <Link to={`/projects/${project.id}/edit`} className={styles.editBtn}
                                  title="Редактировать проект">
                                <EditIcon />
                                <span>Редактировать</span>
                            </Link>

                            <Button
                                variant={"danger"}
                                onClick={handleDelete}
                                className={styles.deleteBtn}
                                title="Удалить проект"
                                disabled={deleting}
                            >
                                <TrashIcon />
                                <span>{deleting ? 'Удаление...' : 'Удалить'}</span>
                            </Button>
                        </div>
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
                        <ProjectTasksTab/>
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
