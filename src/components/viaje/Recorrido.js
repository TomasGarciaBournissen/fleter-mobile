import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { hora } from '../../utils/fechas';

// Divide «Calle 123, Localidad» en título y localidad para mostrarlo en dos líneas
export function partirDireccion(dir = '') {
  const i = dir.indexOf(',');
  return i === -1 ? [dir, ''] : [dir.slice(0, i).trim(), dir.slice(i + 1).trim()];
}

// Recorrido parada por parada con los marcadores de UXUI.md:
// origen = punto naranja · paradas = punto gris · destino = cuadrado tinta.
// Hechas en verde con sus horas reales; la actual (`idActual`) en naranja.
export default function Recorrido({ paradas = [], idActual, conHoras = true, notaActual = 'Acá estás', style }) {
  const s = useThemedStyles(createStyles);
  const ultima = paradas.length - 1;

  return (
    <View style={style}>
      {paradas.map((p, i) => {
        const hecha = !!p.salida_real; // ya salió de esa parada
        const aqui = p.id_parada === idActual;
        const [titulo, localidad] = partirDireccion(p.direccion);
        const sub = aqui ? notaActual : hecha ? (i === 0 ? 'Cargado' : 'Entregado') : localidad;
        const horaTexto = p.salida_real
          ? `${hora(p.llegada_real)}–${hora(p.salida_real)}`
          : p.llegada_real ? hora(p.llegada_real)
          : p.llegada_estimada ? (i === 0 ? hora(p.llegada_estimada) : `~${hora(p.llegada_estimada)}`) : '';
        return (
          <View key={p.id_parada ?? i} style={[s.fila, i < ultima && s.filaConLinea]}>
            {i < ultima ? <View style={[s.linea, hecha && s.lineaHecha]} /> : null}
            <View style={[
              s.marca,
              i === 0 ? s.origen : i === ultima ? s.destino : s.parada,
              hecha && s.marcaHecha,
            ]} />
            <View style={s.textos}>
              <Text style={[s.titulo, aqui && s.tituloAqui]}>{titulo}</Text>
              {sub ? <Text style={s.sub}>{sub}</Text> : null}
            </View>
            {conHoras && horaTexto ? <Text style={s.hora}>{horaTexto}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  fila:        { flexDirection: 'row', gap: 10 },
  filaConLinea:{ paddingBottom: 10 },
  linea:       { position: 'absolute', left: 6, top: 14, bottom: 0, width: 1.5, backgroundColor: c.lineStrong },
  lineaHecha:  { backgroundColor: c.success },
  marca:       { width: 10, height: 10, marginTop: 4, marginHorizontal: 2 },
  origen:      { borderRadius: 5, backgroundColor: c.accent },
  parada:      { borderRadius: 5, backgroundColor: c.ink3 },
  destino:     { borderRadius: 2, backgroundColor: c.ink },
  marcaHecha:  { backgroundColor: c.success },
  textos:      { flex: 1, minWidth: 0 },
  titulo:      { fontFamily: fonts.uiBold, fontSize: 13, color: c.ink },
  tituloAqui:  { color: c.accentInk },
  sub:         { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 1 },
  hora:        { fontFamily: fonts.mono, fontSize: 12, color: c.ink3 },
});
