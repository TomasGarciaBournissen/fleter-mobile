import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SectionList, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';
import { formatPrecio } from '../../utils/format';
import api from '../../services/api';
import { useMiEmpresa } from '../../hooks/useMiEmpresa';

const FILTROS = ['Todos', 'En curso', 'Finalizados', 'Cancelados'];
const ESTADOS_EN_CURSO = ['RESERVADO_POR_EMPRESA', 'CONDUCTOR_ASIGNADO', 'EN_CAMINO_A_ORIGEN', 'CARGANDO', 'EN_RUTA', 'DESCARGANDO'];

function estadoInfo(estado) {
  if (estado === 'FINALIZADO') return { label: 'Entregado', color: colors.success };
  if (estado === 'CANCELADO')  return { label: 'Cancelado', color: colors.error };
  if (ESTADOS_EN_CURSO.includes(estado)) return { label: 'En curso', color: colors.warning };
  return { label: estado, color: colors.textSecondary };
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
    const d = new Date(v.fecha_programada ?? v.creado_en);
    const label = d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
    const clave = label.charAt(0).toUpperCase() + label.slice(1);
    if (!map.has(clave)) map.set(clave, []);
    map.get(clave).push(v);
  }
  return Array.from(map.entries()).map(([mes, data]) => ({ mes, data }));
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
  const conductor = item.conductor?.usuario ? `${item.conductor.usuario.nombre} ${item.conductor.usuario.apellido}`.trim() : null;
  return (
    <View style={styles.viajeItem}>
      <View style={styles.viajeTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.viajeRuta} numberOfLines={1}>{origen} → {destino}</Text>
          <Text style={styles.viajeFecha}>{formatFecha(item.fecha_programada ?? item.creado_en)}</Text>
          {conductor && <Text style={styles.viajeMeta}>{conductor}</Text>}
        </View>
        <View style={styles.viajeDerecha}>
          <Text style={styles.viajeMonto}>${formatPrecio(precio)}</Text>
          <EstadoBadge estado={item.estado} />
        </View>
      </View>
    </View>
  );
}

export default function HistorialEmpresaScreen() {
  const { idEmpresa } = useMiEmpresa();
  const [viajes,   setViajes]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro,   setFiltro]   = useState('Todos');

  const cargar = useCallback(async () => {
    if (!idEmpresa) return;
    setCargando(true);
    try {
      const { data } = await api.get(`/api/empresas/${idEmpresa}/viajes`);
      setViajes(data);
    } catch {
      setViajes([]);
    } finally {
      setCargando(false);
    }
  }, [idEmpresa]);

  useEffect(() => { cargar(); }, [cargar]);

  const viajesFiltrados = viajes.filter((v) => {
    if (filtro === 'En curso')    return ESTADOS_EN_CURSO.includes(v.estado);
    if (filtro === 'Finalizados') return v.estado === 'FINALIZADO';
    if (filtro === 'Cancelados')  return v.estado === 'CANCELADO';
    return true;
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
          <TouchableOpacity key={f} style={[styles.chip, filtro === f && styles.chipActivo]} onPress={() => setFiltro(f)}>
            <Text style={[styles.chipText, filtro === f && styles.chipTextActivo]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {cargando && viajes.length === 0 ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={(item) => String(item.id_viaje)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} tintColor={colors.primary} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.seccionMes}>{section.mes}</Text>
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
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  headerTitle: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },

  filtrosRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderColor: colors.surface3, borderRadius: radius.full, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs },
  chipActivo: { backgroundColor: `${colors.primary}22`, borderColor: colors.primary },
  chipText: { fontSize: fontSize.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActivo: { color: colors.primary },

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  seccionMes: { fontSize: fontSize.caption, fontWeight: '700', color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },

  cardWrapper: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, overflow: 'hidden', marginBottom: spacing.sm,
  },
  viajeItem: { paddingVertical: spacing.md },
  viajeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  viajeRuta: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  viajeFecha: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },
  viajeMeta: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },
  viajeDerecha: { alignItems: 'flex-end', gap: spacing.xs },
  viajeMonto: { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },

  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  divider: { height: 1, backgroundColor: colors.surface3 },

  vacio: { alignItems: 'center', paddingTop: spacing.xl },
  vacioText: { fontSize: fontSize.body, color: colors.textHint },
});
