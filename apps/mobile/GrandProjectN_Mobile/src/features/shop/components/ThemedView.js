// components/ThemedView.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const ThemedView = ({ children, style, ...props }) => {
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.backgroundComponent,
    borderRadius: theme.borderRadius.md
  }
});