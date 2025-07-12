import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ToastContainer from './components/common/Toast/ToastContainer';
import GroupsPage from './pages/GroupsPage';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SelectInterestsPage from './pages/SelectInterestsPage';
import ProfilePage from './pages/ProfilePage';
import ShopPage from './pages/ShopPage';
import InventoryPage from './pages/InventoryPage';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="profile/:username" element={<ProfilePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="inventory" element={<InventoryPage />} />
            {/* Các route khác trong MainLayout */}
          </Route>
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Route cho trang xác thực không cần layout */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/select-interests" element={<SelectInterestsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
