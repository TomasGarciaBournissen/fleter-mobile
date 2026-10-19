import React from 'react';
import { Pressable, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';

// Botones del DS v2. Un solo `primario` por vista.
// primario: naranja con texto en tinta · borde: superficie con borde ·
// fantasma: sin fondo · peligro: borde y texto de error.
export default function Boton({ titulo, onPress, variante = 'primario', cargando = false, deshabilitado = false, icono, accessibilityLabel }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const inactivo = deshabilitado || cargando;
  const v = styles[variante];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={({ pressed }) => [
        styles.base, v.caja,
        pressed && v.presionado,
        deshabilitado && (variante === 'fantasma' ? null : styles.deshabilitado),
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={variante === 'primario' ? colors.onAccent : colors.ink} />
      ) : (
        <View style={styles.fila}>
          {icono}
          <Text style={[styles.texto, v.texto, deshabilitado && (variante === 'fantasma' ? styles.textoFantasmaInactivo : styles.textoDeshabilitado)]}>{titulo}</Text>
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (c) => StyleSheet.create({
  base:  { height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  fila:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  texto: { fontFamily: fonts.uiSemiBold, fontSize: 15 },
  deshabilitado:      { backgroundColor: c.surface3, borderColor: c.surface3 },
  textoDeshabilitado: { color: c.ink4 },
  textoFantasmaInactivo: { color: c.ink3 },
  primario: {
    caja: { backgroundColor: c.accent },
    presionado: { backgroundColor: c.accentPress },
    texto: { color: c.onAccent },
  },
  borde: {
    caja: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.lineStrong },
    presionado: { backgroundColor: c.surface3 },
    texto: { color: c.ink },
  },
  fantasma: {
    caja: { backgroundColor: 'transparent' },
    presionado: { backgroundColor: c.surface3 },
    texto: { color: c.ink },
  },
  peligro: {
    caja: { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.error },
    presionado: { backgroundColor: c.errorSoft },
    texto: { color: c.errorInk },
  },
});
