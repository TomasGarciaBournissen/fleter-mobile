import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { cuando, km } from '../../utils/fechas';
import { pesos } from '../../utils/dinero';
import { motivoFinalEmpresa } from '../../utils/estados';
import ChipEstado from '../viaje/ChipEstado';
import { textoCondiciones, distanciaDe, tiempoDe } from '../viaje/DatosViaje';
import TablaParadas, { tituloParada } from './TablaParadas';

export const nombreConductor = (c) => (c ? [c.nombre, c.apellido].filter(Boolean).join(' ') : 'Sin conductor');
export const textoParadas = (ps = []) => {
  const n = Math.max(0, ps.length - 2);
  return n === 0 ? 'Sin paradas' : n === 1 ? '1 parada' : `${n} paradas`;
};

// Los 9 datos en una línea, sin cortar nada (fecha y hora, precio y estado van arriba)
export function resumenViaje(v) {
  const ps = v.paradas ?? [];
  const origen = tituloParada(ps[0])[0] || 'A confirmar';
  const destino = ps.length > 1 ? (ps[ps.length - 1].lugar?.nombre ?? ps[ps.length - 1].direccion) : 'A confirmar';
  return [
    `${origen} → ${destino}.`,
    `${textoParadas(ps)}.`,
    `${textoCondiciones(v.condiciones_requeridas)}.`,
    `${km(distanciaDe(v))}, ${tiempoDe(v)}.`,
    motivoFinalEmpresa(v),
  ].filter(Boolean).join(' ');
}

// Card de viaje del lado de la empresa: los 9 datos con precio (la empresa sí
// lo ve). `conTabla` muestra la tabla de paradas estimado/real del viaje en curso.
// `marcaSerie` es el texto de la frecuencia si el viaje es de un viaje repetido.
export default function TarjetaViajeEmpresa({ viaje: v, onPress, conTabla, eta, marcaSerie }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const quien = [nombreConductor(v.conductor), v.vehiculo ? `${v.vehiculo.marca} ${v.vehiculo.modelo}` : null].filter(Boolean).join(', ');
  const precio = v.estado === 'FINALIZADO' && v.precio_real != null ? v.precio_real : v.precio_estimado;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Viaje VJ-${v.id_viaje}, ${cuando(v.fecha_programada)}, ${quien}, ${pesos(precio)}`}
      style={({ pressed }) => [s.card, pressed && { backgroundColor: colors.surface2 }]}
    >
      <View style={s.arriba}>
        <ChipEstado estado={v.estado} />
        <Text style={s.id}>VJ-{v.id_viaje}</Text>
      </View>
      <View style={s.cuandoFila}>
        <View style={{ flex: 1 }}>
          <Text style={s.cuando}>{cuando(v.fecha_programada)}</Text>
          <View style={s.quienFila}>
            <Text style={s.quien}>{quien}</Text>
            {marcaSerie ? (
              <View style={s.serie}>
                <MaterialCommunityIcons name="repeat" size={12} color={colors.ink2} />
                <Text style={s.serieTexto}>{marcaSerie}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={[s.precio, !conTabla && s.precioChico]}>{pesos(precio)}</Text>
      </View>
      {conTabla ? (
        <>
          <TablaParadas viaje={v} eta={eta} />
          <Text style={s.resumen}>{textoCondiciones(v.condiciones_requeridas)}. {km(distanciaDe(v))}, {tiempoDe(v)}.</Text>
        </>
      ) : (
        <Text style={s.resumen}>{resumenViaje(v)}</Text>
      )}
    </Pressable>
  );
}

const createStyles = (c) => StyleSheet.create({
  card:        { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 16 },
  arriba:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id:          { fontFamily: fonts.mono, fontSize: 12, color: c.ink3 },
  cuandoFila:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  cuando:      { fontFamily: fonts.uiBold, fontSize: 15, color: c.ink },
  quienFila:   { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 1 },
  quien:       { fontFamily: fonts.uiMedium, fontSize: 12, color: c.ink3 },
  serie:       { flexDirection: 'row', alignItems: 'center', gap: 3, height: 20, paddingHorizontal: 7, borderRadius: 5, backgroundColor: c.surface2 },
  serieTexto:  { fontFamily: fonts.uiBold, fontSize: 11, color: c.ink2 },
  precio:      { fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.4, color: c.ink },
  precioChico: { fontSize: 17 },
  resumen:     { fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: c.ink2, marginTop: 8 },
});
