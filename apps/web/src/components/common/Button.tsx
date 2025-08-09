import React from 'react';
import './Button.scss';

// ✅ BƯỚC 1: Mở rộng type để chấp nhận thêm các variant và size mới
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize; // Thêm prop 'size'
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium', // Đặt size mặc định
  className,
  ...props
}) => {
  // ✅ BƯỚC 2: Thêm class cho size vào chuỗi class CSS động
  // Ví dụ kết quả: "btn btn-danger btn-small"
  const buttonClass = `btn btn-${variant} btn-${size} ${className || ''}`.trim();

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

export default Button;