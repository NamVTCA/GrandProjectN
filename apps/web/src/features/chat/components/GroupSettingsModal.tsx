import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { publicUrl } from '../../../untils/publicUrl';
import { addRoomMembers, kickRoomMember, uploadRoomAvatar } from '../../../services/chat';
import type { PickableUser } from './CreateGroupModal';
import type { ChatRoom, ChatParticipant } from '../types/Chat';

type Props = {
  open: boolean;
  meId: string;
  room: ChatRoom;
  friends: PickableUser[];
  onClose: () => void;
  onUpdated: (room: ChatRoom) => void;
};

const sx = {
  backdrop: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { width: 'min(680px, 92vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column' as const, background: '#1e1f24', border: '1px solid #2b2d33', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.5)', overflow: 'hidden', color: '#fff' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #2b2d33' },
  title: { margin: 0, fontSize: 18, fontWeight: 700 as const },
  close: { background: 'transparent', border: 0, width: 36, height: 36, borderRadius: 8, color: '#fff', fontSize: 20, cursor: 'pointer' },
  body: { padding: 16, overflowY: 'auto' as const },
  footer: { padding: '12px 16px', borderTop: '1px solid #2b2d33', display: 'flex', justifyContent: 'flex-end', gap: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 12 },
  sectionTitle: { margin: '16px 0 8px', fontWeight: 700, fontSize: 14, opacity: 0.9 },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #2b2d33', background: 'rgba(255,255,255,.04)', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  btnPrimary: { border: '1px solid transparent', background: '#6a5acd', color: '#fff' },
  btnDanger: { border: '1px solid rgba(255,75,75,.25)', color: '#ff8b8b', background: 'rgba(255,75,75,.06)' },
  btnDisabled: { pointerEvents: 'none' as const, opacity: 0.6 },
  friendsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px 10px', marginBottom: 8 },
  friend: { display: 'flex', alignItems: 'center', gap: 10, padding: 8, border: '1px solid #2b2d33', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,.03)' },
  friendPicked: { border: '1px solid #6a5acd', boxShadow: '0 0 0 2px rgba(106,90,205,.25) inset' },
  checkbox: { pointerEvents: 'none' as const },
  avatarSm: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' as const },
  avatarMd: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' as const },
  memberList: { listStyle: 'none', margin: 0, padding: 0 },
  memberRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, border: '1px solid #2b2d33', borderRadius: 10, background: 'rgba(255,255,255,.03)', marginTop: 8 },
  left: { display: 'flex', alignItems: 'center', gap: 10 },
  metaName: { fontWeight: 600 },
  metaRole: { marginTop: 2, fontSize: 12, opacity: 0.65 },
};

