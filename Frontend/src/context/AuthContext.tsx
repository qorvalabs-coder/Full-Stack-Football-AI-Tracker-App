import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAuth: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
