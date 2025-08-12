import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}>
        Đang tải...
      </div>
    );
  }

  // ❌ Chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🚫 Bị ban
  if (user?.accountStatus === "BANNED") {
    return <Navigate to="/banned" replace />;
  }

  // 👑 Admin → sang trang quản trị


  if (user && !user.hasSelectedInterests) {
    return <Navigate to="/select-interests" replace />;
  }

  // ✅ Đã đăng nhập và hợp lệ → cho phép vào trang con
  return <Outlet />;
};

export default ProtectedRoute;
