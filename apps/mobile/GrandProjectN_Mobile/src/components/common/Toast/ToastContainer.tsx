import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface Toast {
  id: number;
  message: string;
  type: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  const getToastStyle = (type: string) => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#28a745' };
      case 'error':
        return { backgroundColor: '#dc3545' };
      case 'info':
        return { backgroundColor: '#0077cc' };
      default:
        return { backgroundColor: '#333' };
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 1000,
    },
    toast: {
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      minWidth: 250,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    message: {
      color: '#fff',
      flex: 1,
    },
    closeButton: {
      marginLeft: 15,
    },
    closeText: {
      color: '#fff',
      fontSize: 20,
    },
  });

  return (
    <View style={styles.container}>
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          style={[styles.toast, getToastStyle(toast.type)]}
          entering={Animated.spring}
        >
          <Text style={styles.message}>{toast.message}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => removeToast(toast.id)}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
};

export default ToastContainer;