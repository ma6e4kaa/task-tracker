import React from "react";
import {useApi} from "../hooks/useApi";
import {Card} from "../components/ui/Card";
import styles from "./ProjectsPage.module.css";
import {Link} from "react-router-dom";
import {Button} from "../components/ui/Button";

interface Project {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    owner: {
        id: number;
        email: string;
    };
}

export function ProjectsPage() {
    const {data: projects, error, loading} = useApi<Project[]>('/api/projects');

    if (loading) return <div className={styles.wrapper}><Card>Загрузка...</Card></div>;
    if (error) return <div className={styles.wrapper}><Card>Ошибка: {error}</Card></div>;

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h1 className={styles.title}>Мои проекты</h1>
                <Link to="/projects/new">
                    <Button>Создать проект</Button>
                </Link>
            </div>

            {projects && projects.length === 0 ? (
                <Card>
                    <div className={styles.empty}>
                        У вас пока нет проектов. Создайте первый!
                    </div>
                </Card>
            ) : (
                <div className={styles.list}>
                    {projects?.map((project) => (
                        <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                            className={styles.projectLink}
                        >
                            <Card className={styles.projectCard}>
                                <div className={styles.topRow}>
                                    <h2 className={styles.projectName}>{project.name}</h2>
                                    <span className={styles.ownerEmail}>
                                        Владелец: {project.owner.email}
                                    </span>
                                </div>
                                {project.description && project.description.trim() !== '' && (
                                    <p className={styles.projectDesc}>
                                        {project.description}
                                    </p>
                                )}
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
