import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome, FaUsers, FaComments, FaStore, FaBoxOpen, FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../../features/auth/AuthContext';
import UserAvatar from '../common/UserAvatar';
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

  const profilePath = user?.username ? `/profile/${user.username}` : '/profile';

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo">
          <h1>Grand</h1>
        </div>
        <nav className="main-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  end
                >
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
          <NavLink to={profilePath} className="user-profile-link">
            <UserAvatar
              size={32}
              src={
                (user as any)?.avatarUrl ||
                (user as any)?.avatar ||
                (user as any)?.avatar_url
              }
            />
            <span className="username">{user.username || 'User'}</span>
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
