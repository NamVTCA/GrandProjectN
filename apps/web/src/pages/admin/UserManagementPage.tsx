// File: src/pages/admin/UserManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import './AdminPages.scss';

// Định nghĩa kiểu dữ liệu cho người dùng trong trang Admin
interface AdminUserView {
  _id: string;
  username: string;
  email: string;
  globalRole: 'USER' | 'MODERATOR' | 'ADMIN';
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  createdAt: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Logic cho các hành động (ban, suspend...) sẽ được thêm sau
  const handleAction = (userId: string, action: string) => {
    // Ví dụ: Mở modal xác nhận
    const reason = prompt(`Nhập lý do cho hành động "${action}" đối với người dùng ${userId}:`);
    if (reason) {
      console.log(`Thực hiện ${action} với lý do: ${reason}`);
      // Gọi API tương ứng ở đây
    }
  };

  if (loading) return <p>Đang tải danh sách người dùng...</p>;

  return (
    <div className="admin-page">
      <h1>Quản lý Người dùng</h1>
      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Tên người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tham gia</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td><span className={`role-badge ${user.globalRole.toLowerCase()}`}>{user.globalRole}</span></td>
                <td><span className={`status-badge ${user.accountStatus.toLowerCase()}`}>{user.accountStatus}</span></td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button onClick={() => handleAction(user._id, 'warn')}>Cảnh cáo</button>
                  <button onClick={() => handleAction(user._id, 'suspend')}>Tạm khóa</button>
                  <button onClick={() => handleAction(user._id, 'ban')}>Khóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage;