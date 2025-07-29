import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import './AdminPages.scss';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [reports, setReports] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    type: 'AVATAR_FRAME',
    price: 0,
    asset: null as File | null,
  });
  const [newInterest, setNewInterest] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
 const [newPackage, setNewPackage] = useState({
    packageId: '',
    name: '',
    coinsAmount: 0,
    price: 0,
    currency: 'VND',
  });
  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(err => console.error('Lỗi tải thống kê', err));
    api.get('/reports/all').then(res => setReports(res.data)).catch(err => console.error('Lỗi tải báo cáo', err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setNewItem(prev => ({ ...prev, asset: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateItem = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newItem.name);
      formData.append('description', newItem.description);
      formData.append('type', newItem.type);
      formData.append('price', newItem.price.toString());
      if (newItem.asset) formData.append('file', newItem.asset);

      await api.post('/admin/shop/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Tạo vật phẩm thành công!');
      setNewItem({ name: '', description: '', type: 'AVATAR_FRAME', price: 0, asset: null });
      setPreviewUrl(null);
    } catch (err) {
      
      console.log(`Lỗi tạo vật phẩm:${err}`);
    }
  };

  const handleCreateCoinPackage = async () => {
    try {
      await api.post('/coin-packages', newPackage);
      alert('Tạo gói coin thành công!');
      setNewPackage({
        packageId: '',
        name: '',
        coinsAmount: 0,
        price: 0,
        currency: 'VND',
      });
    } catch (err) {
      console.error('Lỗi tạo gói coin:', err);
    }
  };


  const handleCreateInterest = async () => {
    try {
      await api.post('/admin/interests', { name: newInterest });
      alert('Tạo sở thích thành công!');
      setNewInterest('');
    } catch (err) {
      console.error('Lỗi tạo sở thích:', err);
    }
  };

  return (
    <div className="admin-page">
      <h1>Bảng điều khiển Admin</h1>

      {/* Thống kê nhanh */}
      <div className="dashboard-grid">
        {['Người dùng', 'Bài viết', 'Chờ duyệt', 'Bị khóa'].map((label, i) => (
          <div className="stat-box" key={i}>
            <h3>{label}</h3>
            <p>{[stats.totalUsers, stats.totalPosts, stats.pendingModeration, stats.bannedUsers][i] || 0}</p>
          </div>
        ))}
      </div>

      {/* Tạo vật phẩm */}
      <div className="admin-section">
        <h2>Tạo vật phẩm</h2>
        <input type="text" placeholder="Tên vật phẩm" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
        <input type="text" placeholder="Mô tả" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
        <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
          <option value="AVATAR_FRAME">Khung avatar</option>
          <option value="PROFILE_BACKGROUND">Nền hồ sơ</option>
          <option value="PROFILE_EFFECT">Hiệu ứng hồ sơ</option>
          <option value="AVATAR_DECORATION">Trang trí avatar</option>
          <option value="NAMEPLATE_THEME">Bảng tên</option>
        </select>
        <input type="number" placeholder="Giá (VNĐ)" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: +e.target.value })} />
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {previewUrl && <img src={previewUrl} alt="Xem trước" style={{ width: 100, marginTop: 10 }} />}
        <button onClick={handleCreateItem}>Tạo vật phẩm</button>
      </div>

      {/* Tạo gói coin */}
       <div className="admin-section">
      <h2>Tạo gói coin</h2>
      <input
        type="text"
        placeholder="Mã gói (packageId)"
        value={newPackage.packageId}
        onChange={(e) => setNewPackage({ ...newPackage, packageId: e.target.value })}
      />
      <input
        type="text"
        placeholder="Tên gói"
        value={newPackage.name}
        onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
      />
      <input
        type="number"
        placeholder="Số lượng coin"
        value={newPackage.coinsAmount}
        onChange={(e) => setNewPackage({ ...newPackage, coinsAmount: +e.target.value })}
      />
      <input
        type="number"
        placeholder="Giá (VNĐ)"
        value={newPackage.price}
        onChange={(e) => setNewPackage({ ...newPackage, price: +e.target.value })}
      />
      <input
        type="text"
        placeholder="Đơn vị tiền tệ"
        value={newPackage.currency}
        onChange={(e) => setNewPackage({ ...newPackage, currency: e.target.value })}
      />
      <button onClick={handleCreateCoinPackage}>Tạo gói coin</button>
    </div>

      {/* Tạo sở thích */}
      <div className="admin-section">
        <h2>Tạo sở thích</h2>
        <input type="text" placeholder="Tên sở thích" value={newInterest} onChange={e => setNewInterest(e.target.value)} />
        <button onClick={handleCreateInterest}>Tạo sở thích</button>
      </div>

      {/* Danh sách báo cáo */}
      <div className="admin-section">
        <h2>Báo cáo người dùng</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>Người báo cáo</th>
              <th>Đối tượng</th>
              <th>Lý do</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report._id}>
                <td>{report.reporter?.username || 'Ẩn danh'}</td>
                <td>{report.targetType} - {report.targetId}</td>
                <td>{report.reason}</td>
                <td>{new Date(report.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
