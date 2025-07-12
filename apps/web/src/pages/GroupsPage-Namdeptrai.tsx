import React, { useEffect, useState } from 'react';
import api from '../services/api';
import GroupCard from '../features/groups/components/GroupCard';
import type { Group } from '../features/groups/components/GroupCard';
import { useToast } from '../components/common/Toast/ToastContext';
import './GroupsPage.scss';

const GroupsPage: React.FC = () => {
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/groups/suggestions');
        setSuggestedGroups(response.data);
      } catch (error) {
        addToast('Lỗi khi tải gợi ý nhóm.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [addToast]);

  if (loading) return <p>Đang tìm kiếm nhóm phù hợp...</p>;

  return (
    <div className="groups-page">
      <h1 className="page-title">Khám phá Nhóm</h1>
      <section>
        <h2>Gợi ý cho bạn</h2>
        <div className="group-list">
          {suggestedGroups.length > 0 ? (
            suggestedGroups.map(group => (
              <GroupCard key={group._id} group={group} />
            ))
          ) : (
            <p>Không tìm thấy nhóm nào phù hợp với sở thích của bạn.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default GroupsPage;
