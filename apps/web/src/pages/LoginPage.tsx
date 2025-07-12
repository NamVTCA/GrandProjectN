import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import api from '../services/api';
import { useToast } from '../components/common/Toast/ToastContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setToken } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      setToken(response.data.accessToken);
      addToast('Đăng nhập thành công!', 'success');
      navigate('/'); // Chuyển hướng về trang chủ
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Đăng nhập thất bại.';
      addToast(errorMessage, 'error');
    }
  };

  return (
    <div>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">Đăng nhập</Button>
      </form>
    </div>
  );
};

export default LoginPage;
