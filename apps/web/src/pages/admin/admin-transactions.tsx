import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminTransactionsPage.scss';

// Define the API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888/api';

const AdminTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Không tìm thấy mã thông báo xác thực. Vui lòng đăng nhập lại.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/payments/transactions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTransactions(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tải giao dịch.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleDownloadReceipt = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy mã thông báo xác thực. Vui lòng đăng nhập lại.');
      }

      // ✅ Thêm header Authorization vào yêu cầu tải PDF
      const response = await axios.get(`${API_BASE_URL}/payments/receipt/${orderId}`, {
        responseType: 'blob', // Quan trọng: Yêu cầu dữ liệu dưới dạng Blob
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Tạo một URL tạm thời cho Blob và kích hoạt tải xuống
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Đã xảy ra lỗi khi tải hóa đơn.');
    }
  };

  if (loading) {
    return <div className="loading">Đang tải giao dịch...</div>;
  }

  if (error) {
    return <div className="error-message">Lỗi: {error}</div>;
  }

  if (transactions.length === 0) {
    return <div className="no-data">Chưa có giao dịch nào được tạo.</div>;
  }

  return (
    <div className="admin-transactions-page">
      <h2>Quản lý Giao dịch</h2>
      <table>
        <thead>
          <tr>
            <th>ID Giao dịch</th>
            <th>Người dùng</th>
            <th>Gói Coin</th>
            <th>Số tiền</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction: any) => (
            <tr key={transaction._id}>
              <td>{transaction._id.substring(0, 8)}...</td>
              <td>{transaction.user.username}</td>
              <td>{transaction.coinPackage.name}</td>
              <td>${transaction.amount}</td>
              <td>
                <span className={`status ${transaction.status.toLowerCase()}`}>
                  {transaction.status}
                </span>
              </td>
              <td>{new Date(transaction.createdAt).toLocaleString()}</td>
              <td>
                {transaction.status === 'COMPLETED' ? (
                  <button onClick={() => handleDownloadReceipt(transaction._id)}>
                    Tải Hóa đơn
                  </button>
                ) : (
                  'N/A'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTransactionsPage;