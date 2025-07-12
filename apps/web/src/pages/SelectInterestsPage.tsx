// File: src/pages/SelectInterestsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import Button from '../components/common/Button';
import './SelectInterestsPage.scss';

interface Interest {
  _id: string;
  name: string;
}

const SelectInterestsPage: React.FC = () => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/interests').then(res => setInterests(res.data));
  }, []);

  const handleToggleInterest = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size < 3) {
      alert('Vui lòng chọn ít nhất 3 sở thích.');
      return;
    }
    try {
      await api.patch('/users/me/interests', { interestIds: Array.from(selectedIds) });
      await fetchUser(); // Cập nhật lại user context
      navigate('/'); // Chuyển hướng về trang chủ
    } catch (error) {
      console.error('Lỗi khi lưu sở thích:', error);
    }
  };

  return (
    <div className="select-interests-page">
      <div className="container">
        <h1>Chào mừng bạn!</h1>
        <p>Hãy cho chúng tôi biết bạn quan tâm đến điều gì để có những gợi ý tốt nhất.</p>
        <div className="interests-grid">
          {interests.map(interest => (
            <button
              key={interest._id}
              className={`interest-tag ${selectedIds.has(interest._id) ? 'selected' : ''}`}
              onClick={() => handleToggleInterest(interest._id)}
            >
              {interest.name}
            </button>
          ))}
        </div>
        <Button onClick={handleSubmit} disabled={selectedIds.size < 3}>
          Tiếp tục (Chọn ít nhất 3)
        </Button>
      </div>
    </div>
  );
};
export default SelectInterestsPage;