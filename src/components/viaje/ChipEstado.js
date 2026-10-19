import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { estadoInfo, coloresFamilia } from '../../utils/estados';

// Badge de estado: fondo soft de su familia, texto ink 11px 700.
// Los estados «en curso» llevan un punto que late.
export default function ChipEstado({ estado, style }) {
  const { colors } = useTheme();
  const { label, familia } = estadoInfo(estado);
  const c = coloresFamilia(familia, colors);
  const late = familia === 'curso';
  const op = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!late) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 0.25, duration: 800, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [late, op]);

  return (
    <View style={[s.chip, { backgroundColor: c.soft }, style]} accessibilityLabel={`Estado: ${label}`}>
      {late ? <Animated.View style={[s.punto, { backgroundColor: c.ink, opacity: op }]} /> : null}
      <Text style={[s.texto, { color: c.ink }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 6, height: 22, paddingHorizontal: 9, borderRadius: 999, alignSelf: 'flex-start' },
  punto: { width: 6, height: 6, borderRadius: 3 },
  texto: { fontFamily: fonts.uiBold, fontSize: 11 },
});
