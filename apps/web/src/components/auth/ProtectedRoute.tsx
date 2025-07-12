import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { token, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Đang tải...</div>; // Hoặc một component Spinner đẹp hơn
  }

  if (!token) {
    // Nếu không có token, chuyển hướng về trang đăng nhập
    return <Navigate to="/login" replace />;
  }

  if (!user?.hasSelectedInterests) {
    // Nếu đã đăng nhập nhưng chưa chọn sở thích, chuyển hướng
    return <Navigate to="/select-interests" replace />;
  }

  // Nếu mọi thứ ổn, hiển thị nội dung của route được yêu cầu
  return <Outlet />;
};

export default ProtectedRoute;
