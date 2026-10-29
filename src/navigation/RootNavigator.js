import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fontSize, spacing, radius } from '../theme';
import SplashScreen from '../screens/auth/SplashScreen';
import AuthStack from './AuthStack';
import OnboardingEmpresaStack from './OnboardingEmpresaStack';
import PymeStack from './PymeStack';
import FleteroStack from './FleteroStack';
import ConductorStack from './ConductorStack';
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

// Elige el stack según la sesión:
// sin sesión (o con un alta en curso) → entrada y alta
// cuenta de empresa sin empresa → registrar la empresa o sumarse con código
// conductor → ConductorStack · empresa → PymeStack (fase 3)
function Stacks({ user, altaEnCurso }) {
  if (!user || altaEnCurso) return <AuthStack />;
  if (user.rol === 'CLIENTE') return user.organizacion === null ? <OnboardingEmpresaStack /> : <PymeStack />;
  if (user.rol === 'CONDUCTOR') return <ConductorStack />;
  if (user.rol === 'FLETERO') return <FleteroStack />; // marketplace, dormido
  if (user.rol === 'GERENTE') return <GerenteStack />; // marketplace, dormido
  return null;
}

export default function RootNavigator() {
  const { user, loading, logout, altaEnCurso } = useAuth();
  const { colors, isDark } = useTheme();
  const [splashListo, setSplashListo] = useState(false);

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

  // El splash se queda hasta que termina su animación y se resolvió la sesión
  if (loading || !splashListo) {
    return <SplashScreen onTerminar={() => setSplashListo(true)} />;
  }

  const rolNoSoportado = user && !altaEnCurso && !['CLIENTE', 'CONDUCTOR', 'FLETERO', 'GERENTE'].includes(user.rol);
  if (rolNoSoportado) {
    return <RolNoSoportado onLogout={logout} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stacks user={user} altaEnCurso={altaEnCurso} />
    </NavigationContainer>
  );
}
