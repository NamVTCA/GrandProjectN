// src/styles/theme.js
import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#0a351d', // Xanh lá đậm, gần như đen
  card: '#1e5f3a', // Xanh lá đậm
  primary: '#00d89c', // Xanh lá tươi sáng chủ đạo
  primaryDark: '#00b677', // Xanh lá đậm hơn
  secondary: '#90efd8', // Xanh lá nhạt
  text: '#ffffff',
  placeholder: '#a9c1b7',
  border: '#3c7f5a',
  lightBorder: '#5b8a72',
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    color: COLORS.text,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: COLORS.border,
    borderWidth: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  linkText: {
    color: COLORS.secondary,
    marginTop: 15,
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});