import React, { useState, useEffect } from 'react';
import { FaSearch, FaBell } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import SearchResultItem from '../search/SearchResultItem';
import { useAuth } from '../../features/auth/AuthContext';
import UserAvatar from '../common/UserAvatar';
import './Header.scss';

// Kiểu tối giản cho các kết quả
type BaseHit = { _id: string; name: string; type: 'user' | 'post' | 'group'; avatar?: string; username?: string };
type SearchHit = BaseHit; // (API trả gì ta nhận vậy cho nhẹ)

function isUserResult(x: SearchHit): x is Required<Pick<SearchHit, '_id' | 'type' | 'name' | 'avatar' | 'username'>> {
  return x.type === 'user' && typeof x.username === 'string' && x.username.length > 0;
}

const Header: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const t = setTimeout(() => {
      api.get<SearchHit[]>(`/search?q=${encodeURIComponent(query)}`)
        .then(res => setResults(res.data || []))
        .catch(err => console.error('Lỗi tìm kiếm:', err))
        .then(() => setIsSearching(false));
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  const getLinkForResult = (item: SearchHit) => {
    if (item.type === 'user' && item.username) return `/profile/${item.username}`;
    if (item.type === 'group') return `/groups/${item._id}`;
    if (item.type === 'post') return `/posts/${item._id}`;
    return '/';
  };

  return (
    <header className="header">
      {/* SEARCH */}
      <div
        className="search-bar-container"
        tabIndex={-1}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      >
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm bạn bè, bài viết, nhóm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
          />
        </div>

        {showResults && query.length > 1 && (
          <div className="search-results">
            {isSearching ? (
              <div className="result-item status">Đang tìm...</div>
            ) : results.length > 0 ? (
              results.map((item) => {
                if (isUserResult(item)) {
                  // item chắc chắn có username → truyền cho component user
                  return <SearchResultItem key={item._id} user={item} />;
                }
                // group / post
                return (
                  <Link
                    to={getLinkForResult(item)}
                    key={`${item.type}-${item._id}`}
                    className="result-item simple"
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })
            ) : (
              <div className="result-item status">Không tìm thấy kết quả.</div>
            )}
          </div>
        )}
      </div>

      {/* ACTIONS + CURRENT USER */}
      <div className="user-actions">
        <Link to="/user-reports/:userId" className="warning-link" title="Báo cáo">
          <span className="warning-icon">!</span>
        </Link>
        <Link to="/notifications" className="notification-link" title="Thông báo">
          <FaBell className="icon" />
        </Link>

        {user && (
          <Link
            to={user.username ? `/profile/${user.username}` : '/profile'}
            className="current-user"
            title={user.username}
          >
            <UserAvatar
              size={32}
              src={(user as any)?.avatarUrl || (user as any)?.avatar || (user as any)?.avatar_url}
            />
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
