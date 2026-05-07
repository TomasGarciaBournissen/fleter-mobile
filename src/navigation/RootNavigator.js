import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import AuthStack from './AuthStack';
import ClienteStack from './ClienteStack';
import FleteroStack from './FleteroStack';

export default function RootNavigator() {
  const { user, loading } = useAuth();

  // Splash de carga mientras Firebase resuelve la sesión
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user && <AuthStack />}
      {user?.rol === 'CLIENTE' && <ClienteStack />}
      {(user?.rol === 'CONDUCTOR' || user?.rol === 'FLETERO') && <FleteroStack />}
    </NavigationContainer>
  );
}
