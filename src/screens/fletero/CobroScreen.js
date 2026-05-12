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

const RESUMEN_MOCK = {
  origen: 'Palermo Hollywood',
  destino: 'San Telmo',
  paradas: 1,
  distanciaKm: 8.4,
  precio: 14500,
  metodoPago: 'Mercado Pago',
  duracionMin: 42,
  cliente: 'Tomás G.',
};

const ESTRELLAS = [1, 2, 3, 4, 5];

export default function CobroScreen({ navigation }) {
  const [calificacion, setCalificacion] = useState(0);
  const [cobrado, setCobrado] = useState(false);

  const handleFinalizar = () => {
    setCobrado(true);
    setTimeout(() => navigation.navigate('Disponibles'), 1500);
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
            <Text style={styles.pagoIconoText}>💸</Text>
          </View>
          <Text style={styles.pagoLabel}>Pago acreditado</Text>
          <Text style={styles.pagoValor}>${RESUMEN_MOCK.precio.toLocaleString('es-AR')}</Text>
          <View style={styles.pagoMetodo}>
            <Text style={styles.pagoMetodoText}>{RESUMEN_MOCK.metodoPago}</Text>
          </View>
        </View>

        {/* Resumen viaje */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles del viaje</Text>
          <View style={styles.filaInfo}>
            <Text style={styles.filaLabel}>Ruta</Text>
            <Text style={styles.filaValor} numberOfLines={1}>{RESUMEN_MOCK.origen} → {RESUMEN_MOCK.destino}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.filaInfo}>
            <Text style={styles.filaLabel}>Distancia</Text>
            <Text style={styles.filaValor}>{RESUMEN_MOCK.distanciaKm} km</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.filaInfo}>
            <Text style={styles.filaLabel}>Paradas</Text>
            <Text style={styles.filaValor}>{RESUMEN_MOCK.paradas}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.filaInfo}>
            <Text style={styles.filaLabel}>Duración</Text>
            <Text style={styles.filaValor}>{RESUMEN_MOCK.duracionMin} min</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.filaInfo}>
            <Text style={styles.filaLabel}>Cliente</Text>
            <Text style={styles.filaValor}>{RESUMEN_MOCK.cliente}</Text>
          </View>
        </View>

        {/* Calificación recibida del cliente */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calificación recibida</Text>
          <View style={styles.estrellasRecibidas}>
            {ESTRELLAS.map((e) => (
              <Text key={e} style={[styles.estrellaRecibida, e <= 5 && styles.estrellaRecibidaActiva]}>★</Text>
            ))}
          </View>
          <Text style={styles.calificacionLabel}>El cliente te dio 5 estrellas</Text>
        </View>

        {/* Calificar al cliente */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calificá al cliente</Text>
          <Text style={styles.calificacionSub}>{RESUMEN_MOCK.cliente}</Text>
          <View style={styles.estrellasRow}>
            {ESTRELLAS.map((e) => (
              <TouchableOpacity key={e} onPress={() => setCalificacion(e)} activeOpacity={0.7}>
                <Text style={[styles.estrellaBtn, e <= calificacion && styles.estrellaBtnActiva]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          {calificacion > 0 && (
            <Text style={styles.calificacionTexto}>
              {calificacion === 5 ? 'Excelente cliente' :
               calificacion >= 4 ? 'Buen cliente' :
               calificacion >= 3 ? 'Cliente normal' : 'Cliente con problemas'}
            </Text>
          )}
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
  pagoMetodo: {
    backgroundColor: `${colors.primary}22`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  pagoMetodoText: { fontSize: fontSize.caption, color: colors.primary, fontWeight: '700' },

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
