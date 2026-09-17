import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes } from '../theme';
import { useAuth } from './AuthContext';

// Apariencia de la app: 'light' | 'dark' | 'system'.
// La preferencia guardada gana siempre. Sin preferencia guardada,
// el conductor arranca en oscuro y el resto en claro (defaults del DS v2).
const STORAGE_KEY = '@fleter/apariencia';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const sistemaOscuro = useColorScheme() === 'dark';
  const { user } = useAuth();
  const [mode, setModeState] = useState(null); // null = todavía no cargó la preferencia

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => setModeState(v === 'light' || v === 'dark' || v === 'system' ? v : ''))
      .catch(() => setModeState(''));
  }, []);

  const setMode = useCallback((m) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  // '' = sin preferencia guardada → default por rol
  const modeEfectivo = mode || (user?.rol === 'CONDUCTOR' ? 'dark' : 'light');
  const isDark = modeEfectivo === 'dark' || (modeEfectivo === 'system' && sistemaOscuro);

  const value = useMemo(() => ({
    colors: isDark ? palettes.dark : palettes.light,
    isDark,
    mode: modeEfectivo,
    setMode,
  }), [isDark, modeEfectivo, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  // Fallback defensivo por si un componente se renderiza fuera del provider
  return ctx ?? { colors: palettes.light, isDark: false, mode: 'light', setMode: () => {} };
}

// Estilos derivados del tema: se recalculan solo cuando cambia la paleta.
// Uso: const styles = useThemedStyles(createStyles);
export function useThemedStyles(create) {
  const { colors } = useTheme();
  return useMemo(() => create(colors), [colors, create]);
}
