import { createContext, useContext } from 'react';

import type { User, TokenResponse } from '../services/api';

interface AuthContextType {
    isAuth: boolean;
    user: User | null;
    login: (tokenResponse: TokenResponse) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
