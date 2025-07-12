import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      api.get(`/auth/verify-email?token=${token}`)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  return (
    <div className="verification-container">
      {status === 'verifying' && <h2>Đang xác thực email của bạn...</h2>}
      {status === 'success' && (
        <>
          <h2>Xác thực thành công!</h2>
          <p>Tài khoản của bạn đã được xác thực. Bây giờ bạn có thể đăng nhập.</p>
          <Link to="/login"><button>Đến trang Đăng nhập</button></Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h2>Xác thực thất bại!</h2>
          <p>Token không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.</p>
        </>
      )}
    </div>
  );
};

export default VerifyEmailPage;
