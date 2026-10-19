import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { CONDICIONES } from '../../services/vehiculos';
import { duracionHoras, duracionMin, km } from '../../utils/fechas';

export function textoCondiciones(lista = []) {
  if (!lista.length) return 'Sin condiciones';
  return lista.map((id) => CONDICIONES.find((c) => c.id === id)?.titulo ?? id).join(', ');
}

export const distanciaDe = (v) => v?.estimado?.distancia_km ?? v?.distancia_estimada_km;
export const tiempoDe = (v) => (v?.estimado?.total_horas != null ? duracionHoras(v.estimado.total_horas) : duracionMin(v?.duracion_estimada));

// Grilla de label/valor en dos columnas (patrón mobile del DS). Sin datos → «A confirmar».
export default function DatosViaje({ items, style }) {
  const s = useThemedStyles(createStyles);
  return (
    <View style={[s.grilla, style]}>
      {items.map(({ label, valor, mono }) => (
        <View key={label} style={s.celda}>
          <Text style={s.label}>{label}</Text>
          <Text style={[s.valor, mono && s.mono]}>{valor || 'A confirmar'}</Text>
        </View>
      ))}
    </View>
  );
}

// Los datos de siempre de un viaje para el conductor (sin precio)
export function datosBasicos(v) {
  return [
    { label: 'Condiciones', valor: textoCondiciones(v.condiciones_requeridas) },
    { label: 'Distancia', valor: km(distanciaDe(v)) },
    { label: 'Tiempo', valor: tiempoDe(v) },
  ];
}

const createStyles = (c) => StyleSheet.create({
  grilla: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.line },
  celda:  { width: '50%', paddingRight: 12 },
  label:  { fontFamily: fonts.uiSemiBold, fontSize: 11.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.ink3 },
  valor:  { fontFamily: fonts.uiSemiBold, fontSize: 13, color: c.ink, marginTop: 1 },
  mono:   { fontFamily: fonts.mono },
});
