// File: src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { username, email, password });
      navigate('/login', { state: { successMessage: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.' } });
    } catch (err) {
     alert(err);
    }
  };

  return (
    <>
      <h2>Tạo tài khoản</h2>
      <form onSubmit={handleSubmit}>
        <Input placeholder="Tên người dùng" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit">Đăng ký</Button>
      </form>
      <div className="form-footer">
        <span>Đã có tài khoản? <Link to="/login" className="link">Đăng nhập</Link></span>
      </div>
    </>
  );
};
export default RegisterPage;