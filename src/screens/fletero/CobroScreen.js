import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import { formatPrecio } from '../../utils/format';

const ESTRELLAS = [1, 2, 3, 4, 5];

export default function CobroScreen({ navigation, route }) {
  const { precioReal, remitoUrl } = route.params ?? {};
  const [cobrado, setCobrado] = useState(false);

  const handleFinalizar = () => {
    setCobrado(true);
    setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'DisponiblesHome' }] });
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resumen del viaje</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Pago acreditado */}
        <View style={styles.pagoCard}>
          <View style={styles.pagoIcono}>
            <Ionicons name="cash-outline" size={32} color={colors.success} />
          </View>
          <Text style={styles.pagoLabel}>Viaje finalizado</Text>
          {precioReal != null ? (
            <Text style={styles.pagoValor}>${formatPrecio(precioReal)}</Text>
          ) : null}
        </View>

        {/* Remito */}
        {remitoUrl ? (
          <TouchableOpacity style={styles.remitoCard} onPress={() => Linking.openURL(remitoUrl)} activeOpacity={0.85}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.remitoText}>Descargar remito PDF</Text>
            <Ionicons name="open-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        {/* Próximos viajes */}
        <View style={[styles.card, { alignItems: 'center', paddingVertical: spacing.lg }]}>
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
          <Text style={[styles.cardTitle, { textAlign: 'center', marginTop: spacing.sm }]}>
            ¡Buen trabajo!
          </Text>
          <Text style={{ fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center' }}>
            El pago será procesado según el método acordado con el cliente.
          </Text>
        </View>

      </ScrollView>

      {/* Botón finalizar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnFinalizar, cobrado && styles.btnFinalizadoStyle]}
          onPress={handleFinalizar}
          disabled={cobrado}
          activeOpacity={0.85}
        >
          <Text style={styles.btnFinalizarText}>
            {cobrado ? '✓ ¡Listo! Volviendo...' : 'Finalizar y buscar nuevos viajes'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 100 },

  pagoCard: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pagoIcono: {
    width: 64, height: 64,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}22`,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pagoIconoText: { fontSize: 32 },
  pagoLabel: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: 4 },
  pagoValor: { fontSize: 44, fontWeight: '800', color: colors.primary, marginBottom: spacing.sm },
  remitoCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: `${colors.primary}44`,
    padding: spacing.md, marginBottom: spacing.md,
  },
  remitoText: { flex: 1, fontSize: fontSize.body, fontWeight: '600', color: colors.primary },

  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  filaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  filaLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  filaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary, maxWidth: '55%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.surface3 },

  estrellasRecibidas: { flexDirection: 'row', gap: spacing.xs, marginVertical: spacing.sm },
  estrellaRecibida: { fontSize: 32, color: colors.surface3 },
  estrellaRecibidaActiva: { color: colors.warning },
  calificacionLabel: { fontSize: fontSize.body, color: colors.textSecondary },

  calificacionSub: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: spacing.sm },
  estrellasRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  estrellaBtn: { fontSize: 40, color: colors.surface3 },
  estrellaBtnActiva: { color: colors.warning },
  calificacionTexto: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 4 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  btnFinalizar: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnFinalizadoStyle: { backgroundColor: colors.success, opacity: 0.8 },
  btnFinalizarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
});
