import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import api from "../services/api";
import GroupCard from "../features/groups/components/GroupCard";
import Button from "../components/common/Button";
import type { Group } from "../features/groups/types/Group";
import { useAuth } from "../features/auth/AuthContext";
import "./GroupsPage.scss";

const GroupsPage: React.FC = () => {
    const { user } = useAuth();
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [myGroupsRes, suggestionsRes] = await Promise.all([
                api.get("/groups/me"),
                api.get("/groups/suggestions")
            ]);

            const myGroupsData: Group[] = myGroupsRes.data;
            const suggestedGroupsData: Group[] = suggestionsRes.data;

            const myGroupIds = new Set(myGroupsData.map(g => g._id));
            const filteredSuggestions = suggestedGroupsData.filter(
                suggestion => !myGroupIds.has(suggestion._id)
            );

            setMyGroups(myGroupsData);
            setSuggestedGroups(filteredSuggestions);

        } catch (error) {
            console.error("Lỗi khi tải danh sách nhóm.", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGroupUpdate = () => {
        fetchData();
    };
    
    return (
        <div className="groups-page">
            {/* ✅ ĐÃ SỬA LỖI: Điền lại nội dung cho header */}
            <div className="page-header">
                <h1 className="page-title">Khám phá Nhóm</h1>
                <Link to="/groups/create" className="create-group-link">
                    <Button variant="primary">
                        <FaPlus /> <span>Tạo Nhóm Mới</span>
                    </Button>
                </Link>
            </div>

            {loading ? (
                <p className="page-status">Đang tải...</p>
            ) : (
                <>
                    <section>
                        <h2>Nhóm của bạn</h2>
                        <div className="group-list">
                            {myGroups.map((group) => (
                                <GroupCard 
                                    key={group._id} 
                                    group={group}
                                    isMember={true}
                                    isOwner={user?._id === group.owner?._id}
                                    onGroupUpdate={handleGroupUpdate}
                                />
                            ))}
                        </div>
                    </section>
                    <section>
                        <h2>Gợi ý cho bạn</h2>
                        <div className="group-list">
                            {suggestedGroups.map((group) => (
                                <GroupCard 
                                    key={group._id} 
                                    group={group} 
                                    isMember={false}
                                    isOwner={false}
                                    onGroupUpdate={handleGroupUpdate}
                                />
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default GroupsPage;