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
  const handleAction = async (
    userId: string,
    action: 'warn' | 'suspend' | 'ban' | 'restore'
  ) => {
    let payload: any = {};

    if (action === 'warn' || action === 'suspend' || action === 'ban') {
      const reason = prompt(`Nhập lý do cho hành động "${action}":`);
      if (!reason) return;
      payload.reason = reason;
    }

    if (action === 'suspend') {
      const daysStr = prompt("Nhập số ngày tạm khóa:");
      const durationInDays = parseInt(daysStr || "0", 10);
      if (isNaN(durationInDays) || durationInDays <= 0) {
        alert("Số ngày không hợp lệ");
        return;
      }
      payload.durationInDays = durationInDays;
    }

    try {
      await api.post(
        action === 'restore'
          ? `/admin/users/${userId}/restore`
          : `/admin/users/${userId}/${action}`,payload  
        
      );
      fetchUsers();
    } catch (error) {
      console.error(`Lỗi khi thực hiện ${action}:`, error);
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
                    <button onClick={() => handleAction(user._id, 'restore')}>
    Khôi phục
  </button>

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