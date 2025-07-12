// File: src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.accessToken);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit}>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit">Đăng nhập</Button>
      </form>
      <div className="form-footer">
        <Link to="/forgot-password" className="link">Quên mật khẩu?</Link>
        <span>Chưa có tài khoản? <Link to="/register" className="link">Đăng ký ngay</Link></span>
      </div>
    </>
  );
};
export default LoginPage;