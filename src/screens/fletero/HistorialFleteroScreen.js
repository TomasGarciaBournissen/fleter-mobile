import React from 'react';
import {
  View, Text, SectionList, StyleSheet,
  SafeAreaView, StatusBar,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';

const HISTORIAL_MOCK = [
  {
    mes: 'Abril 2026',
    gananciasMes: 52300,
    data: [
      { id: 'h-001', origen: 'Palermo', destino: 'San Telmo', fecha: 'Hoy, 10:30', monto: 14500, estado: 'ENTREGADO' },
      { id: 'h-002', origen: 'Recoleta', destino: 'Belgrano', fecha: 'Ayer, 15:00', monto: 9800, estado: 'ENTREGADO' },
      { id: 'h-003', origen: 'Caballito', destino: 'Flores', fecha: '23 abr, 09:15', monto: 11200, estado: 'CANCELADO' },
    ],
  },
  {
    mes: 'Marzo 2026',
    gananciasMes: 63100,
    data: [
      { id: 'h-004', origen: 'Almagro', destino: 'Microcentro', fecha: '31 mar, 12:00', monto: 9800, estado: 'ENTREGADO' },
      { id: 'h-005', origen: 'Boedo', destino: 'Palermo Soho', fecha: '28 mar, 10:30', monto: 13400, estado: 'ENTREGADO' },
    ],
  },
];

const ESTADO_COLORS = {
  ENTREGADO: colors.success,
  CANCELADO: colors.error,
};

function ViajeRow({ item }) {
  const color = ESTADO_COLORS[item.estado] ?? colors.textHint;
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowRuta}>{item.origen} → {item.destino}</Text>
        <Text style={styles.rowFecha}>{item.fecha}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.rowMonto}>${item.monto.toLocaleString('es-AR')}</Text>
        <Text style={[styles.rowEstado, { color }]}>{item.estado.charAt(0) + item.estado.slice(1).toLowerCase()}</Text>
      </View>
    </View>
  );
}

export default function HistorialFleteroScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
      </View>

      <SectionList
        sections={HISTORIAL_MOCK}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionMes}>{section.mes}</Text>
            <Text style={styles.sectionGanancias}>
              ${section.gananciasMes.toLocaleString('es-AR')}
            </Text>
          </View>
        )}
        renderItem={({ item }) => <ViajeRow item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, marginTop: spacing.sm,
  },
  sectionMes: { fontSize: fontSize.caption, fontWeight: '700', color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1 },
  sectionGanancias: { fontSize: fontSize.body, fontWeight: '700', color: colors.primary },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md,
  },
  rowRuta: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  rowFecha: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },
  rowMonto: { fontSize: fontSize.h3, fontWeight: '800', color: colors.primary },
  rowEstado: { fontSize: fontSize.caption, fontWeight: '600', marginTop: 2 },

  separator: { height: spacing.sm },
});
