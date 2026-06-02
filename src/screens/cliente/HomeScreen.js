import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatPrecio } from '../../utils/format';

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

function EstadoBadge({ estado }) {
  const { label, color } = estadoInfo(estado);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function ViajeItem({ viaje }) {
  const paradas = viaje.paradas ?? [];
  const origen  = paradas[0]?.direccion ?? '—';
  const destino = paradas[paradas.length - 1]?.direccion ?? '—';
  const precio  = viaje.precio_real ?? viaje.precio_estimado;
  return (
    <View style={styles.viajeItem}>
      <View style={styles.viajeInfo}>
        <Text style={styles.viajeRuta} numberOfLines={1}>{origen} → {destino}</Text>
        <Text style={styles.viajeFecha}>{formatFecha(viaje.fecha_programada ?? viaje.creado_en)}</Text>
      </View>
      <View style={styles.viajeDerecha}>
        <Text style={styles.viajeMonto}>${formatPrecio(precio)}</Text>
        <EstadoBadge estado={viaje.estado} />
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [ultimos,   setUltimos]   = useState([]);
  const [cargando,  setCargando]  = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/api/viajes/mis-viajes');
      setUltimos(data.slice(0, 3));
    } catch {
      setUltimos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Hola, {user ? `${user.nombre} ${user.apellido}`.trim() : 'bienvenido'}</Text>
          <Text style={styles.headerSub}>¿Qué movés hoy?</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={cargar} tintColor={colors.primary} />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimos viajes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Historial')}>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {cargando ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : ultimos.length === 0 ? (
            <View style={styles.vacioBanner}>
              <Text style={styles.vacioText}>Todavía no hiciste ningún viaje</Text>
            </View>
          ) : (
            <View style={styles.viajesCard}>
              {ultimos.map((v, i) => (
                <React.Fragment key={v.id_viaje}>
                  {i > 0 && <View style={styles.divider} />}
                  <ViajeItem viaje={v} />
                </React.Fragment>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

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
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerGreeting: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSub:      { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  headerActions:  { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface1, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 100 },

  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary },
  sectionLink:  { fontSize: fontSize.body, color: colors.primary, fontWeight: '600' },

  viajesCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viajeItem:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  viajeInfo:    { flex: 1, marginRight: spacing.sm },
  viajeRuta:    { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  viajeFecha:   { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },
  viajeDerecha: { alignItems: 'flex-end', gap: 4 },
  viajeMonto:   { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },

  badge:     { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  divider: { height: 1, backgroundColor: colors.surface3 },

  vacioBanner: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing.xl,
    alignItems: 'center',
  },
  vacioText: { fontSize: fontSize.body, color: colors.textHint },

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
  fabText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
});
