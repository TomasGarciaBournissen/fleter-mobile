import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';

const VIAJE_MOCK = {
  origen: 'Palermo Hollywood',
  destino: 'San Telmo',
  paradas: ['Villa Crespo'],
  cliente: { nombre: 'Tomás G.', telefono: '+54 11 5555-1234' },
  precio: 14500,
  requisitos: ['Frágil'],
};

const PASOS = [
  { id: 1, label: 'Ir al origen', sub: 'Palermo Hollywood', accion: 'Llegué al origen' },
  { id: 2, label: 'Retirar carga', sub: 'Confirmar con el cliente', accion: 'Carga retirada' },
  { id: 3, label: 'Ir a parada 1', sub: 'Villa Crespo', accion: 'Llegué a la parada' },
  { id: 4, label: 'Ir al destino', sub: 'San Telmo', accion: 'Llegué al destino' },
  { id: 5, label: 'Escanear QR de entrega', sub: 'Confirmar recepción', accion: 'Escanear QR' },
];

export default function ViajeActivoFleteroScreen({ navigation }) {
  const [pasoActual, setPasoActual] = useState(0);

  const handleAvanzar = () => {
    if (pasoActual === PASOS.length - 1) {
      navigation.navigate('QREntrega');
      return;
    }
    setPasoActual((p) => p + 1);
  };

  const paso = PASOS[pasoActual];
  const completado = pasoActual >= PASOS.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Viaje en curso</Text>
        <View style={styles.precioChip}>
          <Text style={styles.precioChipText}>${VIAJE_MOCK.precio.toLocaleString('es-AR')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Paso actual */}
        <View style={styles.pasoCard}>
          <Text style={styles.pasoNumero}>Paso {pasoActual + 1} de {PASOS.length}</Text>
          <Text style={styles.pasoLabel}>{paso.label}</Text>
          <Text style={styles.pasoSub}>{paso.sub}</Text>
        </View>

        {/* Mapa placeholder */}
        <View style={styles.mapaPlaceholder}>
          <Text style={styles.mapaText}>🗺 Navegación GPS</Text>
          <Text style={styles.mapaSubText}>Integración con maps pendiente</Text>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progreso del viaje</Text>
          {PASOS.map((p, i) => {
            const hecho = i < pasoActual;
            const activo = i === pasoActual;
            const isLast = i === PASOS.length - 1;
            return (
              <View key={p.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    hecho && styles.timelineDotHecho,
                    activo && styles.timelineDotActivo,
                  ]}>
                    {hecho && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  {!isLast && <View style={[styles.timelineLinea, hecho && styles.timelineLineaHecha]} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineLabel,
                    hecho && styles.timelineLabelHecho,
                    activo && styles.timelineLabelActivo,
                    !hecho && !activo && styles.timelineLabelPendiente,
                  ]}>
                    {p.label}
                  </Text>
                  <Text style={styles.timelineSub}>{p.sub}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Cliente */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>
          <View style={styles.clienteRow}>
            <View style={styles.clienteAvatar}>
              <Text style={styles.clienteAvatarText}>{VIAJE_MOCK.cliente.nombre.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clienteNombre}>{VIAJE_MOCK.cliente.nombre}</Text>
              <Text style={styles.clienteTel}>{VIAJE_MOCK.cliente.telefono}</Text>
            </View>
            <TouchableOpacity style={styles.btnLlamar}>
              <Text style={styles.btnLlamarText}>📞 Llamar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Botón avanzar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnAvanzar} onPress={handleAvanzar} activeOpacity={0.85}>
          <Text style={styles.btnAvanzarText}>
            {pasoActual === PASOS.length - 1 ? '📷 Escanear QR' : paso.accion + ' →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  precioChip: {
    backgroundColor: `${colors.primary}22`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
  },
  precioChipText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 100 },

  pasoCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pasoNumero: { fontSize: fontSize.caption, color: colors.textHint, marginBottom: 4 },
  pasoLabel: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  pasoSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },

  mapaPlaceholder: {
    height: 180,
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  mapaText: { fontSize: fontSize.h3, color: colors.textSecondary },
  mapaSubText: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 4 },

  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },

  timelineRow: { flexDirection: 'row', gap: spacing.sm },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineDot: {
    width: 20, height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.surface3,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineDotHecho: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineDotActivo: { borderColor: colors.primary, backgroundColor: `${colors.primary}22` },
  checkmark: { fontSize: 10, color: colors.textPrimary, fontWeight: '800' },
  timelineLinea: { width: 2, flex: 1, minHeight: 16, backgroundColor: colors.surface3, marginVertical: 2 },
  timelineLineaHecha: { backgroundColor: colors.primary },
  timelineContent: { flex: 1, paddingBottom: spacing.md },
  timelineLabel: { fontSize: fontSize.body, fontWeight: '600' },
  timelineLabelHecho: { color: colors.textHint },
  timelineLabelActivo: { color: colors.primary },
  timelineLabelPendiente: { color: colors.textHint },
  timelineSub: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },

  clienteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clienteAvatar: {
    width: 40, height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.surface3,
  },
  clienteAvatarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
  clienteNombre: { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },
  clienteTel: { fontSize: fontSize.caption, color: colors.textSecondary },
  btnLlamar: {
    borderWidth: 1, borderColor: colors.surface3,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  btnLlamarText: { fontSize: fontSize.body, color: colors.textPrimary },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  btnAvanzar: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnAvanzarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
});
