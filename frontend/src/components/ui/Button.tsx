import React from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

export function Button({
                           variant = 'primary',
                           className,
                           children,
                           ...props
                       }: ButtonProps) {
    return (
        <button
            className={`${styles.button} ${styles[variant]} ${className || ''}`.trim()}
            {...props}
        >
            {children}
        </button>
    );
}
