import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Rightbar from '../components/layout/Rightbar';
import './MainLayout.scss';

const MainLayout: React.FC = () => {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <Rightbar />
    </div>
  );
};
export default MainLayout;