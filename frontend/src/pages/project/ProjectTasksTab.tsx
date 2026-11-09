import React from 'react';
import styles from './ProjectTasksTab.module.css';

export function ProjectTasksTab() {
    return (
        <div className={styles.emptyState}>
            <div className={styles.icon}>📋</div>
            <h3>Задач пока нет</h3>
            <p>Здесь будет отображаться список задач вашего проекта.</p>
        </div>
    );
}
