import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import type { JoinRequest, GroupMember } from '../features/groups/types/Group';
import Button from '../components/common/Button';
import './GroupManagementPage.scss';

// Định nghĩa các tab có thể có
type ManagementTab = 'requests' | 'members';

const GroupManagementPage: React.FC = () => {
    const { id: groupId } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<ManagementTab>('requests');
    
    // State cho từng tab
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [members, setMembers] = useState<GroupMember[]>([]);
    
    const [loading, setLoading] = useState(true);

    // Hàm tải dữ liệu dựa trên tab đang hoạt động
    const fetchData = useCallback(async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            if (activeTab === 'requests') {
                const response = await api.get(`/groups/${groupId}/requests`);
                setJoinRequests(response.data);
            } else if (activeTab === 'members') {
                // Giả sử API endpoint để lấy thành viên là /groups/:id/members
                const response = await api.get(`/groups/${groupId}/members`);
                setMembers(response.data);
            }
        } catch (error) {
            console.error(`Lỗi khi tải dữ liệu cho tab ${activeTab}:`, error);
        } finally {
            setLoading(false);
        }
    }, [groupId, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Xử lý yêu cầu tham gia ---
    const handleApprove = async (requestId: string) => {
        try {
            await api.post(`/groups/${groupId}/requests/${requestId}/approve`);
            fetchData(); // Tải lại danh sách yêu cầu
        } catch (error) {
            console.error("Lỗi khi chấp thuận yêu cầu:", error);
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await api.post(`/groups/${groupId}/requests/${requestId}/reject`);
            fetchData(); // Tải lại danh sách yêu cầu
        } catch (error) {
            console.error("Lỗi khi từ chối yêu cầu:", error);
        }
    };

    // --- Component để render nội dung của tab ---
    const renderTabContent = () => {
        if (loading) {
            return <p>Đang tải danh sách...</p>;
        }

        if (activeTab === 'requests') {
            return (
                <div className="request-list">
                    {joinRequests.length > 0 ? (
                        joinRequests.map(req => (
                            <div key={req._id} className="request-item">
                                <div className="user-info">
                                    <img src={req.user.avatar || 'https://via.placeholder.com/48'} alt={req.user.username} />
                                    <strong>{req.user.username}</strong>
                                </div>
                                <div className="request-actions">
                                    <Button onClick={() => handleApprove(req._id)}>Chấp nhận</Button>
                                    <Button onClick={() => handleReject(req._id)} variant="secondary">Từ chối</Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Không có yêu cầu tham gia nào.</p>
                    )}
                </div>
            );
        }

        if (activeTab === 'members') {
            // Giao diện cho tab Thành viên sẽ được xây dựng ở đây
            return <p>Tính năng quản lý thành viên sẽ sớm được cập nhật.</p>;
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
                    Yêu cầu tham gia
                </button>
                <button 
                    className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
                    onClick={() => setActiveTab('members')}
                >
                    Thành viên
                </button>
            </div>
            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default GroupManagementPage;