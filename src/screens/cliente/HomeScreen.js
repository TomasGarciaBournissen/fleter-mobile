import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';

// --- Datos mock ---
const STATS_MOCK = {
  activos: 2,
  gastoMes: 47800,
  puntaje: 4.8,
};

const VIAJE_ACTIVO_MOCK = {
  id: 'v-001',
  origen: 'Palermo Hollywood',
  destino: 'San Telmo',
  fletero: 'Carlos M.',
  estado: 'En camino',
  eta: '12 min',
};

const ULTIMOS_VIAJES_MOCK = [
  {
    id: 'h-001',
    origen: 'Recoleta',
    destino: 'Belgrano',
    fecha: 'Hoy, 10:30',
    monto: 12500,
    estado: 'entregado',
  },
  {
    id: 'h-002',
    origen: 'Caballito',
    destino: 'Flores',
    fecha: 'Ayer, 15:00',
    monto: 8900,
    estado: 'entregado',
  },
  {
    id: 'h-003',
    origen: 'Villa Urquiza',
    destino: 'Palermo',
    fecha: '23 abr, 09:15',
    monto: 11200,
    estado: 'cancelado',
  },
];

// --- Subcomponentes ---

function StatCard({ label, value, unit }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>
        {unit === '$' ? `$${value.toLocaleString('es-AR')}` : value}
        {unit && unit !== '$' ? (
          <Text style={styles.statUnit}> {unit}</Text>
        ) : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ViajeActivoCard({ viaje, onPress }) {
  return (
    <TouchableOpacity style={styles.viajeActivoCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.viajeActivoHeader}>
        <View style={styles.badgeActivo}>
          <Text style={styles.badgeActivoText}>EN CURSO</Text>
        </View>
        <Text style={styles.viajeEta}>{viaje.eta}</Text>
      </View>

      <View style={styles.rutaRow}>
        <View style={styles.rutaDots}>
          <View style={styles.dotOrigen} />
          <View style={styles.rutaLinea} />
          <View style={styles.dotDestino} />
        </View>
        <View style={styles.rutaTextos}>
          <Text style={styles.rutaLabel}>Origen</Text>
          <Text style={styles.rutaValor}>{viaje.origen}</Text>
          <Text style={[styles.rutaLabel, { marginTop: spacing.sm }]}>Destino</Text>
          <Text style={styles.rutaValor}>{viaje.destino}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.fleteroRow}>
        <View style={styles.fleteroAvatar}>
          <Text style={styles.fleteroAvatarText}>
            {viaje.fletero.charAt(0)}
          </Text>
        </View>
        <View>
          <Text style={styles.fleteroNombre}>{viaje.fletero}</Text>
          <Text style={styles.fleteroEstado}>{viaje.estado}</Text>
        </View>
        <Text style={styles.verDetalle}>Ver detalle →</Text>
      </View>
    </TouchableOpacity>
  );
}

function EstadoBadge({ estado }) {
  const isEntregado = estado === 'entregado';
  return (
    <View style={[styles.estadoBadge, isEntregado ? styles.estadoVerde : styles.estadoRojo]}>
      <Text style={[styles.estadoBadgeText, { color: isEntregado ? colors.success : colors.error }]}>
        {isEntregado ? 'Entregado' : 'Cancelado'}
      </Text>
    </View>
  );
}

function ViajeHistorialItem({ viaje }) {
  return (
    <View style={styles.historialItem}>
      <View style={styles.historialInfo}>
        <Text style={styles.historialRuta} numberOfLines={1}>
          {viaje.origen} → {viaje.destino}
        </Text>
        <Text style={styles.historialFecha}>{viaje.fecha}</Text>
      </View>
      <View style={styles.historialDerecha}>
        <Text style={styles.historialMonto}>${viaje.monto.toLocaleString('es-AR')}</Text>
        <EstadoBadge estado={viaje.estado} />
      </View>
    </View>
  );
}

// --- Pantalla principal ---

export default function HomeScreen({ navigation }) {
  const [stats] = useState(STATS_MOCK);
  const [viajeActivo] = useState(VIAJE_ACTIVO_MOCK);
  const [ultimos] = useState(ULTIMOS_VIAJES_MOCK);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Hola, Tomás</Text>
          <Text style={styles.headerSub}>¿Qué movés hoy?</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7} onPress={() => navigation.navigate('Perfil')}>
            <Text style={styles.notifIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Viajes activos" value={stats.activos} />
          <StatCard label="Gasto del mes" value={stats.gastoMes} unit="$" />
          <StatCard label="Tu puntaje" value={stats.puntaje} unit="★" />
        </View>

        {/* Viaje activo */}
        {viajeActivo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Viaje activo</Text>
            <ViajeActivoCard
              viaje={viajeActivo}
              onPress={() => navigation.navigate('ViajeActivo', { viajeId: viajeActivo.id })}
            />
          </View>
        )}

        {/* Últimos viajes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimos viajes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Historial')}>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historialCard}>
            {ultimos.map((v, i) => (
              <React.Fragment key={v.id}>
                {i > 0 && <View style={styles.divider} />}
                <ViajeHistorialItem viaje={v} />
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* FAB - Nuevo viaje */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CrearViaje')}
      >
        <Text style={styles.fabText}>+ Nuevo viaje</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  headerGreeting: {
    fontSize: fontSize.h1,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: {
    fontSize: 18,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.h2,
    fontWeight: '800',
    color: colors.primary,
  },
  statUnit: {
    fontSize: fontSize.body,
    fontWeight: '400',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.caption,
    color: colors.textHint,
    marginTop: 4,
    textAlign: 'center',
  },

  // Secciones
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.h3,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionLink: {
    fontSize: fontSize.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  // Viaje activo
  viajeActivoCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
  },
  viajeActivoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeActivo: {
    backgroundColor: `${colors.primary}22`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeActivoText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  viajeEta: {
    fontSize: fontSize.h2,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  // Ruta
  rutaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rutaDots: {
    alignItems: 'center',
    paddingTop: 4,
    width: 12,
  },
  dotOrigen: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  rutaLinea: {
    width: 2,
    height: 28,
    backgroundColor: colors.surface3,
    marginVertical: 3,
  },
  dotDestino: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.error,
  },
  rutaTextos: { flex: 1 },
  rutaLabel: {
    fontSize: fontSize.caption,
    color: colors.textHint,
  },
  rutaValor: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Fletero
  divider: {
    height: 1,
    backgroundColor: colors.surface3,
    marginVertical: spacing.sm,
  },
  fleteroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fleteroAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fleteroAvatarText: {
    fontSize: fontSize.body,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  fleteroNombre: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fleteroEstado: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  verDetalle: {
    marginLeft: 'auto',
    fontSize: fontSize.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // Historial
  historialCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  historialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  historialInfo: { flex: 1, marginRight: spacing.sm },
  historialRuta: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historialFecha: {
    fontSize: fontSize.caption,
    color: colors.textHint,
    marginTop: 2,
  },
  historialDerecha: { alignItems: 'flex-end', gap: 4 },
  historialMonto: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  estadoBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  estadoVerde: { backgroundColor: `${colors.success}22` },
  estadoRojo: { backgroundColor: `${colors.error}22` },
  estadoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: fontSize.h3,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
});
