import React, { ReactNode } from 'react';
import { Header } from './Header';
import styles from './Layout.module.css';

export function Layout({ children }: { children: ReactNode }) {
    return (
        <div className={styles.layout}>
            <Header />
            <main className={styles.main}>{children}</main>
        </div>
    );
}
