import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fontSize, spacing, radius } from '../theme';
import AuthStack from './AuthStack';
import ClienteStack from './ClienteStack';
import FleteroStack from './FleteroStack';
import GerenteStack from './GerenteStack';

function RolNoSoportado({ onLogout }) {
  const { colors } = useTheme();
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
        style={{ backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl }}
      >
        <Text style={{ fontSize: fontSize.body, fontWeight: '800', color: colors.onAccent }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootNavigator() {
  const { user, loading, logout } = useAuth();
  const { colors, isDark } = useTheme();

  // Tema de React Navigation derivado de la paleta activa (evita flashes blancos)
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary:    colors.primary,
      background: colors.background,
      card:       colors.surface1,
      text:       colors.textPrimary,
      border:     colors.line,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const rolNoSoportado = user && !['CLIENTE', 'CONDUCTOR', 'FLETERO', 'GERENTE'].includes(user.rol);
  if (rolNoSoportado) {
    return <RolNoSoportado onLogout={logout} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!user && <AuthStack />}
      {user?.rol === 'CLIENTE' && <ClienteStack />}
      {(user?.rol === 'CONDUCTOR' || user?.rol === 'FLETERO') && <FleteroStack />}
      {user?.rol === 'GERENTE' && <GerenteStack />}
    </NavigationContainer>
  );
}
