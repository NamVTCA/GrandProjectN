import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as groupApi from '../services/group.api';
import { useAuth } from '../features/auth/AuthContext';
import GroupCard from '../features/groups/components/GroupCard';
import Button from '../components/common/Button';
import { FaPlus } from 'react-icons/fa';
import './GroupsPage.scss';

const GroupsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query để lấy danh sách nhóm của tôi
  const { data: myGroups = [] } = useQuery({
    queryKey: ['groups', 'me'],
    queryFn: groupApi.getMyGroups,
  });

  // Query để lấy danh sách nhóm gợi ý
  const { data: suggestedGroups = [], isLoading } = useQuery({
    queryKey: ['groups', 'suggestions'],
    queryFn: groupApi.getSuggestedGroups,
  });

  // Hàm callback để tải lại dữ liệu khi có thay đổi
  const handleGroupUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['groups', 'me'] });
    queryClient.invalidateQueries({ queryKey: ['groups', 'suggestions'] });
  };

  return (
    <div className="groups-page">
      <header className="page-header">
        <h1>Khám phá Nhóm</h1>
        <Link to="/groups/create">
          <Button>
            <FaPlus /> Tạo nhóm mới
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <p className="page-status">Đang tải các nhóm...</p>
      ) : (
        <>
          <section>
            <h2>Nhóm của bạn ({myGroups.length})</h2>
            {myGroups.length > 0 ? (
              <div className="group-list">
                {myGroups.map((group) => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    isMember={true}
                    isOwner={user?._id === group.owner._id}
                    onGroupUpdate={handleGroupUpdate}
                  />
                ))}
              </div>
            ) : (
              <p>Bạn chưa tham gia nhóm nào.</p>
            )}
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
