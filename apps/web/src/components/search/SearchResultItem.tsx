import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import api from '../../services/api';
import Button from '../common/Button';
import './SearchResultItem.scss'; // Sẽ tạo file này ngay sau đây

// Định nghĩa kiểu dữ liệu cho một item người dùng
interface UserResult {
    _id: string;
    username: string;
    avatar?: string;
    // Thêm các trạng thái quan hệ từ API tìm kiếm (sẽ nâng cấp sau)
    friendshipStatus?: 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
}

interface SearchResultItemProps {
    user: UserResult;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ user }) => {
    // State để quản lý trạng thái nút bấm ngay trên giao diện
    const [status, setStatus] = useState(user.friendshipStatus || 'NONE');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAddFriend = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsProcessing(true);
        try {
            await api.post(`/friends/request/${user._id}`);
            // Cập nhật lạc quan: đổi nút thành "Đã gửi" ngay lập tức
            setStatus('REQUEST_SENT');
        } catch (error) {
            console.error("Lỗi khi gửi lời mời kết bạn:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderAction = () => {
        switch (status) {
            case 'FRIENDS':
                return <Button variant="secondary" disabled>Bạn bè</Button>;
            case 'REQUEST_SENT':
                return <Button variant="secondary" disabled>Đã gửi lời mời</Button>;
            case 'REQUEST_RECEIVED':
                 return <Link to="/notifications"><Button variant="primary">Phản hồi</Button></Link>;
            default:
                return <Button variant="primary" onClick={handleAddFriend} disabled={isProcessing}>Kết bạn</Button>;
        }
    };

    return (
        <Link to={`/profile/${user.username}`} className="search-result-item">
            <div className="user-info">
                <img src={user.avatar || 'https://via.placeholder.com/40'} alt={user.username} />
                <span>{user.username}</span>
            </div>
            <div className="action-button" onClick={e => e.stopPropagation()}>
                {renderAction()}
            </div>
        </Link>
    );
};

export default SearchResultItem;