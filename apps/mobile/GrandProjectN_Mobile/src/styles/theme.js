// src/styles/theme.js
export const COLORS = {
  background: '#121212',
  primary: '#8b5cf6', // Màu tím chủ đạo
  secondary: '#d8b4fe', // Màu tím nhạt
  text: '#ffffff',
  placeholder: '#9ca3af',
  border: '#4b5563',
};

export const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    color: COLORS.text,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkText: {
    color: COLORS.secondary,
    marginTop: 10,
  },
};