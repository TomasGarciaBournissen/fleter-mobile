import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { fonts } from '../../theme';
import { listarSeries } from '../../services/viajesEmpresa';
import { textoFrecuencia, desdeIso } from '../../utils/series';
import { diaCorto } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Seccion, Vacio, Nota, Boton, Pastilla } from '../../components/ui';
import { textoCondiciones } from '../../components/viaje/DatosViaje';
import { nombreConductor, textoParadas } from '../../components/empresa/TarjetaViajeEmpresa';
import { tituloParada } from '../../components/empresa/TablaParadas';

export const ESTADO_SERIE = { ACTIVA: ['Activa', 'info'], CANCELADA: ['Cancelada', 'neutra'], BORRADA: ['Borrada', 'neutra'] };
const POR_HACER = ['ASIGNADO', 'CONFIRMADO', 'CARGANDO', 'EN_RUTA', 'DESCARGANDO'];

// Cuántos viajes de la serie quedan por hacer, con lo que cuenta el backend
export function porHacer(serie) {
  const e = serie.resumen_viajes?.por_estado ?? {};
  return POR_HACER.reduce((t, k) => t + (e[k] ?? 0), 0);
}

export function recorridoSerie(serie) {
  const ps = serie.paradas ?? [];
  const destino = ps[ps.length - 1];
  return `${tituloParada(ps[0])[0]} → ${destino?.lugar?.nombre ?? destino?.direccion ?? 'A confirmar'}. ${textoParadas(ps)}. ${textoCondiciones(serie.condiciones_requeridas)}. ${nombreConductor(serie.conductor)}.`;
}

// Viajes repetidos (series): cada uno con su frecuencia, recorrido, conductor
// y cuántos viajes le quedan.
export default function SeriesScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { idOrg } = useEmpresa();
  const [series, setSeries] = useState(null);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    listarSeries(idOrg).then((l) => { setSeries(l); setError(''); }).catch((e) => setError(mensajeDeError(e, 'No pudimos cargar los viajes repetidos.')));
  }, [idOrg]));

  const activas = (series ?? []).filter((x) => x.estado === 'ACTIVA');
  const terminadas = (series ?? []).filter((x) => x.estado !== 'ACTIVA');

  const tarjeta = (serie) => {
    const [label, tipo] = ESTADO_SERIE[serie.estado] ?? [serie.estado, 'neutra'];
    const total = serie.resumen_viajes?.total ?? 0;
    return (
      <Pressable key={serie.id_serie} onPress={() => navigation.navigate('Serie', { id: serie.id_serie })} accessibilityRole="button"
        style={({ pressed }) => [s.card, pressed && { backgroundColor: colors.surface2 }]}>
        <View style={s.arriba}>
          <Text style={s.titulo}>{textoFrecuencia(serie)}</Text>
          <Pastilla texto={label} tipo={tipo} />
        </View>
        <Text style={s.resumen}>{recorridoSerie(serie)}</Text>
        <Text style={s.meta}>Hasta {diaCorto(desdeIso(serie.fecha_hasta))}. {porHacer(serie)} de {total} {total === 1 ? 'viaje' : 'viajes'} por hacer.</Text>
      </Pressable>
    );
  };

  return (
    <Pantalla onVolver={() => navigation.goBack()} pie={<Boton titulo="Cargar un viaje repetido" onPress={() => navigation.navigate('NuevoViaje')} />}>
      <Titulo>Viajes repetidos</Titulo>
      {error ? <Nota tipo="error">{error}</Nota> : null}
      {series === null && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}
      {series && !series.length ? (
        <Vacio icono="repeat" titulo="No hay viajes repetidos" texto="Al cargar un viaje, en «¿Se repite?» elegí los días: se crean de una vez los viajes de hasta 30 días." />
      ) : null}
      {activas.length ? <View style={s.grupo}>{activas.map(tarjeta)}</View> : null}
      {series?.length ? <Nota>Una serie no se renueva sola. Cancelarla no cambia los viajes ya creados: esos se cancelan uno por uno.</Nota> : null}
      {terminadas.length ? (
        <Seccion titulo="Terminadas">
          <View style={{ gap: 10 }}>{terminadas.map(tarjeta)}</View>
        </Seccion>
      ) : null}
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  grupo:   { marginTop: 16, gap: 10 },
  card:    { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 16 },
  arriba:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  titulo:  { flex: 1, fontFamily: fonts.uiBold, fontSize: 15, color: c.ink },
  resumen: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: c.ink2, marginTop: 4 },
  meta:    { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 6 },
});
