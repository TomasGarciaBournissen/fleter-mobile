import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import Boton from './Boton';

// Hoja inferior con calendario propio (UXUI.md: nada de pickers nativos).
// Días de 44px, semana desde el lunes, cambio de mes y de año.
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const mismoDia = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function HojaCalendario({ visible, valor, minimo, titulo, onElegir, onCerrar }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const base = valor ?? minimo ?? new Date();
  const [mes, setMes] = useState(new Date(base.getFullYear(), base.getMonth(), 1));
  const [elegido, setElegido] = useState(valor ?? null);

  const mover = (meses) => setMes(new Date(mes.getFullYear(), mes.getMonth() + meses, 1));
  const offset = (mes.getDay() + 6) % 7; // lunes = 0
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas = [...Array(offset).fill(null), ...Array.from({ length: diasMes }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1))];
  const hoy = new Date();
  const piso = minimo ? new Date(minimo.getFullYear(), minimo.getMonth(), minimo.getDate()) : null;

  const Flecha = ({ icono, onPress, label }) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [s.flecha, pressed && { backgroundColor: colors.surface3 }]}>
      <MaterialCommunityIcons name={icono} size={22} color={colors.ink} />
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={s.fondo} onPress={onCerrar} accessibilityLabel="Cerrar calendario" />
      <View style={[s.hoja, { paddingBottom: 16 + insets.bottom }]}>
        <View style={s.agarre} />
        {titulo ? <Text style={s.titulo}>{titulo}</Text> : null}
        <View style={s.nav}>
          <Flecha icono="chevron-double-left" label="Año anterior" onPress={() => mover(-12)} />
          <Flecha icono="chevron-left" label="Mes anterior" onPress={() => mover(-1)} />
          <Text style={s.mes} accessibilityLiveRegion="polite">{MESES[mes.getMonth()]} {mes.getFullYear()}</Text>
          <Flecha icono="chevron-right" label="Mes siguiente" onPress={() => mover(1)} />
          <Flecha icono="chevron-double-right" label="Año siguiente" onPress={() => mover(12)} />
        </View>
        <View style={s.grilla}>
          {DIAS.map((d, i) => <Text key={`h${i}`} style={s.diaSemana}>{d}</Text>)}
          {celdas.map((d, i) => {
            if (!d) return <View key={`v${i}`} style={s.celda} />;
            const bloqueado = piso && d < piso;
            const sel = mismoDia(d, elegido);
            return (
              <Pressable
                key={d.toISOString()}
                disabled={bloqueado}
                onPress={() => setElegido(d)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel, disabled: bloqueado }}
                accessibilityLabel={`${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`}
                style={[s.celda, sel && s.celdaSel]}
              >
                <Text style={[s.dia, mismoDia(d, hoy) && s.hoy, bloqueado && s.bloqueado, sel && s.diaSel]}>{d.getDate()}</Text>
              </Pressable>
            );
          })}
        </View>
        <Boton titulo="Listo" deshabilitado={!elegido} onPress={() => onElegir(elegido)} />
      </View>
    </Modal>
  );
}

const createStyles = (c) => StyleSheet.create({
  fondo:     { flex: 1, backgroundColor: c.scrim },
  hoja:      { backgroundColor: c.surface, borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingHorizontal: 16, paddingTop: 8 },
  agarre:    { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: c.lineStrong, marginBottom: 12 },
  titulo:    { fontFamily: fonts.display, fontSize: 17, color: c.ink, marginBottom: 8, paddingHorizontal: 4 },
  nav:       { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  flecha:    { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mes:       { flex: 1, textAlign: 'center', fontFamily: fonts.uiBold, fontSize: 15, color: c.ink },
  grilla:    { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  diaSemana: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: fonts.uiSemiBold, fontSize: 11.5, color: c.ink3, paddingVertical: 6 },
  celda:     { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  celdaSel:  { backgroundColor: c.accent },
  dia:       { fontFamily: fonts.monoMedium, fontSize: 14, color: c.ink },
  hoy:       { color: c.accentInk },
  bloqueado: { color: c.ink4 },
  diaSel:    { color: c.onAccent },
});
