import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

interface InputProps extends TextInputProps {}

const Input: React.FC<InputProps> = (props) => {
  const styles = StyleSheet.create({
    input: {
      width: '100%',
      padding: 14,
      borderWidth: 1,
      borderColor: '#2a2a2a',
      borderRadius: 8,
      fontSize: 16,
      backgroundColor: '#1a1a1a',
      color: '#fff',
    },
  });

  return (
    <TextInput
      style={styles.input}
      placeholderTextColor="#666"
      {...props}
    />
  );
};

export default Input;