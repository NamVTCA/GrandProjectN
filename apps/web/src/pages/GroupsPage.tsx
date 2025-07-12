import React, { useEffect, useState } from 'react';
import api from '../services/api';
import GroupCard from '../features/groups/components/GroupCard';
import type { Group } from '../features/groups/components/GroupCard';
import { useToast } from '../components/common/Toast/ToastContext';

const GroupsPage: React.FC = () => {
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/groups/suggestions');
        setSuggestedGroups(response.data);
      } catch (error) {
        addToast('Lỗi khi tải gợi ý nhóm.', 'error');
      }
    };
    fetchSuggestions();
  }, [addToast]);

  return (
    <div className="groups-page">
      <h2>Gợi ý Nhóm cho bạn</h2>
      <div className="group-list">
        {suggestedGroups.map(group => (
          <GroupCard key={group._id} group={group} />
        ))}
      </div>
    </div>
  );
};

export default GroupsPage;
