import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';

// Option card del DS v2 (elegir rol, tipo de vehículo…). Selección única:
// el padre maneja cuál está `seleccionada`.
export default function Opcion({ icono, titulo, descripcion, seleccionada, onPress, compacta }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: !!seleccionada }}
      accessibilityLabel={descripcion ? `${titulo}. ${descripcion}` : titulo}
      style={[s.caja, compacta && s.compacta, seleccionada && s.cajaSel]}
    >
      <View style={[s.glifo, seleccionada && s.glifoSel]}>
        <MaterialCommunityIcons name={icono} size={22} color={colors.ink} />
      </View>
      <View style={s.textos}>
        <Text style={[s.titulo, compacta && s.tituloCompacto]}>{titulo}</Text>
        {descripcion ? <Text style={compacta ? s.meta : s.desc}>{descripcion}</Text> : null}
      </View>
      <View style={[s.tick, seleccionada && s.tickSel]}>
        {seleccionada ? <MaterialCommunityIcons name="check" size={14} color={colors.onAccent} /> : null}
      </View>
    </Pressable>
  );
}

const createStyles = (c) => StyleSheet.create({
  caja:      { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  compacta:  { paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  cajaSel:   { borderColor: c.accent, borderWidth: 2, backgroundColor: c.accentSofter, padding: 15 },
  glifo:     { width: 40, height: 40, borderRadius: 8, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
  glifoSel:  { backgroundColor: c.accentSoft },
  textos:    { flex: 1 },
  titulo:    { fontFamily: fonts.uiBold, fontSize: 15, color: c.ink },
  tituloCompacto: { fontSize: 14 },
  desc:      { fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: c.ink2, marginTop: 3 },
  meta:      { fontFamily: fonts.ui, fontSize: 12, color: c.ink3 },
  tick:      { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  tickSel:   { backgroundColor: c.accent, borderColor: c.accent },
});
