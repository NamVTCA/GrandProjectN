import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../../services/api';

// Define the User type based on the backend's /auth/me response
interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  coins: number;
  hasSelectedInterests: boolean;
  globalRole: 'USER' | 'MODERATOR' | 'ADMIN';

  friends: string[]; // ✅ THÊM DÒNG NÀY

  currentGame?: {
    igdbId: string;
    name: string;
    boxArtUrl: string;
  };
}


// Define the shape of the context
interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  }, []);

  const fetchUser = useCallback(async () => {
    if (token) {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error("Auth token is invalid or expired. Logging out.", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

const login = (newToken: string) => {
  setToken(newToken);
  localStorage.setItem('authToken', newToken);
  api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  fetchUser(); // gọi ngay
};


  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, isLoading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
