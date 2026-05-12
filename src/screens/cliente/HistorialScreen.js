import React, { useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';

const HISTORIAL_MOCK = [
  {
    mes: 'Abril 2026',
    totalMes: 47800,
    data: [
      { id: 'h-001', origen: 'Recoleta', destino: 'Belgrano', fecha: 'Hoy, 10:30', monto: 12500, estado: 'entregado', requisitos: [] },
      { id: 'h-002', origen: 'Caballito', destino: 'Flores', fecha: 'Ayer, 15:00', monto: 8900, estado: 'entregado', requisitos: ['Frágil'] },
      { id: 'h-003', origen: 'Villa Urquiza', destino: 'Palermo', fecha: '23 abr, 09:15', monto: 11200, estado: 'cancelado', requisitos: [] },
      { id: 'h-004', origen: 'San Telmo', destino: 'Núñez', fecha: '20 abr, 18:00', monto: 15200, estado: 'entregado', requisitos: ['Carga pesada'] },
    ],
  },
  {
    mes: 'Marzo 2026',
    totalMes: 63100,
    data: [
      { id: 'h-005', origen: 'Almagro', destino: 'Microcentro', fecha: '31 mar, 12:00', monto: 9800, estado: 'entregado', requisitos: [] },
      { id: 'h-006', origen: 'Boedo', destino: 'Palermo Soho', fecha: '28 mar, 10:30', monto: 13400, estado: 'entregado', requisitos: ['Refrigerado'] },
      { id: 'h-007', origen: 'Puerto Madero', destino: 'Recoleta', fecha: '22 mar, 16:00', monto: 18500, estado: 'entregado', requisitos: [] },
      { id: 'h-008', origen: 'Villa del Parque', destino: 'San Isidro', fecha: '15 mar, 08:00', monto: 21400, estado: 'cancelado', requisitos: ['Frágil'] },
    ],
  },
];

const FILTROS = ['Todos', 'Entregados', 'Cancelados'];

function EstadoBadge({ estado }) {
  const ok = estado === 'entregado';
  return (
    <View style={[styles.badge, ok ? styles.badgeVerde : styles.badgeRojo]}>
      <Text style={[styles.badgeText, { color: ok ? colors.success : colors.error }]}>
        {ok ? 'Entregado' : 'Cancelado'}
      </Text>
    </View>
  );
}

function TagRequisito({ label }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function ViajeItem({ item }) {
  return (
    <TouchableOpacity style={styles.viajeItem} activeOpacity={0.8}>
      <View style={styles.viajeTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.viajeRuta} numberOfLines={1}>
            {item.origen} → {item.destino}
          </Text>
          <Text style={styles.viajeFecha}>{item.fecha}</Text>
          {item.requisitos.length > 0 && (
            <View style={styles.tagsRow}>
              {item.requisitos.map((r) => <TagRequisito key={r} label={r} />)}
            </View>
          )}
        </View>
        <View style={styles.viajeDerecha}>
          <Text style={styles.viajeMonto}>${item.monto.toLocaleString('es-AR')}</Text>
          <EstadoBadge estado={item.estado} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HistorialScreen({ navigation }) {
  const [filtroActivo, setFiltroActivo] = useState('Todos');

  const datosFiltrados = HISTORIAL_MOCK.map((seccion) => ({
    ...seccion,
    data: seccion.data.filter((v) => {
      if (filtroActivo === 'Entregados') return v.estado === 'entregado';
      if (filtroActivo === 'Cancelados') return v.estado === 'cancelado';
      return true;
    }),
  })).filter((s) => s.data.length > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filtros */}
      <View style={styles.filtrosRow}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroChip, filtroActivo === f && styles.filtroChipActivo]}
            onPress={() => setFiltroActivo(f)}
          >
            <Text style={[styles.filtroText, filtroActivo === f && styles.filtroTextActivo]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={datosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionMes}>{section.mes}</Text>
            <Text style={styles.seccionTotal}>${section.totalMes.toLocaleString('es-AR')}</Text>
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
    width: 40, height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface1,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },

  filtrosRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filtroChip: {
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filtroChipActivo: {
    backgroundColor: `${colors.primary}22`,
    borderColor: colors.primary,
  },
  filtroText: { fontSize: fontSize.body, color: colors.textSecondary, fontWeight: '600' },
  filtroTextActivo: { color: colors.primary },

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  seccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  seccionMes: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary },
  seccionTotal: { fontSize: fontSize.body, fontWeight: '700', color: colors.textSecondary },

  cardWrapper: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },

  viajeItem: { paddingVertical: spacing.md },
  viajeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  viajeRuta: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  viajeFecha: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },
  viajeDerecha: { alignItems: 'flex-end', gap: spacing.xs },
  viajeMonto: { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },

  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeVerde: { backgroundColor: `${colors.success}22` },
  badgeRojo: { backgroundColor: `${colors.error}22` },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  tagsRow: { flexDirection: 'row', gap: spacing.xs, marginTop: 4 },
  tag: {
    borderWidth: 1,
    borderColor: `${colors.warning}66`,
    borderRadius: radius.full,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  tagText: { fontSize: 10, color: colors.warning, fontWeight: '600' },

  divider: { height: 1, backgroundColor: colors.surface3 },

  vacio: { alignItems: 'center', paddingTop: spacing.xl },
  vacioText: { fontSize: fontSize.body, color: colors.textHint },
});
