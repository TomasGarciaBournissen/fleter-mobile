import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { listarViajes } from '../../services/viajesConductor';
import { mesAnio } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Nota } from '../../components/ui';
import TarjetaViaje from '../../components/viaje/TarjetaViaje';

const FILTROS = [
  { id: 'todos', titulo: 'Todos', estados: null },
  { id: 'entregados', titulo: 'Entregados', estados: ['FINALIZADO'] },
  { id: 'cancelados', titulo: 'Cancelados', estados: ['CANCELADO', 'RECHAZADO'] },
  { id: 'vencidos', titulo: 'Vencidos', estados: ['VENCIDO'] },
];

// Viajes terminados, agrupados por mes (el más reciente primero), con filtros.
export default function HistorialScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const [viajes, setViajes] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setViajes(await listarViajes({ grupo: 'historial' }));
      setError('');
    } catch (err) {
      setError(mensajeDeError(err, 'No pudimos cargar el historial.'));
    }
  }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const grupos = useMemo(() => {
    const est = FILTROS.find((f) => f.id === filtro).estados;
    const lista = (viajes ?? [])
      .filter((v) => !est || est.includes(v.estado))
      .sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada));
    const porMes = [];
    lista.forEach((v) => {
      const mes = mesAnio(v.fecha_programada);
      const g = porMes.find((x) => x.mes === mes);
      if (g) g.viajes.push(v); else porMes.push({ mes, viajes: [v] });
    });
    return porMes;
  }, [viajes, filtro]);

  const abrir = (v) => navigation.navigate(v.estado === 'FINALIZADO' ? 'ViajeTerminado' : 'DetalleViaje', { id: v.id_viaje });

  return (
    <Pantalla
      edges={['top']}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }} tintColor={colors.accent} />}
    >
      <Titulo style={{ marginTop: 12 }}>Historial</Titulo>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtros} contentContainerStyle={{ gap: 8 }}>
        {FILTROS.map((f) => (
          <Pressable key={f.id} onPress={() => setFiltro(f.id)} accessibilityRole="button" accessibilityState={{ selected: filtro === f.id }}
            style={[s.filtro, filtro === f.id && s.filtroOn]}>
            <Text style={[s.filtroTexto, filtro === f.id && s.filtroTextoOn]}>{f.titulo}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {error ? <Nota tipo="error">{error}</Nota> : null}
      {viajes === null && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}
      {viajes && !grupos.length ? (
        <View style={{ marginTop: 40 }}>
          <Text style={s.vacioTitulo}>{filtro === 'todos' ? 'Todavía no terminaste ningún viaje' : 'No hay viajes con este filtro'}</Text>
          <Text style={s.vacioTexto}>Los viajes entregados, cancelados y vencidos quedan acá.</Text>
        </View>
      ) : null}
      {grupos.map((g) => (
        <View key={g.mes}>
          <View style={s.mes}>
            <Text style={s.mesTitulo}>{g.mes}</Text>
            <Text style={s.meta}>{g.viajes.length === 1 ? '1 viaje' : `${g.viajes.length} viajes`}</Text>
          </View>
          <View style={{ gap: 10 }}>
            {g.viajes.map((v) => <TarjetaViaje key={v.id_viaje} viaje={v} onPress={() => abrir(v)} />)}
          </View>
        </View>
      ))}
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  filtros:       { marginTop: 14, flexGrow: 0, marginHorizontal: -20, paddingHorizontal: 20 },
  filtro:        { height: 32, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface, justifyContent: 'center' },
  filtroOn:      { backgroundColor: c.ink, borderColor: c.ink },
  filtroTexto:   { fontFamily: fonts.uiSemiBold, fontSize: 13, color: c.ink2 },
  filtroTextoOn: { color: c.onInk },
  mes:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 20, marginBottom: 8 },
  mesTitulo:     { fontFamily: fonts.display, fontSize: 14, color: c.ink },
  meta:          { fontFamily: fonts.ui, fontSize: 12, color: c.ink3 },
  vacioTitulo:   { fontFamily: fonts.display, fontSize: 17, color: c.ink },
  vacioTexto:    { fontFamily: fonts.ui, fontSize: 14, lineHeight: 21, color: c.ink2, marginTop: 6 },
});
