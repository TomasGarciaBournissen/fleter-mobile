import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import api from '../../services/api';
import { formatPrecio } from '../../utils/format';

const FILTROS = ['Todos', 'Finalizados', 'Cancelados', 'En curso'];

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

function claveMes(isoStr) {
  const d = new Date(isoStr);
  const label = d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function agruparPorMes(viajes) {
  const map = new Map();
  for (const v of viajes) {
    const clave = claveMes(v.fecha_programada ?? v.creado_en);
    if (!map.has(clave)) map.set(clave, []);
    map.get(clave).push(v);
  }
  return Array.from(map.entries()).map(([mes, data]) => ({
    mes,
    totalMes: data.reduce((s, v) => s + (v.precio_real ?? v.precio_estimado ?? 0), 0),
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

function ViajeItem({ item }) {
  const paradas = item.paradas ?? [];
  const origen  = paradas[0]?.direccion ?? '—';
  const destino = paradas[paradas.length - 1]?.direccion ?? '—';
  const precio  = item.precio_real ?? item.precio_estimado;
  return (
    <View style={styles.viajeItem}>
      <View style={styles.viajeTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.viajeRuta} numberOfLines={1}>{origen} → {destino}</Text>
          <Text style={styles.viajeFecha}>{formatFecha(item.fecha_programada ?? item.creado_en)}</Text>
        </View>
        <View style={styles.viajeDerecha}>
          <Text style={styles.viajeMonto}>${formatPrecio(precio)}</Text>
          <EstadoBadge estado={item.estado} />
        </View>
      </View>
    </View>
  );
}

export default function HistorialScreen({ navigation }) {
  const [viajes,   setViajes]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');
  const [filtro,   setFiltro]   = useState('Todos');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const { data } = await api.get('/api/viajes/mis-viajes');
      setViajes(data);
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
    if (filtro === 'En curso')    return !ESTADOS_TERMINALES.includes(v.estado);
    return v.estado !== 'CANCELADO';
  });

  const secciones = agruparPorMes(viajesFiltrados);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={{ width: 40 }} />
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
              <Text style={styles.seccionTotal}>${formatPrecio(section.totalMes)}</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View style={styles.cardWrapper}>
              <ViajeItem item={item} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },

  filtrosRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
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
  seccionMes:   { fontSize: fontSize.caption, fontWeight: '700', color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1 },
  seccionTotal: { fontSize: fontSize.body, fontWeight: '700', color: colors.primary },

  cardWrapper: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },

  viajeItem:   { paddingVertical: spacing.md },
  viajeTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  viajeRuta:   { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  viajeFecha:  { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },
  viajeDerecha: { alignItems: 'flex-end', gap: spacing.xs },
  viajeMonto:  { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },

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
