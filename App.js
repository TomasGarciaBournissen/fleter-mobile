import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import RootNavigator from './src/navigation/RootNavigator';
// Registrar el task de GPS antes de que renderice el árbol de componentes
import './src/tasks/locationTask';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <RootNavigator />
      </SocketProvider>
    </AuthProvider>
  );
}
