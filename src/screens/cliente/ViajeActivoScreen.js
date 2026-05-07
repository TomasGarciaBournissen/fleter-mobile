import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';

const VIAJE_MOCK = {
  id: 'v-001',
  origen: 'Palermo Hollywood',
  destino: 'San Telmo',
  paradas: ['Villa Crespo'],
  fletero: {
    nombre: 'Carlos M.',
    vehiculo: 'Fiat Fiorino',
    patente: 'AD 123 XY',
    puntaje: 4.9,
    foto: 'C',
  },
  estado: 'en_camino',
  eta: '12 min',
  distanciaKm: 8.4,
  monto: 14500,
  requisitos: ['Frágil'],
};

const TIMELINE = [
  { id: 1, label: 'Viaje publicado', completado: true, hora: '10:00' },
  { id: 2, label: 'Fletero asignado', completado: true, hora: '10:05' },
  { id: 3, label: 'En camino al origen', completado: true, hora: '10:12' },
  { id: 4, label: 'Carga retirada', completado: false, hora: '' },
  { id: 5, label: 'En camino al destino', completado: false, hora: '' },
  { id: 6, label: 'Entregado', completado: false, hora: '' },
];

function TimelineItem({ item, isLast }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, item.completado && styles.timelineDotActivo]} />
        {!isLast && (
          <View style={[styles.timelineLinea, item.completado && styles.timelineLineaActiva]} />
        )}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineLabel, !item.completado && styles.timelineLabelInactivo]}>
          {item.label}
        </Text>
        {item.hora ? <Text style={styles.timelineHora}>{item.hora}</Text> : null}
      </View>
    </View>
  );
}

export default function ViajeActivoScreen({ navigation }) {
  const [viaje] = useState(VIAJE_MOCK);
  const [alertaDesvioPendiente] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Viaje en curso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Alerta desvío */}
        {alertaDesvioPendiente && (
          <View style={styles.alertaDesvioBanner}>
            <Text style={styles.alertaDesvioText}>⚠ Desvío detectado — el fletero se alejó de la ruta</Text>
          </View>
        )}

        {/* ETA */}
        <View style={styles.etaCard}>
          <View>
            <Text style={styles.etaLabel}>Tiempo estimado de llegada</Text>
            <Text style={styles.etaValor}>{viaje.eta}</Text>
          </View>
          <View style={styles.etaInfo}>
            <Text style={styles.etaDistancia}>{viaje.distanciaKm} km</Text>
            <View style={styles.badgeActivo}>
              <Text style={styles.badgeActivoText}>EN CURSO</Text>
            </View>
          </View>
        </View>

        {/* Mapa placeholder */}
        <View style={styles.mapaPlaceholder}>
          <Text style={styles.mapaText}>🗺 Mapa en tiempo real</Text>
          <Text style={styles.mapaSubText}>Integración con maps pendiente</Text>
        </View>

        {/* Ruta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ruta</Text>
          <View style={styles.rutaRow}>
            <View style={styles.rutaDots}>
              <View style={styles.dotOrigen} />
              {viaje.paradas.map((_, i) => (
                <React.Fragment key={i}>
                  <View style={styles.rutaLinea} />
                  <View style={styles.dotParada} />
                </React.Fragment>
              ))}
              <View style={styles.rutaLinea} />
              <View style={styles.dotDestino} />
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={styles.rutaValor}>{viaje.origen}</Text>
              {viaje.paradas.map((p, i) => (
                <Text key={i} style={styles.rutaParada}>{p}</Text>
              ))}
              <Text style={styles.rutaValor}>{viaje.destino}</Text>
            </View>
          </View>
        </View>

        {/* Fletero */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fletero</Text>
          <View style={styles.fleteroRow}>
            <View style={styles.fleteroAvatar}>
              <Text style={styles.fleteroAvatarText}>{viaje.fletero.foto}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fleteroNombre}>{viaje.fletero.nombre}</Text>
              <Text style={styles.fleteroInfo}>{viaje.fletero.vehiculo} · {viaje.fletero.patente}</Text>
            </View>
            <View style={styles.puntajeChip}>
              <Text style={styles.puntajeText}>★ {viaje.fletero.puntaje}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.accionesRow}>
            <TouchableOpacity style={styles.btnAccion}>
              <Text style={styles.btnAccionText}>📞 Llamar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAccion}>
              <Text style={styles.btnAccionText}>💬 Mensaje</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado del viaje</Text>
          {TIMELINE.map((item, i) => (
            <TimelineItem key={item.id} item={item} isLast={i === TIMELINE.length - 1} />
          ))}
        </View>

        {/* Monto */}
        <View style={styles.montoCard}>
          <Text style={styles.montoLabel}>Total acordado</Text>
          <Text style={styles.montoValor}>${viaje.monto.toLocaleString('es-AR')}</Text>
        </View>
      </ScrollView>

      {/* Botón cancelar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnCancelar} activeOpacity={0.85}>
          <Text style={styles.btnCancelarText}>Cancelar viaje</Text>
        </TouchableOpacity>
      </View>
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

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 100 },

  alertaDesvioBanner: {
    backgroundColor: `${colors.error}22`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  alertaDesvioText: { color: colors.error, fontSize: fontSize.body, fontWeight: '600' },

  etaCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  etaLabel: { fontSize: fontSize.caption, color: colors.textSecondary },
  etaValor: { fontSize: 36, fontWeight: '800', color: colors.textPrimary },
  etaInfo: { alignItems: 'flex-end', gap: spacing.xs },
  etaDistancia: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textSecondary },
  badgeActivo: {
    backgroundColor: `${colors.primary}22`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  badgeActivoText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.8 },

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
  cardTitle: {
    fontSize: fontSize.h3,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  rutaRow: { flexDirection: 'row', gap: spacing.sm },
  rutaDots: { alignItems: 'center', paddingTop: 2, width: 12 },
  dotOrigen: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  dotParada: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.warning },
  rutaLinea: { width: 2, height: 20, backgroundColor: colors.surface3, marginVertical: 2 },
  rutaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  rutaParada: { fontSize: fontSize.body, color: colors.textSecondary },

  fleteroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fleteroAvatar: {
    width: 44, height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  fleteroAvatarText: { fontSize: fontSize.h2, fontWeight: '800', color: '#000' },
  fleteroNombre: { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },
  fleteroInfo: { fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  puntajeChip: {
    backgroundColor: `${colors.warning}22`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  puntajeText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.warning },

  divider: { height: 1, backgroundColor: colors.surface3, marginVertical: spacing.sm },

  accionesRow: { flexDirection: 'row', gap: spacing.sm },
  btnAccion: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnAccionText: { fontSize: fontSize.body, color: colors.textPrimary, fontWeight: '600' },

  timelineRow: { flexDirection: 'row', gap: spacing.sm },
  timelineLeft: { alignItems: 'center', width: 16 },
  timelineDot: {
    width: 12, height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
    borderWidth: 2,
    borderColor: colors.surface3,
  },
  timelineDotActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineLinea: { width: 2, flex: 1, backgroundColor: colors.surface3, minHeight: 20 },
  timelineLineaActiva: { backgroundColor: colors.primary },
  timelineContent: { flex: 1, paddingBottom: spacing.md },
  timelineLabel: { fontSize: fontSize.body, color: colors.textPrimary, fontWeight: '600' },
  timelineLabelInactivo: { color: colors.textHint },
  timelineHora: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },

  montoCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  montoLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  montoValor: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  btnCancelar: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnCancelarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.error },
});
