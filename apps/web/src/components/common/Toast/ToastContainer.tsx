
// File: src/components/common/Toast/ToastContainer.tsx (Mới)
import React from 'react';
import './Toast.scss';

interface ToastContainerProps {
    toasts: { id: number; message: string; type: string }[];
    removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)}>&times;</button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;