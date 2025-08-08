// File: src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ToastProvider } from './components/common/Toast/ToastContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth & Onboarding Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SelectInterestsPage from './pages/SelectInterestsPage';
import ChatPageBot from './pages/ChatPageBot';

// Core Feature Pages
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import EditProfileUser from './features/profile/pages/EditProfileUser';
import GroupsPage from './pages/GroupsPage';
import CreateGroupPage from './pages/CreateGroupPage';
import GroupDetailPage from './pages/GroupDetailPage';
import GroupManagementPage from './pages/GroupManagementPage';
import ChatPage from './pages/ChatPage';
import ShopPage from './pages/ShopPage';
import InventoryPage from './pages/InventoryPage';

// Admin Pages
import UserManagementPage from './pages/admin/UserManagementPage';
import ContentManagementPage from './pages/admin/ContentManagementPage';

// Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import NotificationsPage from './pages/NotificationsPage';
import UserReportsPage from './pages/UserReportsPage';
import TopUpPage from './pages/TopUpPage';

// ======= Wrapper để force remount ProfilePage mỗi khi username thay đổi =======
const ProfilePageWithKey: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  return <ProfilePage key={username} />; // dùng username làm key
};
// ============================================================================

/**
 * Component xử lý logic định tuyến dựa trên trạng thái xác thực.
 */
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Hiển thị màn hình chờ trong khi kiểm tra token
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#fff',
          backgroundColor: '#1a1d21',
        }}
      >
        Đang tải ứng dụng...
      </div>
    );
  }

  return (
    <Routes>
      {/* === ADMIN ROUTES === */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/content" element={<ContentManagementPage />} />
        </Route>
      </Route>

      {/* === AUTHENTICATED USER ROUTES === */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />

          {/* Dùng wrapper có key để force remount */}
          <Route path="/top-up" element={<TopUpPage />} />
          <Route path="/profile/:username" element={<ProfilePageWithKey />} />
 <Route path="/user-reports/:userId" element={<UserReportsPage />} />
        <Route path="/admin/content-management" element={<ContentManagementPage />} />
          <Route path="/profile/:username/edit" element={<EditProfileUser />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
          <Route path="/groups/create" element={<CreateGroupPage />} />
          <Route path="/groups/:id/manage" element={<GroupManagementPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat-bot" element={<ChatPageBot />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* Route không cần layout nhưng vẫn cần xác thực */}
      <Route path="/select-interests" element={<SelectInterestsPage />} />

      {/* === PUBLIC ROUTES === */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* === FALLBACK ROUTE === */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
      />
    </Routes>
  );
};

/**
 * Component gốc của ứng dụng.
 */
const App: React.FC = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
