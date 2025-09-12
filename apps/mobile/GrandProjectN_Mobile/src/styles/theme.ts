// src/styles/theme.ts

export const colors = {
  background: '#111111', // Nền chính (đen)
  card: '#1E1E1E',       // Nền cho các card, input (xám đậm)
  text: '#FFFFFF',       // Chữ màu trắng
  textSecondary: '#AAAAAA', // Chữ phụ, icon (xám nhạt)
  primary: '#7E57C2',     // Màu nhấn chính (tím)
  secondary: '#EC407A',   // Màu nhấn phụ (hồng)
  error: '#FF5252',      // Màu báo lỗi
  success: '#4CAF50',    // Màu báo thành công
  border: '#333333',     // Màu đường viền
};

export const spacing = {
  small: 8,
  medium: 16,
  large: 24,
};

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
};