// File: src/pages/CreateGroupPage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import type { CreateGroupDto, Interest } from "../features/groups/types/Group";
import { useToast } from "../components/common/Toast/ToastContext";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import "./CreateGroupPage.scss";

const CreateGroupPage: React.FC = () => {
  const [formData, setFormData] = useState<CreateGroupDto>({
    name: "",
    description: "",
    privacy: "public",
    interestIds: [],
  });

  const [allInterests, setAllInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // API gọi danh sách sở thích
  const getInterests = async (): Promise<Interest[]> => {
    const response = await api.get("/interests");
    return response.data;
  };

  // API tạo nhóm
  const createGroup = async (group: CreateGroupDto) => {
    const response = await api.post("/groups", group);
    return response.data;
  };

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const interests = await getInterests();
        setAllInterests(interests);
      } catch (error) {
addToast(
  "Không thể tải danh sách sở thích. Vui lòng thử lại sau.",
  "error"
);
      }
    };
    fetchInterests();
  }, [addToast]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterestToggle = (interestId: string) => {
    setFormData((prev) => {
      const newInterestIds = prev.interestIds?.includes(interestId)
        ? prev.interestIds.filter((id) => id !== interestId)
        : [...(prev.interestIds || []), interestId];
      return { ...prev, interestIds: newInterestIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
addToast("Vui lòng điền đầy đủ tên và mô tả nhóm.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const newGroup = await createGroup(formData);
      addToast(`Nhóm "${newGroup.name}" đã được tạo.`, "success");
      navigate(`/groups/${newGroup._id}`);
    } catch (error: any) {
      addToast(
        "Lỗi",
        error.response?.data?.message || "Có lỗi xảy ra khi tạo nhóm."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-group-page">
      <form onSubmit={handleSubmit} className="create-group-form">
        <h1>Tạo Nhóm Mới</h1>
        <p>Gắn kết cộng đồng và chia sẻ đam mê của bạn.</p>

        <div className="form-group">
          <label htmlFor="name">Tên nhóm</label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Mô tả</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="privacy">Quyền riêng tư</label>
          <select
            id="privacy"
            name="privacy"
            value={formData.privacy}
            onChange={handleChange}
          >
            <option value="public">Công khai</option>
            <option value="private">Riêng tư</option>
          </select>
        </div>

        <div className="form-group">
          <label>Sở thích (Tùy chọn)</label>
          <div className="interests-container">
            {allInterests.map((interest) => (
              <Button
                key={interest._id}
                type="button"
                variant={
                  formData.interestIds?.includes(interest._id)
                    ? "primary"
                    : "secondary"
                }
                onClick={() => handleInterestToggle(interest._id)}
                className="interest-tag"
              >
                {interest.name}
              </Button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="submit-btn"
        >
          {isLoading ? "Đang tạo..." : "Tạo Nhóm"}
        </Button>
      </form>
    </div>
  );
};

export default CreateGroupPage;
