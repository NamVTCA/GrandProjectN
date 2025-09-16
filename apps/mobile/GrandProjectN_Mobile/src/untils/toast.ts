// File: src/utils/toast.ts
import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

export const showToast = (type: ToastType, message: string, description?: string) => {
  Toast.show({
    type,
    text1: message,
    text2: description,
    position: 'top',
    visibilityTime: 3000,
  });
};
