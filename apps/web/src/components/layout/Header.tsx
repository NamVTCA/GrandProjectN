import React from 'react';
import NotificationBell from '../../features/notifications/components/NotificationBell';
import { useAuth } from '../../features/auth/AuthContext';
import { Link } from 'react-router-dom';
import './Header.scss';

const Header: React.FC = () => {
  const { user, token } = useAuth();

  return (
    <header className="header">
      <div className="search-bar">
        {/* Thêm thanh tìm kiếm sau */}
      </div>
      <div className="user-actions">
        {token && user ? (
          <>
            <NotificationBell />
            <Link to={`/profile/${user.username}`} className="user-profile-link">
              {/* <img src={user.avatar} alt={user.username} /> */}
              <span>{user.username}</span>
            </Link>
          </>
        ) : (
          <Link to="/login">Đăng nhập</Link>
        )}
      </div>
    </header>
  );
};

export default Header;