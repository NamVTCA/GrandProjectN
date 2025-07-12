import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const AdminRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Đang kiểm tra quyền truy cập...</div>;
  }

  // Nếu người dùng không phải là Admin, chuyển hướng họ về trang chủ
  if (user?.globalRole !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // Nếu là Admin, cho phép truy cập
  return <Outlet />;
};

export default AdminRoute;
