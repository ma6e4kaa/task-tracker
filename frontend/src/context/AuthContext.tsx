import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getToken, setToken, removeToken, apiFetch } from '../api/client';

interface AuthUser {
    email: string;
    roles: string[];
}

interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (token: string, user: AuthUser) => void;
    logout: () => void;
}

const USER_KEY = 'auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function setStoredUser(user: AuthUser | null): void {
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(USER_KEY);
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(() => getToken());
    const [user, setUserState] = useState<AuthUser | null>(() => getStoredUser());

    // Если токен есть, а user нет — загружаем /api/me
    useEffect(() => {
        if (token && !user) {
            apiFetch<AuthUser>('/api/me')
                .then((me) => {
                    setUserState(me);
                    setStoredUser(me);
                })
                .catch(() => {
                    // Токен протух или невалидный — чистим
                    removeToken();
                    setStoredUser(null);
                    setTokenState(null);
                    setUserState(null);
                });
        }
    }, [token, user]);

    const login = (newToken: string, newUser: AuthUser) => {
        setToken(newToken);
        setTokenState(newToken);
        setUserState(newUser);
        setStoredUser(newUser);
    };

    const logout = () => {
        removeToken();
        setTokenState(null);
        setUserState(null);
        setStoredUser(null);
    };

    const isAdmin = user?.roles.includes('ROLE_ADMIN') ?? false;

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isAuthenticated: !!token,
                isAdmin,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
