import React from 'react';
import styles from './StatusBadge.module.css';

const STATUS_LABELS: Record<string, string> = {
    todo: 'К выполнению',
    in_progress: 'В работе',
    review: 'На проверке',
    done: 'Готово'
};

interface Props {
    status: string;
}

export function StatusBadge({ status }: Props) {
    return (
        <span className={`${styles.badge} ${styles[status] || styles.todo}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}
