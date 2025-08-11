// AdminDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import './AdminPages.scss';

interface Interest {
  _id: string;
  name: string;
}

interface ShopItem {
  _id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  assetUrl: string;
}

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [reports, setReports] = useState<any[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    type: 'AVATAR_FRAME',
    price: 0,
    asset: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newInterest, setNewInterest] = useState('');
  const [newPackage, setNewPackage] = useState({
    packageId: '',
    name: '',
    coinsAmount: 0,
    price: 0,
    currency: 'VND',
  });
  const [existingPackages, setExistingPackages] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, reportsRes, packagesRes, interestsRes, shopItemsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/reports/all'),
        api.get('/coin-packages'),
        api.get('/interests'),
        api.get('/admin/shop/items')
      ]);
      
      setStats(statsRes.data);
      setReports(reportsRes.data);
      setExistingPackages(packagesRes.data.map((p: any) => p.packageId));
      setInterests(interestsRes.data);
      setShopItems(shopItemsRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    }
  };

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
      fetchData();
    } catch (err) {
      console.error('Lỗi tạo vật phẩm:', err);
      alert('Lỗi khi tạo vật phẩm');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá vật phẩm này?')) return;
    try {
      await api.delete(`/admin/shop/items/${id}`);
      alert('Xoá vật phẩm thành công!');
      fetchData();
    } catch (err) {
      console.error('Lỗi xoá vật phẩm:', err);
      alert('Lỗi khi xoá vật phẩm');
    }
  };

  const handleCreateCoinPackage = async () => {
    try {
      await api.post('/coin-packages', newPackage);
      alert('Tạo gói coin thành công!');
      setNewPackage({ packageId: '', name: '', coinsAmount: 0, price: 0, currency: 'VND' });
      fetchData();
    } catch (err) {
      console.error('Lỗi tạo gói coin:', err);
    }
  };

  const handleCreateInterest = async () => {
    try {
      await api.post('/admin/interests', { name: newInterest });
      setNewInterest('');
      alert('Tạo sở thích thành công!');
      fetchData();
    } catch (err) {
      console.error('Lỗi tạo sở thích:', err);
    }
  };

  const handleDeleteInterest = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá sở thích này?')) return;
    try {
      await api.delete(`/admin/interests/${id}`);
      fetchData();
    } catch (err) {
      console.error('Lỗi xoá sở thích:', err);
    }
  };

  return (
    <div className="admin-page">
      <h1>Bảng điều khiển Admin</h1>

      <div className="dashboard-grid">
        {['Người dùng', 'Bài viết', 'Chờ duyệt', 'Bị khóa'].map((label, i) => (
          <div className="stat-box" key={i}>
            <h3>{label}</h3>
            <p>{[stats.totalUsers, stats.totalPosts, stats.pendingModeration, stats.bannedUsers][i] || 0}</p>
          </div>
        ))}
      </div>

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

        <h3 style={{ marginTop: '2rem' }}>Danh sách vật phẩm</h3>
        <table className="shop-items-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Loại</th>
              <th>Giá</th>
              <th>Hình ảnh</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {shopItems.map(item => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.price} VNĐ</td>
                <td>
                  {item.assetUrl && (
                    <img src={item.assetUrl} alt={item.name} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                  )}
                </td>
                <td>
                  <button 
                    onClick={() => handleDeleteItem(item._id)} 
                    className="delete-btn"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-section">
        <h2>Tạo gói coin</h2>
        <select
          value={newPackage.coinsAmount}
          onChange={(e) => {
            const coins = +e.target.value;
            const id = `packed_${coins}_coin`;
            const name = `Gói ${coins} Coins`;
            const price = (coins / 100) * 10000;
            setNewPackage({ packageId: id, name, coinsAmount: coins, price, currency: 'VND' });
          }}>
          <option value="">-- Chọn gói coin --</option>
          {[50, 100, 150, 200, 300, 500].map(amount => {
            const id = `packed_${amount}_coin`;
            const exists = existingPackages.includes(id);
            return (
              <option key={amount} value={amount} disabled={exists}>
                {`Gói ${amount} Coins - ${(amount / 100) * 10000} VNĐ`} {exists ? '(Đã tồn tại)' : ''}
              </option>
            );
          })}
        </select>
        <input type="text" placeholder="Mã gói" value={newPackage.packageId} readOnly />
        <input type="text" placeholder="Tên gói" value={newPackage.name} readOnly />
        <input type="number" placeholder="Số lượng coin" value={newPackage.coinsAmount} readOnly />
        <input type="number" placeholder="Giá (VNĐ)" value={newPackage.price} readOnly />
        <input type="text" placeholder="Đơn vị tiền tệ" value={newPackage.currency} readOnly />
        <button onClick={handleCreateCoinPackage} disabled={!newPackage.coinsAmount}>Tạo gói coin</button>
      </div>

      <div className="admin-section">
        <h2>Tạo sở thích</h2>
        <input type="text" placeholder="Tên sở thích" value={newInterest} onChange={e => setNewInterest(e.target.value)} />
        <button onClick={handleCreateInterest}>Tạo sở thích</button>

        <table className="interest-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {interests.map(interest => (
              <tr key={interest._id}>
                <td>{interest.name}</td>
                <td>
                  <button onClick={() => handleDeleteInterest(interest._id)} className="delete-btn">Xoá</button>
                </td>
              </tr>
            ))}
            {interests.length === 0 && (
              <tr><td colSpan={2}>Không có sở thích nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-section">
        <h2>Báo cáo người dùng</h2>
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report._id} className="report-card">
              <div className="report-header">
                <span className="reporter">{report.reporter?.username || 'Ẩn danh'}</span>
                <span className="report-date">{new Date(report.createdAt).toLocaleString()}</span>
              </div>
              <div className="report-target">
                <span className="target-type">{report.targetType}</span>
                <span className="target-id">{report.targetId}</span>
              </div>
              <div className="report-reason">
                <p>{report.reason}</p>
              </div>
            </div>
          ))}
          {reports.length === 0 && <p>Không có báo cáo nào.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;