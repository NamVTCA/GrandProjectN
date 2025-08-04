import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import type { GroupDetail } from '../features/groups/types/Group';
import type { Post, ReactionType, PostVisibility } from '../features/feed/types/Post';
import GroupHeader from '../features/groups/components/GroupHeader';
import CreatePost from '../features/feed/components/CreatePost';
import PostCard from '../features/feed/components/PostCard';
import './GroupDetailPage.scss';

const GroupDetailPage: React.FC = () => {
    // --- STATE & HOOKS ---
    const { id: groupId } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessingJoin, setIsProcessingJoin] = useState<boolean>(false);

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN CHO BÀI VIẾT ---
    const handleReact = async (postId: string, reaction: ReactionType) => {
        try {
            const updatedPost = await api.post<Post>(`/posts/${postId}/react`, { type: reaction });
            setPosts(currentPosts =>
                currentPosts.map(p => p._id === postId ? updatedPost.data : p)
            );
        } catch (err) {
            console.error("Lỗi khi bày tỏ cảm xúc:", err);
        }
    };

    const handlePostDeleted = (postId: string) => {
        setPosts(currentPosts => currentPosts.filter(p => p._id !== postId));
        api.delete(`/posts/${postId}`).catch(err => {
            console.error("Lỗi khi xóa bài viết:", err);
        });
    };
    
    const handleRepost = (postId: string, content: string, visibility: PostVisibility) => {
        console.log(`Chia sẻ bài viết ${postId} với nội dung: ${content}`);
    };

    const handleCommentChange = (postId: string, change: number) => {
        setPosts(currentPosts =>
            currentPosts.map(p =>
                p._id === postId ? { ...p, commentCount: Math.max(0, p.commentCount + change) } : p
            )
        );
    };

    // --- CÁC HÀM TẢI DỮ LIỆU ---
    const fetchPosts = useCallback(async () => {
        if (!groupId) return;
        try {
            const response = await api.get<Post[]>(`/posts/group/${groupId}`);
            setPosts(response.data);
        } catch (err) {
            console.error("Lỗi khi tải bài viết của nhóm:", err);
        }
    }, [groupId]);

    useEffect(() => {
        if (!groupId) {
            setLoading(false);
            setError("Không tìm thấy ID của nhóm.");
            return;
        }
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [groupResponse] = await Promise.all([
                    api.get<GroupDetail>(`/groups/${groupId}`),
                    fetchPosts()
                ]);
                setGroup(groupResponse.data);
            } catch (err) {
                setError("Không thể tải thông tin nhóm. Nhóm có thể không tồn tại hoặc đã bị xóa.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [groupId, fetchPosts]);

    const isOwner = useMemo(() => {
        if (!user || !group) return false;
        return user._id === group.owner._id;
    }, [user, group]);

    const isMember = useMemo(() => {
        if (!user || !group) return false;
        return group.members.some(member => member.user?._id === user._id);
    }, [user, group]);

    const handleJoinLeaveClick = async () => {
        if (!group) return;
        setIsProcessingJoin(true);
        try {
            const endpoint = isMember ? `/groups/${group._id}/leave` : `/groups/${group._id}/join`;
            const response = await api.post<GroupDetail>(endpoint);
            setGroup(response.data);
        } catch (err) {
            console.error("Lỗi khi tham gia/rời khỏi nhóm:", err);
        } finally {
            setIsProcessingJoin(false);
        }
    };

    // ✅ HÀM MỚI: Xử lý khi có bài viết mới được tạo
    const handlePostCreated = (newPost: Post) => {
        // Thêm bài viết mới vào đầu danh sách hiện tại để cập nhật UI ngay lập tức
        setPosts(currentPosts => [newPost, ...currentPosts]);
    };
    
    // --- RENDER ---
    if (loading) {
        return <div className="page-loading">Đang tải...</div>;
    }
    if (error) {
        return <div className="page-loading error">{error}</div>;
    }
    if (!group) {
        return <div className="page-loading">Không tìm thấy nhóm.</div>;
    }

    return (
        <div className="group-detail-page">
            <GroupHeader
                group={group}
                isOwner={isOwner}
                isMember={isMember}
                isProcessing={isProcessingJoin}
                onJoinLeaveClick={handleJoinLeaveClick}
            />
            <div className="group-body">
                <div className="main-content">
                    {isMember && (
                        <CreatePost
                            context="group"
                            contextId={group._id}
                            onPostCreated={handlePostCreated} // <-- SỬ DỤNG HÀM MỚI
                        />
                    )}
                    <div className="post-list">
                        {posts.length > 0 ? (
                            posts.map(post => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    onReact={handleReact}
                                    onRepost={handleRepost}
                                    onPostDeleted={handlePostDeleted}
                                    onCommentAdded={() => handleCommentChange(post._id, 1)}
                                    onCommentDeleted={() => handleCommentChange(post._id, -1)}
                                />
                            ))
                        ) : (
                             <p className="page-status">Chưa có bài viết nào trong nhóm này. Hãy là người đầu tiên!</p>
                        )}
                    </div>
                </div>
                <div className="sidebar-content">
                    {/* ... (phần sidebar giữ nguyên) ... */}
                </div>
            </div>
        </div>
    );
};

export default GroupDetailPage;