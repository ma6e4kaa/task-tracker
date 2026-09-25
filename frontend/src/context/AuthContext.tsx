import React, {createContext, useContext, useState, ReactNode} from 'react';
import {getToken, setToken, removeToken} from '../api/client';

interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(() => getToken());

    const login = (newToken: string) => {
        setToken(newToken);
        setTokenState(newToken);
    };

    const logout = () => {
        removeToken();
        setTokenState(null);
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                isAuthenticated: !!token,
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
