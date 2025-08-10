import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../../services/api';

// Define the User type based on the backend's /auth/me response
// ✅ Sửa: thêm kiểu EquippedItem và equippedAvatarFrame để hiển thị khung
type EquippedItemType = 'AVATAR_FRAME' | 'PROFILE_BACKGROUND';
interface EquippedItem {
  _id: string;
  assetUrl: string;
  type: EquippedItemType;
}

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
  // ✅ THÊM: trường khung đang trang bị (được populate từ backend)
  equippedAvatarFrame?: EquippedItem | null;
}

// Define the shape of the context
interface AuthContextType {
  token: string | null;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>; // ← thêm
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

  // Logout: xóa token + user
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  }, []);

  // Fetch user từ /auth/me nếu có token
  // ✅ Sửa: gọi /users/me (đã populate equippedAvatarFrame ở backend)
  const fetchUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await api.get<User>('/users/me'); // <-- đổi endpoint
      setUser(response.data);
    } catch (error) {
      console.error("Auth token is invalid or expired. Logging out.", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    // nếu đã có token thì attach vào header và fetchUser
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchUser();
  }, [fetchUser, token]);

  // Login: lưu token + gọi fetchUser
  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    fetchUser();
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, isAuthenticated: !!token, isLoading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để dùng context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
