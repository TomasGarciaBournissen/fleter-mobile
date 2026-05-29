import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SectionList, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';
import { formatPrecio } from '../../utils/format';

const MOCK_VIAJES = [
  {
    id_viaje: 1,
    fecha_programada: '2026-04-27T10:30:00.000Z',
    precio_real: 14500,
    estado: 'FINALIZADO',
    paradas: [
      { orden: 1, direccion: 'Palermo, CABA' },
      { orden: 2, direccion: 'San Telmo, CABA' },
    ],
  },
  {
    id_viaje: 2,
    fecha_programada: '2026-04-26T15:00:00.000Z',
    precio_real: 9800,
    estado: 'FINALIZADO',
    paradas: [
      { orden: 1, direccion: 'Recoleta, CABA' },
      { orden: 2, direccion: 'Belgrano, CABA' },
    ],
  },
  {
    id_viaje: 3,
    fecha_programada: '2026-04-23T09:15:00.000Z',
    precio_real: 11200,
    estado: 'CANCELADO',
    paradas: [
      { orden: 1, direccion: 'Caballito, CABA' },
      { orden: 2, direccion: 'Flores, CABA' },
    ],
  },
  {
    id_viaje: 4,
    fecha_programada: '2026-03-31T12:00:00.000Z',
    precio_real: 9800,
    estado: 'FINALIZADO',
    paradas: [
      { orden: 1, direccion: 'Almagro, CABA' },
      { orden: 2, direccion: 'Microcentro, CABA' },
    ],
  },
  {
    id_viaje: 5,
    fecha_programada: '2026-03-28T10:30:00.000Z',
    precio_real: 13400,
    estado: 'FINALIZADO',
    paradas: [
      { orden: 1, direccion: 'Boedo, CABA' },
      { orden: 2, direccion: 'Palermo Soho, CABA' },
    ],
  },
];

const FILTROS = ['Todos', 'Finalizados', 'Cancelados'];

const ESTADOS_TERMINALES = ['FINALIZADO', 'CANCELADO'];

function estadoInfo(estado) {
  if (estado === 'FINALIZADO') return { label: 'Entregado', color: colors.success };
  if (estado === 'CANCELADO')  return { label: 'Cancelado', color: colors.error };
  return { label: 'En curso', color: colors.warning };
}

function formatFecha(isoStr) {
  const d = new Date(isoStr);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === hoy.toDateString()) return `Hoy, ${hora}`;
  if (d.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) + `, ${hora}`;
}

function agruparPorMes(viajes) {
  const map = new Map();
  for (const v of viajes) {
    const d = new Date(v.fecha_programada);
    const label = d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
    const clave = label.charAt(0).toUpperCase() + label.slice(1);
    if (!map.has(clave)) map.set(clave, []);
    map.get(clave).push(v);
  }
  return Array.from(map.entries()).map(([mes, data]) => ({
    mes,
    gananciasMes: data
      .filter((v) => v.estado === 'FINALIZADO')
      .reduce((s, v) => s + (v.precio_real ?? v.precio_estimado ?? 0), 0),
    data,
  }));
}

function EstadoBadge({ estado }) {
  const { label, color } = estadoInfo(estado);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function ViajeRow({ item }) {
  const paradas = item.paradas ?? [];
  const origen  = paradas[0]?.direccion ?? '—';
  const destino = paradas[paradas.length - 1]?.direccion ?? '—';
  const precio  = item.precio_real ?? item.precio_estimado;
  return (
    <View style={styles.viajeItem}>
      <View style={styles.viajeTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.viajeRuta} numberOfLines={1}>{origen} → {destino}</Text>
          <Text style={styles.viajeFecha}>{formatFecha(item.fecha_programada)}</Text>
        </View>
        <View style={styles.viajeDerecha}>
          <Text style={styles.viajeMonto}>${formatPrecio(precio)}</Text>
          <EstadoBadge estado={item.estado} />
        </View>
      </View>
    </View>
  );
}

export default function HistorialFleteroScreen() {
  const [viajes,   setViajes]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');
  const [filtro,   setFiltro]   = useState('Todos');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      // TODO: reemplazar con api.get('/api/viajes/mis-viajes-conductor') cuando el backend lo implemente
      await new Promise((r) => setTimeout(r, 400));
      setViajes(MOCK_VIAJES);
    } catch (e) {
      setError('No se pudo cargar el historial');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const viajesFiltrados = viajes.filter((v) => {
    if (filtro === 'Finalizados') return v.estado === 'FINALIZADO';
    if (filtro === 'Cancelados')  return v.estado === 'CANCELADO';
    return v.estado !== 'CANCELADO';
  });

  const secciones = agruparPorMes(viajesFiltrados);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
      </View>

      <View style={styles.filtrosRow}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filtro === f && styles.chipActivo]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.chipText, filtro === f && styles.chipTextActivo]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {cargando && viajes.length === 0 ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={cargar} style={styles.reintentar}>
            <Text style={styles.reintentarText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={(item) => String(item.id_viaje)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={cargando} onRefresh={cargar} tintColor={colors.primary} />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.seccionHeader}>
              <Text style={styles.seccionMes}>{section.mes}</Text>
              <Text style={styles.seccionGanancias}>${formatPrecio(section.gananciasMes)}</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View style={styles.cardWrapper}>
              <ViajeRow item={item} />
              {index < section.data.length - 1 && <View style={styles.divider} />}
            </View>
          )}
          renderSectionFooter={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={styles.vacioText}>No hay viajes en este filtro</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },

  filtrosRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  chipActivo: { backgroundColor: `${colors.primary}22`, borderColor: colors.primary },
  chipText: { fontSize: fontSize.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActivo: { color: colors.primary },

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  seccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  seccionMes:       { fontSize: fontSize.caption, fontWeight: '700', color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1 },
  seccionGanancias: { fontSize: fontSize.body, fontWeight: '700', color: colors.primary },

  cardWrapper: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },

  viajeItem:    { paddingVertical: spacing.md },
  viajeTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  viajeRuta:    { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  viajeFecha:   { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },
  viajeDerecha: { alignItems: 'flex-end', gap: spacing.xs },
  viajeMonto:   { fontSize: fontSize.h3, fontWeight: '800', color: colors.primary },

  badge:     { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  divider: { height: 1, backgroundColor: colors.surface3 },

  vacio:     { alignItems: 'center', paddingTop: spacing.xl },
  vacioText: { fontSize: fontSize.body, color: colors.textHint },

  errorWrap:      { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.md },
  errorText:      { fontSize: fontSize.body, color: colors.error },
  reintentar:     { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: `${colors.primary}22`, borderRadius: radius.full },
  reintentarText: { fontSize: fontSize.body, color: colors.primary, fontWeight: '700' },
});
