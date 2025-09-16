import { registerRootComponent } from 'expo';
import React from 'react';
import App from './App';
import { AuthProvider } from './src/features/auth/AuthContext';

const Main = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

registerRootComponent(Main);
