// File: apps/web/src/components/common/Button/Button.tsx (Phiên bản nâng cấp)

import React from 'react';
import './Button.scss';

// Thêm một type để định nghĩa các loại variant mà nút có thể có
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant; // Cho phép nhận prop 'variant'
  size?: "small" | "medium" | "large";
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary', // Đặt giá trị mặc định là 'primary'
  className,          // Nhận cả className từ bên ngoài (ví dụ: "interest-tag")
  ...props
}) => {
  // ✅ LOGIC QUAN TRỌNG:
  // Tự động tạo chuỗi class hoàn chỉnh.
  // Ví dụ: nếu variant="secondary" và className="interest-tag",
  // kết quả sẽ là "btn btn-secondary interest-tag".
  const buttonClass = `btn btn-${variant} ${className || ''}`.trim();

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

export default Button;