import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as groupApi from '../services/group.api';
import type { CreateGroupDto } from '../features/groups/types/GroupDto';
import Button from '../components/common/Button';
import './CreateGroupPage.scss';

const CreateGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');

  const createGroupMutation = useMutation({
    mutationFn: groupApi.createGroup,
    onSuccess: (newGroup) => {
      // Làm mới lại danh sách nhóm của tôi và gợi ý
      queryClient.invalidateQueries({ queryKey: ['groups', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['groups', 'suggestions'] });
      // Chuyển hướng đến trang chi tiết của nhóm vừa tạo
      navigate(`/groups/${newGroup._id}`);
    },
    onError: (error: any) => {
      alert(`Tạo nhóm thất bại: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Tên nhóm không được để trống.');
      return;
    }
    const groupData: CreateGroupDto = { name, description, privacy };
    createGroupMutation.mutate(groupData);
  };

  return (
    <div className="create-group-page">
      <form onSubmit={handleSubmit} className="create-group-form">
        <h1>Tạo nhóm mới</h1>
        <p>Kết nối với những người cùng sở thích và đam mê.</p>

        <div className="form-group">
          <label htmlFor="name">Tên nhóm</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Hội những người yêu game..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Mô tả (tùy chọn)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Giới thiệu về nhóm của bạn..."
          />
        </div>

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
