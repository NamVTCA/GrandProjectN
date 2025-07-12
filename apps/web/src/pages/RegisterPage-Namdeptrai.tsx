import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/common/Toast/ToastContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { username, email, password });
      addToast('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.', 'success');
      navigate('/login');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Đăng ký thất bại.', 'error');
    }
  };

  return (
    <>
      <h2>Đăng ký</h2>
      <form onSubmit={handleSubmit}>
        <Input placeholder="Tên người dùng" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit">Đăng ký</Button>
      </form>
    </>
  );
};
export default RegisterPage;
