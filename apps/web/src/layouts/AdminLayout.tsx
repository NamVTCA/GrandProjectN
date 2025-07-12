// File: src/layouts/AdminLayout.tsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaEdit } from 'react-icons/fa';
import './AdminLayout.scss';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="logo">
          <h2>Admin Panel</h2>
        </div>
        <nav>
          <ul>
            <li>
              <NavLink to="/admin/dashboard">
                <FaTachometerAlt /> Bảng điều khiển
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/users">
                <FaUsers /> Quản lý Người dùng
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/content">
                <FaEdit /> Quản lý Nội dung
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;