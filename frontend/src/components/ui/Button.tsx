import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'danger' | 'success';

interface BaseProps {
    variant?: ButtonVariant;
    className?: string;
    children?: ReactNode;
}

interface AsButtonProps extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
    to?: never;
}

interface AsLinkProps extends BaseProps, Omit<LinkProps, 'className' | 'children'> {
    to: string;
    disabled?: boolean;
}

type ButtonProps = AsButtonProps | AsLinkProps;

export function Button(props: ButtonProps) {
    const { variant = 'primary', children, className = '', ...rest } = props;
    const classes = `${styles.button} ${styles[variant]} ${className}`.trim();

    if ('to' in props && props.to) {
        const { to, disabled, ...linkProps } = rest as AsLinkProps;
        return (
            <Link to={to} className={classes} {...linkProps}>
                {children}
            </Link>
        );
    }

    return (
        <button className={classes} {...(rest as AsButtonProps)}>
            {children}
        </button>
    );
}
