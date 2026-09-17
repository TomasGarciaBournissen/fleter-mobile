import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, radius } from '../theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

// Selector de tema: Claro / Oscuro / Sistema (sigue el modo del teléfono).
// La preferencia se guarda en AsyncStorage vía ThemeContext.
const OPCIONES = [
  { id: 'light',  label: 'Claro',   icono: 'sunny-outline' },
  { id: 'dark',   label: 'Oscuro',  icono: 'moon-outline' },
  { id: 'system', label: 'Sistema', icono: 'phone-portrait-outline' },
];

export default function SelectorApariencia() {
  const { colors, mode, setMode } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View>
      <View style={styles.fila}>
        {OPCIONES.map((op) => {
          const activa = mode === op.id;
          return (
            <TouchableOpacity
              key={op.id}
              style={[styles.opcion, activa && styles.opcionActiva]}
              onPress={() => setMode(op.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={op.icono}
                size={16}
                color={activa ? colors.textPrimary : colors.textHint}
              />
              <Text style={[styles.opcionText, activa && styles.opcionTextActiva]}>
                {op.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>Sistema sigue la configuración del teléfono.</Text>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  fila: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  opcion: {
    flex: 1,
    height: 36,
    borderRadius: radius.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  opcionActiva: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.line,
  },
  opcionText: {
    fontSize: fontSize.caption + 1,
    fontWeight: '500',
    color: colors.textHint,
  },
  opcionTextActiva: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: fontSize.caption,
    color: colors.textHint,
    marginTop: spacing.sm,
  },
});
