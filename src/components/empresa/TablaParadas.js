import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { hora } from '../../utils/fechas';
import { partirDireccion } from '../viaje/Recorrido';

// La empresa ve el nombre del lugar guardado («Depósito Pilar»); el conductor
// nunca (API.md, «Lo que ve el chofer»). Sin lugar: la dirección en dos líneas.
export function tituloParada(p) {
  if (p?.lugar?.nombre) return [p.lugar.nombre, p.direccion];
  return partirDireccion(p?.direccion);
}

// Desde cuántos minutos de diferencia con lo estimado se dice «tarde» y
// desde cuántos se marca en ámbar
export const MIN_DEMORA = 5;
export const MIN_TARDE = 10;

// La siguiente parada a la que va (o en la que está) el conductor
export function paradaActual(v) {
  const ps = v?.paradas ?? [];
  if (v?.estado === 'EN_RUTA') return ps.find((p) => !p.llegada_real);
  return ps.find((p) => p.llegada_real && !p.salida_real) ?? ps.find((p) => !p.llegada_real);
}

// Tabla de paradas del viaje en curso: hora estimada de llegada y la real.
// Las hechas en verde, la próxima resaltada, la llegada tarde en ámbar
// (`diferencia_min` lo calcula el backend). `eta` = minutos a la próxima.
export default function TablaParadas({ viaje: v, eta, style }) {
  const s = useThemedStyles(createStyles);
  const ps = v.paradas ?? [];
  const actual = paradaActual(v);
  const ultima = ps.length - 1;
  const llegaEn = eta != null ? new Date(Date.now() + eta * 60000) : null;

  return (
    <View style={[s.tabla, style]}>
      <View style={[s.fila, s.cabecera]}>
        <Text style={[s.cab, s.colParada]}>Parada</Text>
        <Text style={[s.cab, s.colHora]}>Estim.</Text>
        <Text style={[s.cab, s.colHora]}>Real</Text>
      </View>
      {ps.map((p, i) => {
        const [titulo, sub] = tituloParada(p);
        const hecha = !!p.salida_real;
        const prox = actual?.id_parada === p.id_parada;
        const tarde = p.diferencia_min != null && p.diferencia_min >= MIN_TARDE;
        const real = p.llegada_real ? hora(p.llegada_real) : prox && llegaEn ? `~${hora(llegaEn)}` : '–';
        return (
          <View key={p.id_parada ?? i} style={[s.fila, s.borde, prox && s.prox]}>
            <View style={s.colParada}>
              <View style={[s.marca, i === 0 ? s.origen : i === ultima ? s.destino : null, hecha && s.hecha]} />
              <Text style={[s.titulo, hecha && s.tituloHecha]}>{titulo}</Text>
              {sub ? <Text style={s.sub}>{sub}</Text> : null}
            </View>
            <Text style={[s.hora, s.colHora]}>{p.llegada_estimada ? hora(p.llegada_estimada) : '–'}</Text>
            <Text style={[s.hora, s.colHora, tarde && s.tarde]}>{real}</Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  tabla:      { marginTop: 12, borderWidth: 1, borderColor: c.line, borderRadius: 10, overflow: 'hidden' },
  fila:       { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingVertical: 9, paddingHorizontal: 12 },
  cabecera:   { paddingVertical: 7 },
  borde:      { borderTopWidth: 1, borderTopColor: c.line },
  prox:       { backgroundColor: c.accentSofter },
  cab:        { fontFamily: fonts.uiBold, fontSize: 10.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.ink3 },
  colParada:  { flex: 1, minWidth: 0, paddingLeft: 16 },
  colHora:    { width: 50, textAlign: 'right' },
  marca:      { position: 'absolute', left: 0, top: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: c.ink3 },
  origen:     { backgroundColor: c.accent },
  destino:    { borderRadius: 2, backgroundColor: c.ink },
  hecha:      { backgroundColor: c.success },
  titulo:     { fontFamily: fonts.uiBold, fontSize: 13, color: c.ink },
  tituloHecha:{ color: c.ink2 },
  sub:        { fontFamily: fonts.ui, fontSize: 11.5, color: c.ink3 },
  hora:       { fontFamily: fonts.mono, fontSize: 12.5, color: c.ink },
  tarde:      { color: c.warningInk },
});
