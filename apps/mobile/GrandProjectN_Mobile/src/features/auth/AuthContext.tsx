import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/apiClient';
import { User } from '../../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (userData: any) => Promise<void>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const { data } = await apiClient.get('/users/me');
          setUser({ ...data });
          setToken(storedToken);
        }
      } catch (e) {
        console.error('Failed to load token or token is invalid', e);
        await AsyncStorage.removeItem('userToken');
        delete apiClient.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { accessToken, user: loggedInUser } = response.data;
      setToken(accessToken);
      setUser({ ...loggedInUser });
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      await AsyncStorage.setItem('userToken', accessToken);
    } catch (error) {
      console.error('Sign in failed', error);
      throw error;
    }
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    delete apiClient.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('userToken');
  };

  const signUp = async (userData: any) => {
    try {
      await apiClient.post('/auth/register', userData);
    } catch (error) {
      console.error('Sign up failed', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, signUp, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};