// src/components/layout/Header.tsx
import React from 'react';
import { FaSearch, FaBell } from 'react-icons/fa';
import { Link } from 'react-router-dom'; // 👈 Thêm dòng này
import './Header.scss';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input type="text" placeholder="Tìm kiếm..." />
      </div>

      <div className="user-actions">
        {/* Thêm icon notification */}
        <Link to="/notifications" className="notification-link">
          <FaBell className="icon" />
        </Link>
      </div>
    </header>
  );
};

export default Header;  
