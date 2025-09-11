// File: src/pages/admin/AdminTransactionsPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminTransactionsPage.scss';

// Define types for better type safety
interface CoinPackage {
  name: string;
  coinsAmount: number;
  price: number;
}

interface User {
  username: string;
  email: string;
}

interface Order {
  _id: string;
  user: User;
  coinPackage: CoinPackage;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentIntentId: string;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8888/api";

const AdminTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await fetch(`${API_BASE_URL}/payments/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể lấy dữ liệu giao dịch.');
      }

      const data: Order[] = await response.json();
      setTransactions(data);
    } catch (err: any) {
      console.error('Lỗi khi tải giao dịch:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-transactions-page">
        <h2>Quản lý Giao dịch</h2>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-transactions-page">
        <h2>Quản lý Giao dịch</h2>
        <div className="error-message">Lỗi: {error}</div>
        <button onClick={fetchTransactions}>Thử lại</button>
      </div>
    );
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
            <th>Hóa đơn</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction._id}>
              <td>{transaction.paymentIntentId}</td>
              <td>{transaction.user?.username} ({transaction.user?.email})</td>
              <td>{transaction.coinPackage?.name}</td>
              <td>${transaction.amount.toFixed(2)}</td>
              <td>
                <span className={`status ${transaction.status.toLowerCase()}`}>
                  {transaction.status}
                </span>
              </td>
              <td>{new Date(transaction.createdAt).toLocaleString()}</td>
              <td>
                {transaction.status === 'COMPLETED' ? (
                  <a
                    href={`${API_BASE_URL}/payments/receipt/${transaction._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tải về PDF
                  </a>
                ) : (
                  '-'
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