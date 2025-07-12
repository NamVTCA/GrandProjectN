import React, { useState } from 'react';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Link } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err) {
      setMessage('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  return (
    <>
      <h2>Quên Mật khẩu</h2>
      {message ? <p className="form-message">{message}</p> : (
        <form onSubmit={handleSubmit}>
          <p>Nhập email của bạn để nhận link đặt lại mật khẩu.</p>
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit">Gửi</Button>
        </form>
      )}
       <div className="form-footer">
        <Link to="/login" className="link">Quay lại Đăng nhập</Link>
      </div>
    </>
  );
};
export default ForgotPasswordPage;