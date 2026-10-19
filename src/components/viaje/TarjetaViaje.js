import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { cuando, diaCorto, hora, km } from '../../utils/fechas';
import { motivoFinal } from '../../utils/estados';
import ChipEstado from './ChipEstado';
import Recorrido, { partirDireccion } from './Recorrido';
import DatosViaje, { datosBasicos, textoCondiciones, distanciaDe, tiempoDe } from './DatosViaje';
import { finVentanaInicio } from '../../utils/ventana';

const idCorto = (id) => `VJ-${id}`;

// Card de viaje del conductor. `completa` muestra el recorrido y la grilla;
// compacta resume todo en una línea, sin cortar nada. Nunca muestra precio.
export default function TarjetaViaje({ viaje: v, completa = false, onPress }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const paradas = v.paradas ?? [];
  const origen = partirDireccion(paradas[0]?.direccion)[0];
  const destino = paradas[paradas.length - 1]?.direccion ?? 'A confirmar';
  const intermedias = Math.max(0, paradas.length - 2);
  const textoParadas = intermedias === 0 ? 'Sin paradas' : intermedias === 1 ? '1 parada' : `${intermedias} paradas`;

  const resumen = [
    `${origen || 'A confirmar'} → ${destino}.`,
    `${textoParadas}.`,
    `${textoCondiciones(v.condiciones_requeridas)}.`,
    `${km(distanciaDe(v))}, ${tiempoDe(v)}.`,
    motivoFinal(v),
  ].filter(Boolean).join(' ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Viaje ${idCorto(v.id_viaje)}, ${cuando(v.fecha_programada)}, ${v.organizacion?.nombre ?? ''}`}
      style={({ pressed }) => [s.card, pressed && { backgroundColor: colors.surface2 }]}
    >
      <View style={s.arriba}>
        <ChipEstado estado={v.estado} />
        <Text style={s.id}>{idCorto(v.id_viaje)}</Text>
      </View>
      <Text style={s.cuando}>{cuando(v.fecha_programada)}</Text>
      <Text style={s.empresa}>{v.organizacion?.nombre}</Text>
      {completa ? (
        <>
          <Recorrido
            style={{ marginTop: 12 }}
            conHoras={false}
            paradas={paradas.length > 3
              ? [paradas[0], { id_parada: 'm', direccion: `${intermedias} paradas, ${partirDireccion(paradas[1].direccion)[0]} y más` }, paradas[paradas.length - 1]]
              : paradas.map((p, i) => (i > 0 && i < paradas.length - 1 ? { ...p, direccion: `1 parada, ${p.direccion}` } : p))}
          />
          <DatosViaje items={[
            ...datosBasicos(v),
            v.estado === 'ASIGNADO'
              ? { label: 'Confirmalo antes', valor: `${diaCorto(finVentanaInicio(v))} ${hora(finVentanaInicio(v))}`, mono: true }
              : { label: 'Vehículo', valor: v.vehiculo ? `${v.vehiculo.marca} ${v.vehiculo.modelo}` : '' },
          ]} />
        </>
      ) : (
        <Text style={s.resumen}>{resumen}</Text>
      )}
    </Pressable>
  );
}

const createStyles = (c) => StyleSheet.create({
  card:    { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 16 },
  arriba:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id:      { fontFamily: fonts.mono, fontSize: 12, color: c.ink3 },
  cuando:  { fontFamily: fonts.uiBold, fontSize: 15, color: c.ink, marginTop: 10 },
  empresa: { fontFamily: fonts.uiMedium, fontSize: 12, color: c.ink3, marginTop: 1 },
  resumen: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: c.ink2, marginTop: 6 },
});
