import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

export function Header() {
    const { isAuthenticated, isAdmin, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo}>Task Tracker</Link>

                {isAuthenticated && (
                    <nav className={styles.nav}>
                        <NavLink to="/profile" className={navLinkClass}>
                            Профиль
                        </NavLink>
                        {isAdmin && (
                            <NavLink to="/users" className={navLinkClass}>
                                Пользователи
                            </NavLink>
                        )}
                    </nav>
                )}

                <div className={styles.right}>
                    {isAuthenticated ? (
                        <>
                            <span className={styles.userEmail}>{user?.email ?? ''}</span>
                            <button onClick={handleLogout} className={styles.logoutButton}>
                                Выйти
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className={styles.loginLink}>Войти</Link>
                    )}
                </div>
            </div>
        </header>
    );
}
