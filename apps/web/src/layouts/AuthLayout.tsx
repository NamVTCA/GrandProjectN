// File: src/layouts/AuthLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import './AuthLayout.scss';

const AuthLayout: React.FC = () => {
  return (
    <div className="auth-page">
      <div className="card">
        <div className="left">
          <h1>Chào mừng đến với SocialMedia.</h1>
          <p>Kết nối, chia sẻ và khám phá cộng đồng game thủ lớn mạnh. Hãy tham gia cùng chúng tôi ngay hôm nay!</p>
        </div>
        <div className="right">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;