import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, fontSize, spacing, radius } from '../theme';
import AuthStack from './AuthStack';
import ClienteStack from './ClienteStack';
import FleteroStack from './FleteroStack';

function RolNoSoportado({ onLogout }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
      <Text style={{ fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>
        Acceso no disponible
      </Text>
      <Text style={{ fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl }}>
        Este rol solo tiene acceso desde la plataforma web.
      </Text>
      <TouchableOpacity
        onPress={onLogout}
        style={{ backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.xl }}
      >
        <Text style={{ fontSize: fontSize.body, fontWeight: '800', color: colors.textPrimary }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootNavigator() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const rolNoSoportado = user && !['CLIENTE', 'CONDUCTOR', 'FLETERO'].includes(user.rol);
  if (rolNoSoportado) {
    return <RolNoSoportado onLogout={logout} />;
  }

  return (
    <NavigationContainer>
      {!user && <AuthStack />}
      {user?.rol === 'CLIENTE' && <ClienteStack />}
      {(user?.rol === 'CONDUCTOR' || user?.rol === 'FLETERO') && <FleteroStack />}
    </NavigationContainer>
  );
}
