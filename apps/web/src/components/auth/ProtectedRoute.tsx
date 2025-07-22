import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // ✅ Đang xác thực → hiện loading
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Đang tải...
      </div>
    );
  }

  // ✅ Nếu chưa đăng nhập → chuyển hướng login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Nếu đã đăng nhập nhưng chưa chọn sở thích → chuyển hướng
  if (user && !user.hasSelectedInterests) {
    return <Navigate to="/select-interests" replace />;
  }

  // ✅ Đã đăng nhập và hợp lệ → cho phép vào trang con
  return <Outlet />;
};

export default ProtectedRoute;
