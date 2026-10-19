import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import Isotipo from '../Isotipo';
import { Eslogan } from './Texto';

// Marca: isotipo + wordmark, con el eslogan debajo (solo en auth/splash).
export function Marca({ conEslogan = true, style }) {
  const s = useThemedStyles(createStyles);
  return (
    <View style={style}>
      <View style={s.marca}>
        <Isotipo size={30} />
        <Text style={s.wordmark}>Fleter</Text>
      </View>
      {conEslogan ? <Eslogan style={{ marginTop: 10 }} /> : null}
    </View>
  );
}

// Stepper de las cajas del isotipo: hechas en naranja, la actual es la caja
// de seguimiento (tinta), las que faltan solo con borde.
export function Pasos({ actual, total, etiqueta }) {
  const s = useThemedStyles(createStyles);
  return (
    <View style={s.pasos} accessibilityLabel={`Paso ${actual} de ${total}: ${etiqueta}`}>
      <View style={s.cajas}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[s.caja, i + 1 < actual && s.cajaHecha, i + 1 === actual && s.cajaActual]} />
        ))}
      </View>
      <Text style={s.pasosTexto}>Paso {actual} de {total}: {etiqueta}</Text>
    </View>
  );
}

// Nota inline (fondo soft de su familia). tipo: info | ok | aviso | error | neutra
export function Nota({ tipo = 'neutra', children, style }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const fam = {
    info:   [colors.infoSoft, colors.infoInk, 'information-outline'],
    ok:     [colors.successSoft, colors.successInk, 'check-circle-outline'],
    aviso:  [colors.warningSoft, colors.warningInk, 'alert-outline'],
    error:  [colors.errorSoft, colors.errorInk, 'alert-circle-outline'],
    neutra: [colors.surface2, colors.ink2, 'information-outline'],
  }[tipo];
  return (
    <View style={[s.nota, { backgroundColor: fam[0] }, style]} accessibilityLiveRegion={tipo === 'error' ? 'polite' : 'none'}>
      <MaterialCommunityIcons name={fam[2]} size={18} color={fam[1]} style={{ marginTop: 1 }} />
      <Text style={[s.notaTexto, { color: fam[1] }]}>{children}</Text>
    </View>
  );
}

// Chip seleccionable (condiciones de carga). Selección múltiple.
export function Chip({ titulo, activo, onPress }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!activo }}
      style={[s.chip, activo && s.chipActivo]}
    >
      {activo ? <MaterialCommunityIcons name="check" size={14} color={colors.onInk} /> : null}
      <Text style={[s.chipTexto, activo && s.chipTextoActivo]}>{titulo}</Text>
    </Pressable>
  );
}

// Divisor con una palabra al medio («o»)
export function Separador({ texto = 'o' }) {
  const s = useThemedStyles(createStyles);
  return (
    <View style={s.sep}>
      <View style={s.sepLinea} /><Text style={s.sepTexto}>{texto}</Text><View style={s.sepLinea} />
    </View>
  );
}

// Lista de próximos pasos: los números son una secuencia real.
export function ProximosPasos({ pasos }) {
  const s = useThemedStyles(createStyles);
  return (
    <View style={s.lista}>
      {pasos.map((p, i) => (
        <View key={p.titulo} style={[s.paso, i > 0 && s.pasoBorde]}>
          <View style={[s.num, i === 0 && s.numActual]}><Text style={[s.numTexto, i === 0 && s.numTextoActual]}>{i + 1}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.pasoTitulo}>{p.titulo}</Text>
            <Text style={s.pasoDesc}>{p.descripcion}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// Pastilla de estado chica (Período de prueba, etc.)
export function Pastilla({ texto, tipo = 'aviso' }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const [bg, fg] = { aviso: [colors.warningSoft, colors.warningInk], info: [colors.infoSoft, colors.infoInk], ok: [colors.successSoft, colors.successInk] }[tipo];
  return <View style={[s.pastilla, { backgroundColor: bg }]}><Text style={[s.pastillaTexto, { color: fg }]}>{texto}</Text></View>;
}

const createStyles = (c) => StyleSheet.create({
  marca:      { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark:   { fontFamily: fonts.display, fontSize: 22, letterSpacing: -0.6, color: c.ink },
  pasos:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 18 },
  cajas:      { flexDirection: 'row', gap: 4 },
  caja:       { width: 14, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: c.lineStrong },
  cajaHecha:  { backgroundColor: c.accent, borderColor: c.accent },
  cajaActual: { backgroundColor: c.ink, borderColor: c.ink },
  pasosTexto: { fontFamily: fonts.uiSemiBold, fontSize: 12, color: c.ink3 },
  nota:       { flexDirection: 'row', gap: 10, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginTop: 18 },
  notaTexto:  { flex: 1, fontFamily: fonts.uiMedium, fontSize: 13, lineHeight: 19 },
  chip:       { height: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActivo: { backgroundColor: c.ink, borderColor: c.ink },
  chipTexto:  { fontFamily: fonts.uiSemiBold, fontSize: 13, color: c.ink2 },
  chipTextoActivo: { color: c.onInk },
  sep:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sepLinea:   { flex: 1, height: 1, backgroundColor: c.line },
  sepTexto:   { fontFamily: fonts.ui, fontSize: 12, color: c.ink3 },
  lista:      { marginTop: 26, borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface },
  paso:       { flexDirection: 'row', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  pasoBorde:  { borderTopWidth: 1, borderTopColor: c.line },
  num:        { width: 26, height: 26, borderRadius: 6, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
  numActual:  { backgroundColor: c.accent },
  numTexto:   { fontFamily: fonts.monoMedium, fontSize: 13, color: c.ink2 },
  numTextoActual: { color: c.onAccent },
  pasoTitulo: { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  pasoDesc:   { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18, color: c.ink3, marginTop: 1 },
  pastilla:   { height: 24, paddingHorizontal: 10, borderRadius: 999, justifyContent: 'center' },
  pastillaTexto: { fontFamily: fonts.uiBold, fontSize: 11 },
});
