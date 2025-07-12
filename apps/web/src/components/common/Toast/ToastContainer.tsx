import React from 'react';
import { useToast } from './ToastContext';
import './Toast.scss';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

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