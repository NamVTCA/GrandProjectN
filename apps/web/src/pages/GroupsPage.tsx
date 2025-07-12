// File: src/pages/GroupsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import GroupCard from '../features/groups/components/GroupCard';
import type { Group } from '../features/groups/types/Group';
import './GroupsPage.scss';

const GroupsPage: React.FC = () => {
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/groups/suggestions');
      setSuggestedGroups(response.data);
    } catch (error) {
      console.error('Lỗi khi tải gợi ý nhóm.', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return (
    <div className="groups-page">
      <h1 className="page-title">Khám phá Nhóm</h1>
      <section>
        <h2>Gợi ý cho bạn</h2>
        {loading ? (
          <p className="page-status">Đang tìm kiếm nhóm phù hợp...</p>
        ) : (
          <div className="group-list">
            {suggestedGroups.length > 0 ? (
              suggestedGroups.map(group => (
                <GroupCard key={group._id} group={group} />
              ))
            ) : (
              <p className="page-status">Không tìm thấy nhóm nào phù hợp với sở thích của bạn.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default GroupsPage;