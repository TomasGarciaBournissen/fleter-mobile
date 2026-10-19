import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';

// Roles tipográficos del DS v2. Cada familia tiene un solo rol:
// Archivo Black títulos y precios · Manrope UI · Josefin solo eslogan · Mono IDs/patentes/horas.
export function Titulo({ children, style, chico }) {
  const s = useThemedStyles(createStyles);
  return <Text style={[s.titulo, chico && s.tituloChico, style]} accessibilityRole="header">{children}</Text>;
}

export function Bajada({ children, style }) {
  const s = useThemedStyles(createStyles);
  return <Text style={[s.bajada, style]}>{children}</Text>;
}

export function Meta({ children, style }) {
  const s = useThemedStyles(createStyles);
  return <Text style={[s.meta, style]}>{children}</Text>;
}

// Label de sección o de grupo de controles (mismo estilo que el label de Campo)
export function Etiqueta({ children, style }) {
  const s = useThemedStyles(createStyles);
  return <Text style={[s.etiqueta, style]}>{children}</Text>;
}

export function Eslogan({ style, color }) {
  const s = useThemedStyles(createStyles);
  return <Text style={[s.eslogan, color && { color }, style]}>Tu logística, de punta a punta.</Text>;
}

export function Enlace({ children, onPress, style }) {
  const s = useThemedStyles(createStyles);
  return <Text onPress={onPress} accessibilityRole="link" suppressHighlighting style={[s.enlace, style]}>{children}</Text>;
}

const createStyles = (c) => StyleSheet.create({
  titulo:      { fontFamily: fonts.display, fontSize: 28, lineHeight: 31, letterSpacing: -0.5, color: c.ink },
  tituloChico: { fontSize: 24, lineHeight: 27 },
  bajada:      { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: c.ink2, marginTop: 8 },
  etiqueta:    { fontFamily: fonts.uiSemiBold, fontSize: 11.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.ink3, marginTop: 16, marginBottom: 8 },
  meta:        { fontFamily: fonts.ui, fontSize: 12, lineHeight: 17, color: c.ink3 },
  eslogan:     { fontFamily: fonts.accent, fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase', color: c.ink3 },
  enlace:      { fontFamily: fonts.uiBold, fontSize: 14, color: c.accentInk },
});
