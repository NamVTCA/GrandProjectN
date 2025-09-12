// src/App.tsx

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './features/auth/AuthContext';
import AppNavigator from './navigation/AppNavigator';

const App = () => {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="light" />
    </AuthProvider>
  );
};

export default App;