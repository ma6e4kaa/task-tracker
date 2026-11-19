import React, { ReactNode } from 'react';
import styles from './Alert.module.css';

interface Props {
    type: 'error' | 'success' | 'warning';
    children: ReactNode;
}

export function Alert({ type, children }: Props) {
    return (
        <div className={`${styles.alert} ${styles[type]}`}>
            {children}
        </div>
    );
}
