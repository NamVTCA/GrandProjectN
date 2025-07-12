// File: src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUsers, FaComments, FaStore, FaBoxOpen, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../features/auth/AuthContext';
import './Sidebar.scss';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: <FaHome /> },
    { path: '/groups', label: 'Nhóm', icon: <FaUsers /> },
    { path: '/chat', label: 'Chat', icon: <FaComments /> },
    { path: '/shop', label: 'Cửa hàng', icon: <FaStore /> },
    { path: '/inventory', label: 'Kho đồ', icon: <FaBoxOpen /> },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="logo">
          <h1>Grand</h1>
        </div>
        <nav className="main-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className={({ isActive }) => (isActive ? 'active' : '')} end>
                  <span className="icon">{item.icon}</span>
                  <span className="label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="sidebar-footer">
        {user && (
            <NavLink to={`/profile/${user.username}`} className="user-profile-link">
                <img src={user.avatar || '[https://via.placeholder.com/40](https://via.placeholder.com/40)'} alt={user.username} className="user-avatar" />
                <span className="username">{user.username}</span>
            </NavLink>
        )}
        <button onClick={logout} className="logout-button" title="Đăng xuất">
            <FaSignOutAlt />
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
