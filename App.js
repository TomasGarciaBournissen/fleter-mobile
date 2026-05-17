import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <RootNavigator />
      </SocketProvider>
    </AuthProvider>
  );
}
