import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { formatPrecio } from '../../utils/format';

let colors;
let styles;

const COUNTDOWN_SEG = 30;
const ZONA_LABELS = { CABA: 'CABA', PROVINCIA: 'Provincia', MIXTO: 'CABA + Prov.' };

export default function NuevoViajeModal({ viaje, visible, onAceptar, onRechazar }) {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const [segundos, setSegundos] = useState(COUNTDOWN_SEG);
  const animWidth = useRef(new Animated.Value(1)).current;
  const animRef   = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setSegundos(COUNTDOWN_SEG);
    animWidth.setValue(1);

    animRef.current = Animated.timing(animWidth, {
      toValue: 0,
      duration: COUNTDOWN_SEG * 1000,
      useNativeDriver: false,
    });
    animRef.current.start();

    const interval = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) {
          clearInterval(interval);
          onRechazar();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      animRef.current?.stop();
    };
  }, [visible]);

  if (!viaje) return null;

  const sorted = [...(viaje.paradas ?? [])].sort((a, b) => a.orden - b.orden);
  const origen  = sorted[0]?.direccion ?? '';
  const destino = sorted[sorted.length - 1]?.direccion ?? '';
  const paradas = Math.max(0, sorted.length - 2);

  const barColor = animWidth.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [colors.error, colors.warning, colors.primary],
  });

  const barWidth = animWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.titulo}>Nuevo viaje</Text>
            <View style={styles.countdownChip}>
              <Text style={styles.countdownText}>{segundos}s</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: barWidth, backgroundColor: barColor }]} />
          </View>

          <View style={styles.precioRow}>
            <Text style={styles.precioLabel}>Ganás</Text>
            <Text style={styles.precioValor}>
              ${formatPrecio(viaje.precio_estimado) ?? '—'}
            </Text>
            <Text style={styles.zonaChip}>{ZONA_LABELS[viaje.zona] ?? viaje.zona}</Text>
          </View>

          <View style={styles.rutaCard}>
            <View style={styles.rutaDots}>
              <View style={styles.dotOrigen} />
              <View style={styles.rutaLinea} />
              <View style={styles.dotDestino} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rutaValor} numberOfLines={1}>{origen}</Text>
              {paradas > 0 && (
                <Text style={styles.paradasText}>
                  + {paradas} parada{paradas > 1 ? 's' : ''}
                </Text>
              )}
              <Text style={[styles.rutaValor, { marginTop: paradas > 0 ? 2 : spacing.sm }]} numberOfLines={1}>
                {destino}
              </Text>
            </View>
          </View>

          <View style={styles.botonesRow}>
            <TouchableOpacity style={styles.btnRechazar} onPress={onRechazar} activeOpacity={0.8}>
              <Text style={styles.btnRechazarText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAceptar} onPress={onAceptar} activeOpacity={0.85}>
              <Text style={styles.btnAceptarText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 16,
    borderTopWidth: 1,
    borderColor: colors.surface3,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.surface3,
    alignSelf: 'center', marginBottom: spacing.md,
  },

  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.sm,
  },
  titulo: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  countdownChip: {
    backgroundColor: colors.surface2, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.surface3,
  },
  countdownText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },

  progressBar: {
    height: 4, borderRadius: 2,
    backgroundColor: colors.surface3, overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: { height: 4, borderRadius: 2 },

  precioRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.md,
  },
  precioLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  precioValor: { fontSize: fontSize.h1, fontWeight: '800', color: colors.primary, flex: 1 },
  zonaChip: {
    fontSize: fontSize.caption, fontWeight: '700', color: colors.primary,
    backgroundColor: `${colors.primary}18`,
    borderRadius: radius.full, borderWidth: 1, borderColor: `${colors.primary}44`,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },

  rutaCard: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: colors.surface2, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  rutaDots: { alignItems: 'center', paddingTop: 3, width: 12 },
  dotOrigen:  { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  rutaLinea:  { width: 2, flex: 1, minHeight: 24, backgroundColor: colors.surface3, marginVertical: 3 },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  rutaValor:  { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  paradasText: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },

  botonesRow: { flexDirection: 'row', gap: spacing.sm },
  btnRechazar: {
    flex: 1, borderWidth: 1, borderColor: colors.surface3,
    borderRadius: radius.lg, paddingVertical: spacing.md,
    alignItems: 'center', backgroundColor: colors.surface2,
  },
  btnRechazarText: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textSecondary },
  btnAceptar: {
    flex: 2, backgroundColor: colors.primary,
    borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center',
  },
  btnAceptarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.onAccent },
});
