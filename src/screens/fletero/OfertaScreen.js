import React, { useState, useEffect } from 'react';
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

const COUNTDOWN_SEGUNDOS = 45;

const TAG_COLORS = {
  'Frágil': colors.warning,
  'Refrigerado': '#4FC3F7',
  'Carga pesada': colors.textSecondary,
  'Documentos': colors.textSecondary,
};

function TagRequisito({ label }) {
  const color = TAG_COLORS[label] || colors.textSecondary;
  return (
    <View style={[styles.tag, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

function CountdownRing({ segundos, total }) {
  const pct = segundos / total;
  const urgente = segundos <= 10;
  return (
    <View style={styles.countdownWrapper}>
      <View style={[styles.countdownRing, urgente && styles.countdownRingUrgente]}>
        <Text style={[styles.countdownNumero, urgente && styles.countdownNumeroUrgente]}>
          {segundos}
        </Text>
        <Text style={styles.countdownSeg}>seg</Text>
      </View>
    </View>
  );
}

export default function OfertaScreen({ navigation, route }) {
  const viaje = route?.params?.viaje ?? {
    id: 'v-001',
    origen: 'Palermo Hollywood',
    destino: 'San Telmo',
    paradas: 1,
    distanciaKm: 8.4,
    precio: 14500,
    requisitos: ['Frágil'],
    descripcion: 'Mueble de 3 cajones, bien embalado. Cuidado con las esquinas.',
    publicadoHace: '2 min',
  };

  const [segundos, setSegundos] = useState(COUNTDOWN_SEGUNDOS);
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    if (segundos <= 0) { setExpirado(true); return; }
    const timer = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [segundos]);

  const handleAceptar = () => {
    navigation.navigate('ViajeActivo', { viaje });
  };

  const handleRechazar = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Oferta de viaje</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Countdown */}
        <View style={styles.countdownSection}>
          <CountdownRing segundos={segundos} total={COUNTDOWN_SEGUNDOS} />
          <Text style={styles.countdownLabel}>
            {expirado ? 'Oferta expirada' : 'Tiempo para decidir'}
          </Text>
        </View>

        {/* Precio destacado */}
        <View style={styles.precioCard}>
          <Text style={styles.precioLabel}>Ganás</Text>
          <Text style={styles.precioValor}>${viaje.precio.toLocaleString('es-AR')}</Text>
          <Text style={styles.precioDistancia}>{viaje.distanciaKm} km · {viaje.paradas} parada{viaje.paradas !== 1 ? 's' : ''}</Text>
        </View>

        {/* Ruta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ruta</Text>
          <View style={styles.rutaRow}>
            <View style={styles.rutaDots}>
              <View style={styles.dotOrigen} />
              <View style={styles.rutaLinea} />
              <View style={styles.dotDestino} />
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <View>
                <Text style={styles.rutaLabel}>Origen</Text>
                <Text style={styles.rutaValor}>{viaje.origen}</Text>
              </View>
              <View>
                <Text style={styles.rutaLabel}>Destino</Text>
                <Text style={styles.rutaValor}>{viaje.destino}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Descripción y requisitos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Carga</Text>
          <Text style={styles.descripcion}>{viaje.descripcion}</Text>
          {viaje.requisitos.length > 0 && (
            <View style={styles.tagsRow}>
              {viaje.requisitos.map((r) => <TagRequisito key={r} label={r} />)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botones */}
      <View style={styles.footer}>
        {expirado ? (
          <View style={styles.expiradoBanner}>
            <Text style={styles.expiradoText}>El tiempo expiró — esta oferta ya no está disponible</Text>
          </View>
        ) : (
          <View style={styles.botonesRow}>
            <TouchableOpacity style={styles.btnRechazar} onPress={handleRechazar} activeOpacity={0.85}>
              <Text style={styles.btnRechazarText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAceptar} onPress={handleAceptar} activeOpacity={0.85}>
              <Text style={styles.btnAceptarText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        )}
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
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 120 },

  countdownSection: { alignItems: 'center', paddingVertical: spacing.lg },
  countdownWrapper: { marginBottom: spacing.sm },
  countdownRing: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}15`,
  },
  countdownRingUrgente: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}15`,
  },
  countdownNumero: { fontSize: 36, fontWeight: '800', color: colors.primary },
  countdownNumeroUrgente: { color: colors.error },
  countdownSeg: { fontSize: fontSize.caption, color: colors.textHint },
  countdownLabel: { fontSize: fontSize.body, color: colors.textSecondary },

  precioCard: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  precioLabel: { fontSize: fontSize.caption, color: colors.textSecondary },
  precioValor: { fontSize: 40, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  precioDistancia: { fontSize: fontSize.body, color: colors.textSecondary },

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
  rutaDots: { alignItems: 'center', width: 12, paddingTop: 4 },
  dotOrigen: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  rutaLinea: { width: 2, flex: 1, minHeight: 24, backgroundColor: colors.surface3, marginVertical: 3 },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  rutaLabel: { fontSize: fontSize.caption, color: colors.textHint },
  rutaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },

  descripcion: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: spacing.sm },
  tagsRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  tag: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '700' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  botonesRow: { flexDirection: 'row', gap: spacing.sm },
  btnRechazar: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnRechazarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.error },
  btnAceptar: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnAceptarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },

  expiradoBanner: {
    backgroundColor: `${colors.error}22`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.md,
    alignItems: 'center',
  },
  expiradoText: { fontSize: fontSize.body, color: colors.error, fontWeight: '600' },
});
