import React, { useState, useEffect } from 'react';
import { FaSearch, FaBell } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import SearchResultItem from '../search/SearchResultItem'; // ✅ Import component mới
import './Header.scss';

// Định nghĩa kiểu dữ liệu cho một item trong kết quả
interface SearchResultItem {
    _id: string;
    name: string;
    type: 'user' | 'post' | 'group';
    avatar?: string;
    username?: string;
}

const Header: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        const delayDebounceFn = setTimeout(() => {
            // ✅ LOGIC ĐÚNG: API trả về một mảng, chúng ta gán thẳng vào state
            api.get<SearchResultItem[]>(`/search?q=${query}`)
                .then(response => {
                    setResults(response.data);
                })
                .catch(err => console.error("Lỗi tìm kiếm:", err))
                .finally(() => setIsSearching(false));
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);
    
    const getLinkForResult = (item: SearchResultItem) => {
        switch (item.type) {
            case 'user':
                return `/profile/${item.username}`;
            case 'group':
                return `/groups/${item._id}`;
            case 'post':
                return `/posts/${item._id}`;
            default:
                return '/';
        }
    };

    return (
        <header className="header">
            <div 
                className="search-bar-container"
                onFocus={() => setShowResults(true)}
                // Dùng onBlur với setTimeout để có thể click vào kết quả
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
            >
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm bạn bè, bài viết, nhóm..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                
                {showResults && query.length > 1 && (
<div className="search-results">
                        {isSearching ? (
                            <div className="result-item status">Đang tìm...</div>
                        ) : results.length > 0 ? (
                            results.map(item => {
                                // ✅ SỬ DỤNG COMPONENT MỚI
                                if (item.type === 'user') {
                                    return <SearchResultItem key={item._id} user={item} />
                                }
                                // Render các loại kết quả khác (group, post) như cũ
                                return (
                                    <Link to={getLinkForResult(item)} key={`${item.type}-${item._id}`} className="result-item simple">
                                        {/* ... giao diện đơn giản cho group và post ... */}
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
         <div className="user-actions">
  <Link to="/user-reports/:userId" className="warning-link">
    <span className="warning-icon">!</span>
  </Link>
  <Link to="/notifications" className="notification-link">
    <FaBell className="icon" />
  </Link>
</div>

        </header>
    );
};

export default Header;