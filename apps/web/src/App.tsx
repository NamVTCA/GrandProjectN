// File: src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SelectInterestsPage from './pages/SelectInterestsPage';
import ChatPageBot from './pages/ChatPageBot';
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
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import ContentManagementPage from './pages/admin/ContentManagementPage';
import NotificationsPage from './pages/NotificationsPage';
import UserReportsPage from './pages/UserReportsPage';
import TopUpPage from './pages/TopUpPage';

// Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import BannedPage from './pages/BannedPage';

// Wrapper để force remount ProfilePage
const ProfilePageWithKey: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  return <ProfilePage key={username} />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

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
          <Route path="/top-up" element={<TopUpPage />} />
          <Route path="/profile/:username/edit" element={<EditProfileUser />} />
          <Route path="/profile/:username" element={<ProfilePageWithKey />} />
          <Route path="/user-reports/:userId" element={<UserReportsPage />} />
          <Route path="/admin/content-management" element={<ContentManagementPage />} />
          
          
          {/* ================================================================== */}
          {/* ✅ SỬA LỖI TẠI ĐÂY: Đảm bảo thứ tự các route như sau */}
          {/* Route tĩnh (không có tham số) phải luôn nằm trên route động */}
          {/* ================================================================== */}
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/create" element={<CreateGroupPage />} /> {/* <-- PHẢI NẰM TRÊN */}
          <Route path="/groups/:id" element={<GroupDetailPage />} />     {/* <-- NẰM DƯỚI */}
          <Route path="/groups/:id/manage" element={<GroupManagementPage />} />
          {/* ================================================================== */}

          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat-bot" element={<ChatPageBot />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route path="/select-interests" element={<SelectInterestsPage />} />

      {/* === PUBLIC ROUTES === */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/banned" element={<BannedPage />} />

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

const App: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        Đang tải ứng dụng...
      </div>
    );
  }

  return <AppRoutes />;
};

export default App;
