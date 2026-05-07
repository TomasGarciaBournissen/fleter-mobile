import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';

const DESTINATARIO_MOCK = {
  nombre: 'María López',
  dni: '32.456.789',
  telefono: '+54 11 4444-5678',
  direccion: 'Defensa 1234, San Telmo',
};

export default function QREntregaScreen({ navigation }) {
  const [escaneado, setEscaneado] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  const handleSimularEscaneo = () => setEscaneado(true);

  const handleConfirmar = () => {
    setConfirmado(true);
    setTimeout(() => navigation.navigate('Cobro'), 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entrega QR</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {!escaneado ? (
          <>
            {/* Visor QR */}
            <View style={styles.qrSection}>
              <Text style={styles.qrInstruccion}>Apuntá la cámara al código QR del destinatario</Text>
              <TouchableOpacity style={styles.qrVisor} onPress={handleSimularEscaneo} activeOpacity={0.9}>
                <View style={styles.qrCorner} />
                <View style={[styles.qrCorner, styles.qrCornerTR]} />
                <View style={[styles.qrCorner, styles.qrCornerBL]} />
                <View style={[styles.qrCorner, styles.qrCornerBR]} />
                <View style={styles.qrLinea} />
                <Text style={styles.qrPlaceholderText}>📷</Text>
                <Text style={styles.qrPlaceholderSub}>Tocar para simular escaneo</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnManual} onPress={handleSimularEscaneo}>
              <Text style={styles.btnManualText}>Ingresar código manualmente</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Datos del destinatario */}
            <View style={styles.exitoHeader}>
              <View style={styles.exitoIcono}>
                <Text style={styles.exitoIconoText}>✓</Text>
              </View>
              <Text style={styles.exitoTitulo}>QR validado</Text>
              <Text style={styles.exitoSub}>Datos del destinatario confirmados</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Destinatario</Text>
              <View style={styles.filaInfo}>
                <Text style={styles.filaLabel}>Nombre</Text>
                <Text style={styles.filaValor}>{DESTINATARIO_MOCK.nombre}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.filaInfo}>
                <Text style={styles.filaLabel}>DNI</Text>
                <Text style={styles.filaValor}>{DESTINATARIO_MOCK.dni}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.filaInfo}>
                <Text style={styles.filaLabel}>Teléfono</Text>
                <Text style={styles.filaValor}>{DESTINATARIO_MOCK.telefono}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.filaInfo}>
                <Text style={styles.filaLabel}>Dirección</Text>
                <Text style={styles.filaValor}>{DESTINATARIO_MOCK.direccion}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btnConfirmar, confirmado && styles.btnConfirmado]}
              onPress={handleConfirmar}
              disabled={confirmado}
              activeOpacity={0.85}
            >
              <Text style={styles.btnConfirmarText}>
                {confirmado ? '✓ Entrega confirmada' : 'Confirmar entrega'}
              </Text>
            </TouchableOpacity>
          </>
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

  content: { flex: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  qrSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qrInstruccion: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  qrVisor: {
    width: 260,
    height: 260,
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qrCorner: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
    borderTopLeftRadius: 4,
  },
  qrCornerTR: { left: undefined, right: 12, borderLeftWidth: 0, borderRightWidth: 3, borderTopLeftRadius: 0, borderTopRightRadius: 4 },
  qrCornerBL: { top: undefined, bottom: 12, borderTopWidth: 0, borderBottomWidth: 3, borderTopLeftRadius: 0, borderBottomLeftRadius: 4 },
  qrCornerBR: { top: undefined, left: undefined, bottom: 12, right: 12, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 3, borderBottomWidth: 3, borderTopLeftRadius: 0, borderBottomRightRadius: 4 },
  qrLinea: {
    position: 'absolute',
    height: 2,
    left: 20,
    right: 20,
    backgroundColor: `${colors.primary}88`,
    top: '50%',
  },
  qrPlaceholderText: { fontSize: 48, marginBottom: spacing.sm },
  qrPlaceholderSub: { fontSize: fontSize.caption, color: colors.textHint },

  btnManual: {
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  btnManualText: { fontSize: fontSize.body, color: colors.textSecondary, fontWeight: '600' },

  exitoHeader: { alignItems: 'center', paddingVertical: spacing.lg },
  exitoIcono: {
    width: 72, height: 72,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}22`,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  exitoIconoText: { fontSize: 32, color: colors.primary, fontWeight: '800' },
  exitoTitulo: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  exitoSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 4 },

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
  filaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.surface3 },

  btnConfirmar: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnConfirmado: { backgroundColor: colors.success, opacity: 0.8 },
  btnConfirmarText: { fontSize: fontSize.h3, fontWeight: '800', color: '#000' },
});
