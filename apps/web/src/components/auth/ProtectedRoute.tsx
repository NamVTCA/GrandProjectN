import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    // Hiển thị một màn hình chờ đơn giản trong khi xác thực
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Đang tải...</div>;
  }

  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, chuyển hướng về trang login
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập nhưng chưa chọn sở thích, chuyển hướng
  if (!user?.hasSelectedInterests) {
    return <Navigate to="/select-interests" replace />;
  }

  // Nếu mọi thứ ổn, cho phép truy cập vào các trang con
  return <Outlet />;
};

export default ProtectedRoute;
