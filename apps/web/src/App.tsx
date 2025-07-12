import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';

// Import all real layouts and pages
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GroupsPage from './pages/GroupsPage';
import ChatPage from './pages/ChatPage';
import ShopPage from './pages/ShopPage';
import InventoryPage from './pages/InventoryPage';
import SelectInterestsPage from './pages/SelectInterestsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

/**
 * Component to handle routing logic based on authentication status.
 */
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show a loading indicator while checking for the token
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff', backgroundColor: '#1a1d21' }}>
        Đang tải ứng dụng...
      </div>
    );
  }

  return (
    <Routes>
      {/* Authenticated Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
        </Route>
        {/* Routes that are authenticated but don't need the main layout */}
        <Route path="/select-interests" element={<SelectInterestsPage />} />
      </Route>

      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      {/* Standalone Public Routes */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
    </Routes>
  );
};

/**
 * The root component of the application.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
