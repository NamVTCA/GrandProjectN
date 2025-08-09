import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { JoinRequest, GroupMember } from '../features/groups/types/Group';
import Button from '../components/common/Button';
import './GroupManagementPage.scss';

type ManagementTab = 'requests' | 'members';

const GroupManagementPage: React.FC = () => {
    const { id: groupId } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<ManagementTab>('requests');
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!groupId) return;
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'requests') {
                const response = await api.get(`/groups/${groupId}/requests`);
                setJoinRequests(response.data);
            } else if (activeTab === 'members') {
                const response = await api.get(`/groups/${groupId}/members`);
                setMembers(response.data);
            }
        } catch (err: any) {
            console.error(`Lỗi khi tải dữ liệu cho tab ${activeTab}:`, err);
            setError(err.response?.data?.message || 'Không thể tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    }, [groupId, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ✅ ĐÃ ĐIỀN ĐẦY ĐỦ LOGIC
    const handleApprove = async (requestId: string) => {
        try {
            await api.post(`/groups/${groupId}/requests/${requestId}/approve`);
            // Xóa yêu cầu khỏi danh sách ngay lập tức để UI mượt hơn
            setJoinRequests(current => current.filter(req => req._id !== requestId));
        } catch (error) {
            console.error("Lỗi khi chấp thuận yêu cầu:", error);
            alert("Đã có lỗi xảy ra.");
        }
    };

    // ✅ ĐÃ ĐIỀN ĐẦY ĐỦ LOGIC
    const handleReject = async (requestId: string) => {
        try {
            await api.post(`/groups/${groupId}/requests/${requestId}/reject`);
            // Xóa yêu cầu khỏi danh sách ngay lập tức
            setJoinRequests(current => current.filter(req => req._id !== requestId));
        } catch (error) {
            console.error("Lỗi khi từ chối yêu cầu:", error);
            alert("Đã có lỗi xảy ra.");
        }
    };

    const handleKickMember = async (memberUserId: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?")) {
            try {
                await api.delete(`/groups/${groupId}/members/${memberUserId}`);
                // Tải lại danh sách thành viên sau khi kick
                fetchData();
            } catch (error) {
                console.error("Lỗi khi xóa thành viên:", error);
                alert("Đã có lỗi xảy ra khi xóa thành viên.");
            }
        }
    };

    const renderTabContent = () => {
        if (loading) return <p className="page-status">Đang tải...</p>;
        if (error) return <p className="page-status error">{error}</p>;

        if (activeTab === 'requests') {
            return (
                <div className="list-container">
                    {joinRequests.length > 0 ? (
                        joinRequests.map(req => (
                            <div key={req._id} className="item-row">
                                <Link to={`/profile/${req.user.username}`} className="user-info">
                                    <img src={req.user.avatar || 'https://via.placeholder.com/48'} alt={req.user.username} />
                                    <strong>{req.user.username}</strong>
                                </Link>
                                <div className="actions">
                                    <Button onClick={() => handleApprove(req._id)}>Chấp nhận</Button>
                                    <Button onClick={() => handleReject(req._id)} variant="secondary">Từ chối</Button>
                                </div>
                            </div>
                        ))
                    ) : <p className="page-status">Không có yêu cầu tham gia nào.</p>}
                </div>
            );
        }

        if (activeTab === 'members') {
            return (
                <div className="list-container">
                    {members.map(member => (
                        <div key={member.user._id} className="item-row">
                            <Link to={`/profile/${member.user.username}`} className="user-info">
                                <img src={member.user.avatar || 'https://via.placeholder.com/48'} alt={member.user.username} />
                                <div className="name-role">
                                    <strong>{member.user.username}</strong>
                                    <span className="role-badge">{member.role}</span>
                                </div>
                            </Link>
                            <div className="actions">
                                {member.role !== 'OWNER' && (
                                    <>
                                        <Button variant="secondary" size="small">Đổi vai trò</Button>
                                        <Button variant="danger" size="small" onClick={() => handleKickMember(member.user._id)}>Kick</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="group-management-page">
            <h1>Quản lý Nhóm</h1>
            <div className="management-tabs">
                <button 
                    className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Yêu cầu ({joinRequests.length})
                </button>
                <button 
                    className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
                    onClick={() => setActiveTab('members')}
                >
                    Thành viên ({members.length})
                </button>
            </div>
            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default GroupManagementPage;