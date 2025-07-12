import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUsers, FaComments, FaStore, FaBoxOpen } from 'react-icons/fa';
import './Sidebar.scss';

const navItems = [
  { path: '/', label: 'Trang chủ', icon: <FaHome /> },
  { path: '/groups', label: 'Nhóm', icon: <FaUsers /> },
  { path: '/chat', label: 'Chat', icon: <FaComments /> },
  { path: '/shop', label: 'Cửa hàng', icon: <FaStore /> },
  { path: '/inventory', label: 'Kho đồ', icon: <FaBoxOpen /> },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="logo"><h1>GrandProject</h1></div>
      <nav className="main-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
export default Sidebar;