const GroupSettingsModal: React.FC<Props> = ({ open, meId, room, friends, onClose, onUpdated }) => {
  const [picking, setPicking] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);

  useEffect(() => { if (!open) { setPicking([]); setSearch(''); } }, [open]);

  // Esc để đóng
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Members hiện tại
  const members: ChatParticipant[] = useMemo(
    () => (room.members || []).map((m) => m.user),
    [room.members]
  );

  const createdById = (room as any)?.createdBy;
  const canKick = useCallback((uid: string) => uid !== meId && uid !== createdById, [meId, createdById]);

  const avatarSrc =
    (room.avatarUrl || room.avatar)
      ? publicUrl(room.avatarUrl || room.avatar || '')
      : '/images/default-group.png';

  // Danh sách bạn có thể thêm (lọc người đã là member)
  const candidates = useMemo(
    () => friends.filter((f) => !members.some((m) => m._id === f.id)),
    [friends, members]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((f) => f.username.toLowerCase().includes(q));
  }, [candidates, search]);

  if (!open) return null;

  return (
    <div style={sx.backdrop} onMouseDown={onClose}>
      <div
        style={sx.modal}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gs-title"
      >
        <div style={sx.header}>
          <h3 id="gs-title" style={sx.title}>Cài đặt nhóm</h3>
          <button style={sx.close} onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div style={sx.body}>
          {/* Avatar nhóm + đổi ảnh */}
          <div style={sx.row}>
            <img
              src={avatarSrc}
              style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/default-group.png'; }}
              alt="Group avatar"
            />
            <label>
              <span style={{ ...sx.btn, ...(uploading ? sx.btnDisabled : {}) }}>
                {uploading ? 'Đang tải...' : 'Đổi avatar'}
              </span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploading(true);
                    const updated = await uploadRoomAvatar(room._id, file);
                    onUpdated((updated as any)?.room ?? (updated as any));
                    alert('Đổi avatar nhóm thành công');
                  } catch (err) {
                    console.error('Upload avatar failed', err);
                    alert('Đổi avatar thất bại. Kiểm tra API /avatar.');
                  } finally {
                    setUploading(false);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </label>
          </div>

          {/* Thêm thành viên */}
          <h4 style={sx.sectionTitle}>Thêm thành viên</h4>

          <div style={{ marginBottom: 8 }}>
            <input
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid #2b2d33', background: 'rgba(255,255,255,.03)', color: '#fff', padding: '0 10px' }}
            />
          </div>

          <div style={sx.friendsGrid}>
            {filtered.length === 0 && (
              <div style={{ opacity: .7, padding: '8px 0', fontSize: 14, color: '#ccc' }}>
                Không còn bạn để thêm.
              </div>
            )}
            {filtered.map((f) => {
              const checked = picking.includes(f.id);
              return (
                <label
                  key={f.id}
                  style={{ ...(sx.friend as any), ...(checked ? sx.friendPicked : {}) }}
                  onClick={() => setPicking((p) => (checked ? p.filter((x) => x !== f.id) : [...p, f.id]))}
                >
                  <input type="checkbox" checked={checked} readOnly style={sx.checkbox} />
                  <img
                    style={sx.avatarSm}
                    src={f.avatar || '/images/default-user.png'}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/default-user.png'; }}
                    alt=""
                  />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{f.username}</span>
                </label>
              );
            })}
          </div>
          <button
            style={{ ...sx.btn, ...sx.btnPrimary, ...(adding || !picking.length ? sx.btnDisabled : {}) }}
            disabled={!picking.length || adding}
            onClick={async () => {
              try {
                setAdding(true);
                const updated = await addRoomMembers(room._id, picking);
                onUpdated((updated as any)?.room ?? (updated as any));
                setPicking([]);
                alert('Đã thêm thành viên');
              } catch (err) {
                console.error('Add members failed', err);
                alert('Thêm thành viên thất bại. Kiểm tra API /members.');
              } finally {
                setAdding(false);
              }
            }}
          >
            {adding ? 'Đang thêm...' : 'Thêm'}
          </button>

          {/* Danh sách thành viên hiện tại */}
          <h4 style={sx.sectionTitle}>Thành viên ({members.length})</h4>
          <ul style={sx.memberList}>
            {members.map((m, idx) => (
              <li key={m._id} style={{ ...(sx.memberRow as any), ...(idx === 0 ? { marginTop: 0 } : {}) }}>
                <div style={sx.left}>
                  <img
                    src={
                      publicUrl(
                        m.profile?.avatarUrl ||
                          (m as any).avatar ||
                          (m as any).imageUrl ||
                          (m as any).photo ||
                          (m as any).picture ||
                          ''
                      ) || '/images/default-user.png'
                    }
                    style={sx.avatarMd}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/default-user.png'; }}
                    alt=""
                  />
                  <div>
                    <div style={sx.metaName}>{m.username}</div>
                    {(room as any)?.createdBy === m._id && <div style={sx.metaRole}>Chủ nhóm</div>}
                    {meId === m._id && <div style={sx.metaRole}>Bạn</div>}
                  </div>
                </div>

                {canKick(m._id) && (
                  <button
                    style={{ ...sx.btn, ...sx.btnDanger, ...(kickingUserId === m._id ? sx.btnDisabled : {}) }}
                    disabled={kickingUserId === m._id}
                    onClick={async () => {
                      if (!confirm(`Kick ${m.username}?`)) return;
                      try {
                        setKickingUserId(m._id);
                        const updated = await kickRoomMember(room._id, m._id);
                        onUpdated((updated as any)?.room ?? (updated as any));
                        alert('Đã kick khỏi nhóm');
                      } catch (err) {
                        console.error('Kick member failed', err);
                        alert('Kick thất bại. Kiểm tra API /members/:userId');
                      } finally {
                        setKickingUserId(null);
                      }
                    }}
                  >
                    {kickingUserId === m._id ? 'Đang kick...' : 'Kick'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div style={sx.footer}>
          <button style={sx.btn} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
