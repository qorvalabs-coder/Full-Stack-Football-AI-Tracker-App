import React, { useState, useEffect } from 'react';

import { AuthContext } from '../hooks/useAuth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuth, setIsAuth] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('isAuth') === 'true';
        }
        return false;
    });

    useEffect(() => {
        // Any other side effects can go here
    }, []);

    const login = () => {
        setIsAuth(true);
        localStorage.setItem('isAuth', 'true');
    };

    const logout = () => {
        setIsAuth(false);
        localStorage.removeItem('isAuth');
    };

    return (
        <AuthContext.Provider value={{ isAuth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};


