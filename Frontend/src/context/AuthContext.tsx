import React, { useState } from 'react';

import { AuthContext } from '../hooks/useAuth';

import type { User, TokenResponse as ApiTokenResponse } from '../services/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuth, setIsAuth] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return !!localStorage.getItem('token');
        }
        return false;
    });

    const [user, setUser] = useState<User | null>(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        }
        return null;
    });

    const login = (tokenResponse: ApiTokenResponse) => {
        setIsAuth(true);
        setUser(tokenResponse.user);
        localStorage.setItem('token', tokenResponse.accessToken);
        localStorage.setItem('user', JSON.stringify(tokenResponse.user));
    };

    const logout = () => {
        setIsAuth(false);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ isAuth, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};


