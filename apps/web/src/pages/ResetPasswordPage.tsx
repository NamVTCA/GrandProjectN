import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setMessage('Đặt lại mật khẩu thành công!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage('Token không hợp lệ hoặc đã hết hạn.');
    }
  };

  return (
    <>
      <h2>Đặt lại Mật khẩu</h2>
      {message ? <p className="form-message">{message}</p> : (
        <form onSubmit={handleSubmit}>
          <Input type="password" placeholder="Mật khẩu mới" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit">Xác nhận</Button>
        </form>
      )}
    </>
  );
};
export default ResetPasswordPage;