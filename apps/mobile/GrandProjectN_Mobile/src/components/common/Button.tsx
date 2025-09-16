
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: '#0077cc', borderColor: '#0077cc' };
      case 'secondary':
        return { backgroundColor: '#2a2a2a', borderColor: '#444' };
      case 'danger':
        return { backgroundColor: '#dc3545', borderColor: '#dc3545' };
      case 'ghost':
        return { backgroundColor: 'transparent', borderColor: 'transparent' };
      default:
        return { backgroundColor: '#0077cc', borderColor: '#0077cc' };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 12 };
      case 'medium':
        return { paddingVertical: 12, paddingHorizontal: 16 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 20 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 16 };
    }
  };

  const getTextColor = (): TextStyle => {
    switch (variant) {
      case 'ghost':
        return { color: '#0077cc' };
      case 'secondary':
        return { color: '#fff' };
      default:
        return { color: '#fff' };
    }
  };

  const styles = StyleSheet.create({
    button: {
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    text: {
      fontWeight: '600',
      fontSize: 16,
    },
    disabled: {
      opacity: 0.6,
    },
  });

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor().color} size="small" />
      ) : (
        <Text style={[styles.text, getTextColor(), textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;