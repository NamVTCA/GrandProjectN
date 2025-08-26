import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getInviteCandidates, sendGroupInvites, type InviteCandidate } from '../../../services/group.api';
import { publicUrl } from '../../../untils/publicUrl';
import './InviteFriendsModal.scss';

type Props = {
  open: boolean;
  groupId: string;
  onClose: () => void;
  onSent?: (created: number) => void;
};

const FALLBACK_AVATAR = '/images/default-user.png';

// Lấy avatar an toàn từ nhiều dạng dữ liệu khác nhau
const getAvatarSrc = (u: any): string => {
  const raw =
    u?.avatar ??
    u?.avatarUrl ??
    u?.profile?.avatarUrl ??
    u?.imageUrl ??
    u?.photo ??
    u?.picture ??
    u?.user?.profile?.avatarUrl ??
    u?.user?.avatarUrl ??
    u?.user?.avatar ??
    u?.friend?.avatar ??
    '';

  return raw ? publicUrl(raw) : FALLBACK_AVATAR;
};

const InviteFriendsModal: React.FC<Props> = ({ open, groupId, onClose, onSent }) => {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<InviteCandidate[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setPicked(new Set());
    void load('');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void load(q), 350);
    return () => clearTimeout(t);
  }, [q, open]);

  async function load(keyword: string) {
    try {
      setLoading(true);
      const data = await getInviteCandidates(groupId, keyword);
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setPicked(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  async function send() {
    if (picked.size === 0) return;
    try {
      setSending(true);
      const res = await sendGroupInvites({ groupId, inviteeIds: Array.from(picked) });
      onSent?.(res?.created ?? 0);
      onClose();
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div className="cgx-backdrop" onClick={onClose}>
      <div className="cgx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cgx-header">
          <h3>Mời bạn bè</h3>
          <button className="cgx-close" onClick={onClose}>×</button>
        </div>

        <div className="cgx-body">
          <div className="cgx-field">
            <input
              className="cgx-input"
              placeholder="Tìm kiếm bạn bè..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="cgx-empty">Đang tải...</div>
          ) : rows.length === 0 ? (
            <div className="cgx-empty">Không có ứng viên phù hợp.</div>
          ) : (
            <div className="cgx-list">
              {rows.map(u => (
                <label key={u.id} className="cgx-row">
                  <div className="cgx-user">
                    <img
                      src={getAvatarSrc(u)}
                      alt=""
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_AVATAR; }}
                    />
                    <div className="cgx-user-name">
                      <div className="line1">{u.fullName || u.username || 'Người dùng'}</div>
                      {u.username && <div className="muted">@{u.username}</div>}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={picked.has(u.id)}
                    onChange={() => toggle(u.id)}
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="cgx-footer">
          <button className="cgx-btn" onClick={onClose}>Đóng</button>
          <button className="cgx-btn primary" onClick={send} disabled={picked.size === 0 || sending}>
            {sending ? 'Đang gửi...' : `Gửi lời mời (${picked.size})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InviteFriendsModal;
