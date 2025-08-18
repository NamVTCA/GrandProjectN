import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CreateGroupModal.scss';

export type PickableUser = {
  id: string;
  username: string;
  avatar?: string | null;
};

type Props = {
  open: boolean;
  friends: PickableUser[];
  onClose: () => void;
  onCreate: (payload: { name: string; memberIds: string[]; avatarFile?: File | null }) => Promise<void>;
};

const CreateGroupModal: React.FC<Props> = ({ open, friends, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends || [];
    return (friends || []).filter((f) => (f.username || '').toLowerCase().includes(q));
  }, [friends, search]);

  const toggle = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Chỉ chọn tệp hình ảnh');
      return;
    }
    const url = URL.createObjectURL(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(url);
  };

  const clearAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const submit = async () => {
    if (picked.length === 0) return;
    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), memberIds: picked, avatarFile });
      setName('');
      setPicked([]);
      clearAvatar();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="cgx-backdrop" onClick={onClose}>
      <div className="cgx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cgx-header">
          <h3>Tạo nhóm mới</h3>
          <button className="cgx-close" onClick={onClose} aria-label="close">×</button>
        </div>

        <div className="cgx-body">
          <label className="cgx-label">Ảnh nhóm (tuỳ chọn)</label>
          <div className="cgx-avatar-picker">
            {avatarPreview ? (
              <div className="cgx-avatar-preview">
                <img src={avatarPreview} alt="preview" />
                <button type="button" className="cgx-btn small" onClick={clearAvatar}>Xóa ảnh</button>
              </div>
            ) : (
              <>
                <input id="group-avatar-input" type="file" accept="image/*" onChange={onPickFile} />
                <label htmlFor="group-avatar-input" className="cgx-drop">
                  <span>Chọn tệp ảnh…</span>
                </label>
              </>
            )}
          </div>

          <label className="cgx-label">Tên nhóm (có thể bỏ trống)</label>
          <input
            className="cgx-input"
            placeholder="Nhập tên nhóm (tuỳ chọn)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="cgx-row">
            <label className="cgx-label">Thêm thành viên</label>
            <input
              className="cgx-input"
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="cgx-friends">
            {filtered.map((f) => {
              const checked = picked.includes(f.id);
              return (
                <label
                  key={f.id}
                  className={`cgx-friend ${checked ? 'picked' : ''}`}
                  onClick={() => toggle(f.id)}
                >
                  <input type="checkbox" checked={checked} readOnly />
                  <img className="cgx-avatar" src={f.avatar || '/images/default-user.png'} alt={f.username} />
                  <span className="cgx-name">{f.username}</span>
                </label>
              );
            })}
            {filtered.length === 0 && <div className="cgx-empty">Không có bạn nào khớp tìm kiếm.</div>}
          </div>
        </div>

        <div className="cgx-footer">
          <button onClick={onClose} className="cgx-btn">Hủy</button>
          <button className="cgx-btn primary" disabled={picked.length === 0 || submitting} onClick={submit}>
            {submitting ? 'Đang tạo...' : `Tạo nhóm (${picked.length})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateGroupModal;
