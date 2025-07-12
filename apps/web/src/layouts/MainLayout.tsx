// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
// import Header from '../components/common/Header'; // Sẽ tạo sau
// import Sidebar from '../components/common/Sidebar'; // Sẽ tạo sau

const MainLayout: React.FC = () => {
  return (
    <div className="main-layout">
      {/* <Sidebar /> */}
      <div className="content-wrapper">
        {/* <Header /> */}
        <main className="main-content">
          <Outlet /> {/* Đây là nơi nội dung của các trang con sẽ được hiển thị */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;