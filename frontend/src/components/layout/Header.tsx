import React from 'react';
import {Link, NavLink, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import styles from './Header.module.css';
import {Button} from "../ui/Button";

export function Header() {
    const {isAuthenticated, isAdmin, user, logout} = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinkClass = ({isActive}: { isActive: boolean }) =>
        isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo}>Task Tracker</Link>

                {isAuthenticated && (
                    <nav className={styles.nav}>
                        <NavLink to="/projects" className={navLinkClass}>Проекты</NavLink>
                        {isAdmin && (
                            <NavLink to="/users" className={navLinkClass}>Пользователи</NavLink>
                        )}
                    </nav>
                )}

                <div className={styles.right}>
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/profile" className={navLinkClass}>{user?.email ?? ''}</NavLink>
                            <Button variant={'danger'} onClick={handleLogout}>
                                Выйти
                            </Button>
                        </>
                    ) : (
                        <Link to="/login" className={styles.loginLink}>Войти</Link>
                    )}
                </div>
            </div>
        </header>
    );
}
