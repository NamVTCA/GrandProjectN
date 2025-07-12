import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // Import trang đăng ký
import HomePage from './pages/HomePage';       // Import trang chủ

function App() {
  return (
    <BrowserRouter>
      {/* Thêm một thanh điều hướng đơn giản để test */}
      <nav>
        <Link to="/">Trang chủ</Link> | <Link to="/login">Đăng nhập</Link> | <Link to="/register">Đăng ký</Link>
      </nav>
      <hr />

      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;