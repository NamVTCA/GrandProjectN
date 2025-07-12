// File: src/components/layout/Header.tsx
import React from 'react';
import { FaSearch } from 'react-icons/fa';
import './Header.scss';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input type="text" placeholder="Tìm kiếm..." />
      </div>
    </header>
  );
};
export default Header;