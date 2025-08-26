// File: src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Rightbar from '../components/layout/Rightbar';
import Header from '../components/layout/Header';
import './MainLayout.scss';
import ChatUnreadBridge from '../features/chat/components/ChatUnreadBridge';

const MainLayout: React.FC = () => {
  return (
    <div className="main-layout">
      {/* Bridge realtime: kết nối socket + join tất cả phòng, luôn sống ở mọi trang */}
      <ChatUnreadBridge />
      <Sidebar />
      <div className="content-wrapper">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <Rightbar />
    </div>
  );
};

export default MainLayout;
