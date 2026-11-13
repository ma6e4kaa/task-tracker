import React from 'react';
import styles from './PriorityBadge.module.css';

const PRIORITY_LABELS: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    critical: 'Критический'
};

interface Props {
    priority: string;
}

export function PriorityBadge({ priority }: Props) {
    return (
        <span className={`${styles.badge} ${styles[priority] || styles.medium}`}>
            {PRIORITY_LABELS[priority] || priority}
        </span>
    );
}
