// import React, { createContext, useState, useEffect, ReactNode } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import apiClient from '../../api/apiClient';
// import { User } from '../../types';

// interface AuthContextType {
//   user: User | null;
//   token: string | null;
//   isLoading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signOut: () => void;
//   signUp: (userData: any) => Promise<void>;
//   setUser: (user: User | null) => void;
// }

// export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const loadToken = async () => {
//       try {
//         const storedToken = await AsyncStorage.getItem('userToken');
//         if (storedToken) {
//           apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
//           const { data } = await apiClient.get('/users/me');
//           setUser({ ...data });
//           setToken(storedToken);
//         }
//       } catch (e) {
//         console.error('Failed to load token or token is invalid', e);
//         await AsyncStorage.removeItem('userToken');
//         delete apiClient.defaults.headers.common['Authorization'];
//         setUser(null);
//         setToken(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     loadToken();
//   }, []);

//   const signIn = async (email: string, password: string) => {
//     try {
//       const response = await apiClient.post('/auth/login', { email, password });
//       const { accessToken, user: loggedInUser } = response.data;
//       setToken(accessToken);
//       setUser({ ...loggedInUser });
//       apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
//       await AsyncStorage.setItem('userToken', accessToken);
//     } catch (error) {
//       console.error('Sign in failed', error);
//       throw error;
//     }
//   };

//   const signOut = async () => {
//     setUser(null);
//     setToken(null);
//     delete apiClient.defaults.headers.common['Authorization'];
//     await AsyncStorage.removeItem('userToken');
//   };

//   const signUp = async (userData: any) => {
//     try {
//       await apiClient.post('/auth/register', userData);
//     } catch (error) {
//       console.error('Sign up failed', error);
//       throw error;
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, signUp, setUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type EquippedItemType = 'AVATAR_FRAME' | 'PROFILE_BACKGROUND';

interface EquippedItem {
  _id: string;
  assetUrl: string;
  type: EquippedItemType;
}

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  coins: number;
  hasSelectedInterests: boolean;
  globalRole: 'USER' | 'MODERATOR' | 'ADMIN';
  accountStatus: AccountStatus;
  friends: string[];
  currentGame?: {
    igdbId: string;
    name: string;
    boxArtUrl: string;
  };
  equippedAvatarFrame?: EquippedItem | null;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getTokenFromStorage = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token from storage:', error);
      return null;
    }
  };

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token from storage:', error);
    }
    delete api.defaults.headers.common['Authorization'];
  }, []);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await api.get<User>('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error("Auth token is invalid or expired. Logging out.", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = await getTokenFromStorage();
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } else {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token, fetchUser]);

  const login = async (newToken: string) => {
    setToken(newToken);
    try {
      await AsyncStorage.setItem('authToken', newToken);
    } catch (error) {
      console.error('Error saving token to storage:', error);
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    fetchUser();
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      setUser, 
      isAuthenticated: !!token, 
      isLoading, 
      login, 
      logout, 
      fetchUser 
    }}>
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