import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.scss';

// Giả sử bạn có các icon dạng component
// import { HomeIcon, GroupIcon, ChatIcon, ShopIcon, InventoryIcon } from '../../assets/icons';

const navItems = [
  { path: '/', label: 'Trang chủ' /*, icon: <HomeIcon />*/ },
  { path: '/groups', label: 'Nhóm' /*, icon: <GroupIcon />*/ },
  { path: '/chat', label: 'Chat' /*, icon: <ChatIcon />*/ },
  { path: '/shop', label: 'Cửa hàng' /*, icon: <ShopIcon />*/ },
  { path: '/inventory', label: 'Kho đồ' /*, icon: <InventoryIcon />*/ },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <h1>GrandProject</h1>
      </div>
      <nav className="main-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                {/* {item.icon} */}
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

