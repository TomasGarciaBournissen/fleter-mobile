import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import api from '../../services/api';
import { formatKm, formatHoras, formatPrecio } from '../../utils/format';

const ZONA_LABELS = { CABA: 'CABA', PROVINCIA: 'Provincia', MIXTO: 'CABA + Provincia' };
const COND_LABELS = {
  FRAGIL: 'Frágil', REFRIGERADO: 'Refrigerado', CARGA_PESADA: 'Carga pesada',
  PELIGROSO: 'Peligroso', VOLUMINOSO: 'Voluminoso',
};
const COND_COLORS = {
  FRAGIL: colors.warning, REFRIGERADO: '#4FC3F7', CARGA_PESADA: colors.textSecondary,
  PELIGROSO: colors.error, VOLUMINOSO: colors.textSecondary,
};

function FilaInfo({ label, value }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.filaLabel}>{label}</Text>
      <Text style={styles.filaValor}>{value}</Text>
    </View>
  );
}

export default function ConfirmacionViajeScreen({ navigation, route }) {
  const { payload, estimado } = route.params;
  const [cargando, setCargando] = useState(false);

  const paradas = payload.paradas ?? [];
  const origen  = paradas[0]?.direccion ?? '';
  const destino = paradas[paradas.length - 1]?.direccion ?? '';
  const intermedias = paradas.slice(1, -1);

  const handleConfirmar = async () => {
    setCargando(true);
    try {
      const { data } = await api.post('/api/viajes', payload);
      navigation.replace('BuscandoFletero', { idViaje: data.id_viaje });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo publicar el viaje');
      setCargando(false);
    }
  };

  // ── Pantalla de confirmación ───────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmá el viaje</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Precio */}
        <View style={styles.precioCard}>
          <Text style={styles.precioLabel}>Precio estimado</Text>
          <Text style={styles.precioValor}>
            ${formatPrecio(estimado.precio_estimado)}
          </Text>
          <Text style={styles.precioDetalle}>
            {formatKm(estimado.desglose?.distancia_km)} · {formatHoras(estimado.desglose?.tiempo_horas)}
          </Text>
        </View>

        {/* Ruta */}
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

        {/* Detalles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles</Text>
          <FilaInfo label="Zona" value={ZONA_LABELS[payload.zona] ?? payload.zona} />
          <View style={styles.divider} />
          <FilaInfo
            label="Fecha y hora"
            value={`${payload.fecha_programada?.slice(0,10) ?? ''} ${payload.fecha_programada?.slice(11,16) ?? ''}`}
          />
          {payload.tarifa_hora != null && (
            <>
              <View style={styles.divider} />
              <FilaInfo label="Tarifa/hora" value={`$${Number(payload.tarifa_hora).toLocaleString('es-AR')}`} />
            </>
          )}
          {payload.tarifa_km != null && (
            <>
              <View style={styles.divider} />
              <FilaInfo label="Tarifa/km" value={`$${Number(payload.tarifa_km).toLocaleString('es-AR')}`} />
            </>
          )}
          {payload.condiciones_requeridas?.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={[styles.fila, { alignItems: 'flex-start', paddingTop: spacing.sm }]}>
                <Text style={styles.filaLabel}>Requisitos</Text>
                <View style={styles.tagsRow}>
                  {payload.condiciones_requeridas.map(c => {
                    const color = COND_COLORS[c] ?? colors.textSecondary;
                    return (
                      <View key={c} style={[styles.tag, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}>
                        <Text style={[styles.tagText, { color }]}>{COND_LABELS[c] ?? c}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={{ fontSize: 16 }}>ℹ️</Text>
          <Text style={styles.infoText}>
            Al confirmar, el viaje se publica a todos los fleteros elegibles. El primero en aceptar queda asignado.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnConfirmar, cargando && { opacity: 0.6 }]}
          onPress={handleConfirmar}
          disabled={cargando}
          activeOpacity={0.85}
        >
          {cargando
            ? <ActivityIndicator color={colors.textPrimary} />
            : <Text style={styles.btnConfirmarText}>Confirmar y publicar</Text>
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
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 120 },

  precioCard: {
    backgroundColor: `${colors.primary}12`, borderRadius: radius.lg,
    borderWidth: 1, borderColor: `${colors.primary}44`,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md,
  },
  precioLabel:   { fontSize: fontSize.caption, fontWeight: '600', color: colors.textSecondary },
  precioValor:   { fontSize: 44, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  precioDetalle: { fontSize: fontSize.body, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },

  rutaRow:  { flexDirection: 'row', gap: spacing.sm },
  rutaDots: { alignItems: 'center', paddingTop: 2, width: 12 },
  dotOrigen:  { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  dotParada:  { width: 8,  height: 8,  borderRadius: radius.full, backgroundColor: colors.warning },
  lineaRuta:  { width: 2, height: 20, backgroundColor: colors.surface3, marginVertical: 2 },
  rutaValor:  { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  rutaParada: { fontSize: fontSize.caption, color: colors.textSecondary },

  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  filaLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  filaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  divider:   { height: 1, backgroundColor: colors.surface3 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'flex-end', flex: 1, marginLeft: spacing.sm },
  tag:     { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '700' },

  infoBanner: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.surface1,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
    borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.md,
  },
  infoText: { flex: 1, fontSize: fontSize.caption, color: colors.textSecondary, lineHeight: 18 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  btnConfirmar: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  btnConfirmarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },

  // Éxito
  exitoWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  exitoIcono: {
    width: 80, height: 80, borderRadius: radius.full,
    backgroundColor: `${colors.primary}22`,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  exitoTitulo: {
    fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', marginBottom: spacing.sm,
  },
  exitoSub: {
    fontSize: fontSize.body, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl,
  },
  exitoIdCard: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    alignItems: 'center', marginBottom: spacing.md,
  },
  exitoIdLabel: { fontSize: fontSize.caption, color: colors.textHint },
  exitoId:      { fontSize: fontSize.h1, fontWeight: '800', color: colors.primary, marginTop: 4 },
  exitoNota:    { fontSize: fontSize.caption, color: colors.textHint, textAlign: 'center', marginBottom: spacing.xl },
  btnHome: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl * 2,
  },
  btnHomeText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
});
