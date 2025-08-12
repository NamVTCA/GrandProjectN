import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as groupApi from '../services/group.api';
import { getInterests } from '../services/interest.api';
import type { CreateGroupDto } from '../features/groups/types/GroupDto';
import type { Interest } from '../features/groups/types/Group';
import Button from '../components/common/Button';
import './CreateGroupPage.scss';

const CreateGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State cho các trường của form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');

  // State để lưu ID của các sở thích đã chọn
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);

  // Dùng useQuery để lấy danh sách sở thích từ API
  const { data: allInterests = [], isLoading: isLoadingInterests } = useQuery({
    queryKey: ['interests'],
    queryFn: getInterests,
  });

  const createGroupMutation = useMutation({
    mutationFn: groupApi.createGroup,
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['groups', 'suggestions'] });
      navigate(`/groups/${newGroup._id}`);
    },
    onError: (error: any) => {
      alert(`Tạo nhóm thất bại: ${error.response?.data?.message || error.message}`);
    },
  });

  // Hàm xử lý khi người dùng chọn hoặc bỏ chọn một sở thích
  const handleInterestToggle = (interestId: string) => {
    setSelectedInterestIds(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId) // Nếu đã có -> Bỏ chọn
        : [...prev, interestId]               // Nếu chưa có -> Thêm vào
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Tên nhóm không được để trống.');
      return;
    }
    const groupData: CreateGroupDto = {
      name,
      description,
      privacy,
      interestIds: selectedInterestIds, // Gửi đi mảng ID đã chọn
    };
    createGroupMutation.mutate(groupData);
  };

  return (
    <div className="create-group-page">
      <form onSubmit={handleSubmit} className="create-group-form">
        <h1>Tạo nhóm mới</h1>
        <p>Kết nối với những người cùng sở thích và đam mê.</p>

        {/* Các trường Name và Description giữ nguyên */}
        <div className="form-group">
          <label htmlFor="name">Tên nhóm</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Hội những người yêu game..." required />
        </div>
        <div className="form-group">
          <label htmlFor="description">Mô tả (tùy chọn)</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Giới thiệu về nhóm của bạn..." />
        </div>

        {/* ----- BẮT ĐẦU: GIAO DIỆN CHỌN SỞ THÍCH TRỰC TIẾP ----- */}
        <div className="form-group">
          <label>Chọn sở thích (tùy chọn)</label>
          {isLoadingInterests ? (
            <p>Đang tải danh sách sở thích...</p>
          ) : (
            <div className="interest-selection-container">
              {allInterests.map(interest => (
                <label key={interest._id} className="interest-tag">
                  <input
                    type="checkbox"
                    checked={selectedInterestIds.includes(interest._id)}
                    onChange={() => handleInterestToggle(interest._id)}
                  />
                  {interest.name}
                </label>
              ))}
            </div>
          )}
        </div>
        {/* ----- KẾT THÚC: GIAO DIỆN CHỌN SỞ THÍCH ----- */}

        <div className="form-group">
          <label>Quyền riêng tư</label>
          <div className="privacy-options">
            <label>
              <input
                type="radio"
                name="privacy"
                value="public"
                checked={privacy === 'public'}
                onChange={() => setPrivacy('public')}
              />
              🌍 Công khai
            </label>
            <label>
              <input
                type="radio"
                name="privacy"
                value="private"
                checked={privacy === 'private'}
                onChange={() => setPrivacy('private')}
              />
              🔒 Riêng tư
            </label>
          </div>
        </div>

        <Button type="submit" disabled={createGroupMutation.isPending}>
          {createGroupMutation.isPending ? 'Đang tạo...' : 'Tạo nhóm'}
        </Button>
      </form>
    </div>
  );
};

export default CreateGroupPage;