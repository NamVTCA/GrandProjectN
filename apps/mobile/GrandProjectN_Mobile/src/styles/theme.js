// styles/theme.js
export const theme = {
  // Màu sắc
  colors: {
    primaryDark: '#1f5e47',
    primaryMain: '#2c7d5f',
    primaryAccent: '#6abf92',
    secondaryLight: '#a8d8a2',
    accentLight: '#e3f2a5',
    accentLighter: '#f1f8c9',
    primary: '#4a90e2',
    
    // Màu hệ thống
    backgroundBody: '#1a1d21',
    backgroundComponent: '#25282e',
    surfaceColor: '#363a41',
    bgDark: '#1e1e2f',
    grayDark: '#2d2d3a',
    grayMedium: '#4e4e5a',
    grayLight: '#b0b0b0',
    
    // Màu chữ
    textLight: '#f0f2f5',
    textSecondary: '#a9b3c1',
    
    // Màu chức năng
    error: '#e53e3e',
    success: '#38a169',
    primaryLight: '#e3f2fd'
  },

  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12
  },

  // Kích thước
  headerHeight: 60,

  // Shadows (React Native dùng elevation hoặc custom shadows)
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    cardHover: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5
    }
  }
};

// Utility functions tương tự như mixins
export const flexCenter = (direction = 'row') => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: direction
});

// Reset styles cho các component cơ bản
export const resetStyles = {
  view: {
    margin: 0,
    padding: 0
  },
  text: {
    margin: 0,
    padding: 0
  },
  button: {
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    borderWidth: 0
  }
};