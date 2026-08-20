import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import api from '../../services/api';
import { useMiEmpresa } from '../../hooks/useMiEmpresa';
import { formatPrecio } from '../../utils/format';

const TAG_LABELS = {
  FRAGIL: 'Frágil', REFRIGERADO: 'Refrigerado', CARGA_PESADA: 'Carga pesada',
  PELIGROSO: 'Peligroso', VOLUMINOSO: 'Voluminoso',
};
const TAG_COLORS = {
  FRAGIL: colors.warning, REFRIGERADO: '#4FC3F7', CARGA_PESADA: colors.textSecondary,
  PELIGROSO: colors.error, VOLUMINOSO: colors.textSecondary,
};

export default function DetalleViajeGerenteScreen({ navigation, route }) {
  const viaje = route.params?.viaje;
  const { idEmpresa } = useMiEmpresa();
  const [reservando, setReservando] = useState(false);

  const paradas = (viaje?.paradas ?? []).slice().sort((a, b) => a.orden - b.orden);
  const origen  = paradas[0]?.direccion ?? '';
  const destino = paradas[paradas.length - 1]?.direccion ?? '';
  const intermedias = paradas.slice(1, -1);
  const requisitos = (viaje?.condiciones_req ?? []).map(c => c.condicion);
  const cliente = `${viaje?.cliente?.usuario?.nombre ?? ''} ${viaje?.cliente?.usuario?.apellido ?? ''}`.trim();

  const handleReservar = async () => {
    setReservando(true);
    try {
      await api.post(`/api/viajes/${viaje.id_viaje}/reservar`, idEmpresa ? { id_empresa: idEmpresa } : {});
      navigation.replace('AsignarConductor', { viajeId: viaje.id_viaje });
    } catch (e) {
      const msg = e?.response?.status === 409
        ? 'Este viaje ya no está disponible — otra empresa lo reservó primero.'
        : (e?.response?.data?.error ?? 'No se pudo reservar el viaje.');
      Alert.alert('No se pudo reservar', msg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setReservando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del viaje</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.precioCard}>
          <Text style={styles.precioLabel}>Precio estimado</Text>
          <Text style={styles.precioValor}>${formatPrecio(viaje?.precio_estimado)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ruta</Text>
          <View style={styles.rutaRow}>
            <View style={styles.rutaDots}>
              <View style={styles.dotOrigen} />
              {intermedias.map((_, i) => (
                <React.Fragment key={i}>
                  <View style={styles.lineaRuta} />
                  <View style={styles.dotParada} />
                </React.Fragment>
              ))}
              <View style={styles.lineaRuta} />
              <View style={styles.dotDestino} />
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={styles.rutaValor}>{origen}</Text>
              {intermedias.map((p, i) => (
                <Text key={i} style={styles.rutaParada}>↳ Parada {i + 1}: {p.direccion}</Text>
              ))}
              <Text style={styles.rutaValor}>{destino}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Carga</Text>
          {viaje?.descripcion ? <Text style={styles.descripcion}>{viaje.descripcion}</Text> : null}
          {requisitos.length > 0 ? (
            <View style={styles.tagsRow}>
              {requisitos.map(r => {
                const color = TAG_COLORS[r] ?? colors.textSecondary;
                return (
                  <View key={r} style={[styles.tag, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}>
                    <Text style={[styles.tagText, { color }]}>{TAG_LABELS[r] ?? r}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.sinReq}>Sin requisitos especiales</Text>
          )}
        </View>

        {cliente ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cliente</Text>
            <Text style={styles.clienteNombre}>{cliente}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnReservar, reservando && { opacity: 0.6 }]}
          onPress={handleReservar}
          disabled={reservando}
          activeOpacity={0.85}
        >
          {reservando
            ? <ActivityIndicator color={colors.textPrimary} />
            : <Text style={styles.btnReservarText}>Reservar para mi flota</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 120 },

  precioCard: {
    backgroundColor: `${colors.primary}12`, borderRadius: radius.lg,
    borderWidth: 1, borderColor: `${colors.primary}44`,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md,
  },
  precioLabel: { fontSize: fontSize.caption, fontWeight: '600', color: colors.textSecondary },
  precioValor: { fontSize: 40, fontWeight: '800', color: colors.primary, marginVertical: 4 },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },

  rutaRow: { flexDirection: 'row', gap: spacing.sm },
  rutaDots: { alignItems: 'center', paddingTop: 2, width: 12 },
  dotOrigen: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  dotParada: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.warning },
  lineaRuta: { width: 2, height: 20, backgroundColor: colors.surface3, marginVertical: 2 },
  rutaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  rutaParada: { fontSize: fontSize.caption, color: colors.textSecondary },

  descripcion: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: spacing.sm },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '700' },
  sinReq: { fontSize: fontSize.body, color: colors.textHint },

  clienteNombre: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  btnReservar: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  btnReservarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
});
