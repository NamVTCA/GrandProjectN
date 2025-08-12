import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import type { UserProfile } from '../types/UserProfile';
import styles from './EditProfileUser.module.scss';

const EditProfileUser: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [nameError, setNameError] = useState<string | null>(null); // ← trạng thái lỗi tên hiển thị

  // 1) Lấy về data ban đầu
  useEffect(() => {
    if (!paramUsername) return;
    api
      .get<UserProfile>(`/users/${paramUsername}`)
      .then(res => setProfile(res.data))
      .catch(err => {
        console.error('GET /users/:username error', err);
        alert('Không tải được hồ sơ.');
      });
  }, [paramUsername]);

  // 2) Thay đổi input text/textarea
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));

    // ✅ Kiểm tra riêng trường username: giới hạn 6–12 ký tự
    if (name === 'username') {
      const len = value.trim().length;
      if (len < 6 || len > 12) {
        setNameError('Tên hiển thị phải từ 6 đến 12 ký tự');
      } else {
        setNameError(null);
      }
    }
  };

  // 3) Chọn file avatar → preview
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      setProfile(prev => ({ ...prev, avatar: URL.createObjectURL(file) }));
    }
  };

  // 4) Chọn file cover → preview
  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);
    if (file) {
      setProfile(prev => ({ ...prev, coverImage: URL.createObjectURL(file) }));
    }
  };

  // Helper dựng URL public cho ảnh đã upload
  const publicUrl = (path: string) =>
    path.startsWith('http') ? path : `http://localhost:8888${path}`;

  // 5) Submit: patch text trước, sau đó upload avatar & cover
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ✅ Chặn submit nếu username không hợp lệ
    const nameLen = (profile.username?.trim().length ?? 0);
    if (nameLen < 6 || nameLen > 12) {
      alert('Tên hiển thị phải từ 6 đến 12 ký tự');
      return;
    }

    try {
      // PATCH username + bio
      const { data: updatedProfile } = await api.patch<UserProfile>(
        '/users/me',
        {
          username: profile.username,  // ← gửi đúng key
          bio: profile.bio,
        }
      );

      // PATCH avatar nếu có
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const { data: avatarRes } = await api.patch<UserProfile>(
          '/users/me/avatar',
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        updatedProfile.avatar = avatarRes.avatar;
      }

      // PATCH cover nếu có
      if (coverFile) {
        const fd = new FormData();
        fd.append('cover', coverFile);
        const { data: coverRes } = await api.patch<UserProfile>(
          '/users/me/cover',
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        updatedProfile.coverImage = coverRes.coverImage;
      }

      // Navigate về profile mới (paramUsername có thể đã thay đổi)
      navigate(`/profile/${updatedProfile.username}`, {
        state: { updatedProfile },
      });
    } catch (err: any) {
      console.error('Profile update error', err.response || err);
      alert(`Cập nhật thất bại: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Chỉnh sửa hồ sơ</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Cover upload */}
        <label>
          Ảnh bìa
          <input type="file" accept="image/*" onChange={handleCoverChange} />
        </label>
        {profile.coverImage && (
          <img
            src={
              profile.coverImage.startsWith('blob:')
                ? profile.coverImage
                : publicUrl(profile.coverImage)
            }
            alt="Cover preview"
            className={styles.previewCover}
          />
        )}

        {/* Avatar upload */}
        <label>
          Avatar
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </label>
        {profile.avatar && (
          <img
            src={
              profile.avatar.startsWith('blob:')
                ? profile.avatar
                : publicUrl(profile.avatar)
            }
            alt="Avatar preview"
            className={styles.previewAvatar}
          />
        )}

        {/* Display username */}
        <label>
          Tên hiển thị
          <input
            type="text"
            name="username"                       // ← đổi name
            value={profile.username || ''}
            onChange={handleChange}
            minLength={6}                          // ← HTML5 ràng buộc tối thiểu
            maxLength={12}                         // ← HTML5 ràng buộc tối đa
            required
          />
        </label>
        {nameError && <small style={{ color: 'salmon' }}>{nameError}</small>}

        {/* Bio */}
        <label>
          Tiểu sử
          <textarea
            name="bio"
            rows={4}
            value={profile.bio || ''}
            onChange={handleChange}
          />
        </label>

        {/* Buttons */}
        <div className={styles.buttons}>
          <button type="submit" className={styles.save} disabled={!!nameError}>
            Lưu
          </button>
          <button
            type="button"
            className={styles.cancel}
            onClick={() => navigate(-1)}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileUser;
