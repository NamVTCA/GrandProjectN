// components/ThemedText.js
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const ThemedText = ({ children, style, variant = 'body', ...props }) => {
  const textStyle = [
    styles.base,
    variant === 'secondary' && styles.secondary,
    variant === 'light' && styles.light,
    style
  ];

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    color: theme.colors.textLight,
    fontFamily: 'Inter'
  },
  secondary: {
    color: theme.colors.textSecondary
  },
  light: {
    color: theme.colors.textLight
  }
});