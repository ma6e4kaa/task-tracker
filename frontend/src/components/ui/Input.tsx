import React, { useId } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
    const autoId = useId();
    const inputId = id || autoId;

    return (
        <div className={styles.field}>
            <label htmlFor={inputId} className={styles.label}>
                {label}
            </label>
            <input
                id={inputId}
                className={`${styles.input} ${error ? styles.inputError : ''} ${className || ''}`.trim()}
                {...props}
            />
            {error && <div className={styles.errorText}>{error}</div>}
        </div>
    );
}
