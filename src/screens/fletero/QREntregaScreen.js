import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import api from '../../services/api';

export default function QREntregaScreen({ navigation, route }) {
  const { viajeId } = route.params ?? {};

  const [permisoOk,    setPermisoOk]    = useState(null); // null=cargando, true, false
  const [escaneando,   setEscaneando]   = useState(true);
  const [validando,    setValidando]    = useState(false);
  const [destinatario, setDestinatario] = useState(null);
  const [confirmando,  setConfirmando]  = useState(false);
  const [modalManual,  setModalManual]  = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const scannedRef = useRef(false);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync().then(({ status }) => {
      setPermisoOk(status === 'granted');
    });
  }, []);

  const validarToken = async (token) => {
    if (!token?.trim()) return;
    setValidando(true);
    try {
      const { data } = await api.post(`/api/viajes/${viajeId}/confirmar-entrega`, { qr_token: token.trim() });
      setDestinatario(data.destinatario ?? data);
      setEscaneando(false);
    } catch (e) {
      scannedRef.current = false; // permitir reintentar
      const msg = e?.response?.data?.error ?? 'QR inválido o no corresponde a este viaje';
      Alert.alert('QR inválido', msg, [{ text: 'Reintentar' }]);
    } finally {
      setValidando(false);
    }
  };

  const handleScan = ({ data }) => {
    if (scannedRef.current || validando) return;
    scannedRef.current = true;
    validarToken(data);
  };

  const handleManual = () => {
    setModalManual(false);
    validarToken(codigoManual);
    setCodigoManual('');
  };

  const handleConfirmar = async () => {
    setConfirmando(true);
    try {
      navigation.replace('Cobro', { viajeId });
    } catch {
      setConfirmando(false);
    }
  };

  // ── Permiso denegado ────────────────────────────────────────────────────────
  if (permisoOk === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entrega QR</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centrado}>
          <Ionicons name="camera-off-outline" size={48} color={colors.textHint} />
          <Text style={styles.permisoDenegadoTitulo}>Sin acceso a la cámara</Text>
          <Text style={styles.permisoDenegadoSub}>
            Habilitá el permiso de cámara en Configuración para escanear el QR.
          </Text>
          <TouchableOpacity style={styles.btnPrimario} onPress={() => setModalManual(true)}>
            <Text style={styles.btnPrimarioText}>Ingresar código manualmente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Cargando permisos ───────────────────────────────────────────────────────
  if (permisoOk === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entrega QR</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Scanner ─────────────────────────────────────────────────────────── */}
      {escaneando ? (
        <View style={styles.scannerWrap}>
          <Text style={styles.instruccion}>
            Apuntá la cámara al código QR del destinatario
          </Text>

          <View style={styles.scannerContainer}>
            <BarCodeScanner
              style={styles.scanner}
              onBarCodeScanned={handleScan}
              barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
            />
            {/* Esquinas del visor */}
            <View style={styles.overlay}>
              <View style={styles.qrCorner} />
              <View style={[styles.qrCorner, styles.qrCornerTR]} />
              <View style={[styles.qrCorner, styles.qrCornerBL]} />
              <View style={[styles.qrCorner, styles.qrCornerBR]} />
              <View style={styles.qrLinea} />
            </View>

            {validando && (
              <View style={styles.validandoOverlay}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.validandoText}>Validando QR...</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.btnManual} onPress={() => setModalManual(true)}>
            <Ionicons name="keypad-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.btnManualText}> Ingresar código manualmente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── QR validado — datos del destinatario ──────────────────────────── */
        <View style={styles.content}>
          <View style={styles.exitoHeader}>
            <View style={styles.exitoIcono}>
              <Ionicons name="checkmark" size={36} color={colors.success} />
            </View>
            <Text style={styles.exitoTitulo}>QR validado</Text>
            <Text style={styles.exitoSub}>Datos del destinatario confirmados</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Destinatario</Text>
            {destinatario?.nombre ? (
              <FilaInfo label="Nombre" valor={destinatario.nombre} />
            ) : null}
            {destinatario?.dni ? (
              <FilaInfo label="DNI" valor={destinatario.dni} />
            ) : null}
            {destinatario?.telefono ? (
              <FilaInfo label="Teléfono" valor={destinatario.telefono} />
            ) : null}
            {destinatario?.direccion ? (
              <FilaInfo label="Dirección" valor={destinatario.direccion} />
            ) : null}
            {!destinatario && (
              <Text style={styles.sinDatos}>Entrega confirmada por el servidor</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.btnPrimario, confirmando && { opacity: 0.6 }]}
            onPress={handleConfirmar}
            disabled={confirmando}
            activeOpacity={0.85}
          >
            {confirmando
              ? <ActivityIndicator color={colors.textPrimary} />
              : <Text style={styles.btnPrimarioText}>Confirmar entrega</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modal ingreso manual ─────────────────────────────────────────────── */}
      <Modal visible={modalManual} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitulo}>Ingresar código manual</Text>
            <Text style={styles.modalSub}>
              Encontrá el código en el comprobante del destinatario
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Código QR"
              placeholderTextColor={colors.textHint}
              value={codigoManual}
              onChangeText={setCodigoManual}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={() => { setModalManual(false); setCodigoManual(''); }}
              >
                <Text style={styles.modalBtnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimario, { flex: 2 }]}
                onPress={handleManual}
                disabled={!codigoManual.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.btnPrimarioText}>Validar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FilaInfo({ label, valor }) {
  return (
    <>
      <View style={styles.filaInfo}>
        <Text style={styles.filaLabel}>{label}</Text>
        <Text style={styles.filaValor}>{valor}</Text>
      </View>
      <View style={styles.divider} />
    </>
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
    backgroundColor: colors.surface1, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },

  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },

  // Scanner
  scannerWrap: { flex: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  instruccion: {
    fontSize: fontSize.body, color: colors.textSecondary,
    textAlign: 'center', marginBottom: spacing.lg,
  },
  scannerContainer: {
    flex: 1, borderRadius: radius.xl, overflow: 'hidden',
    backgroundColor: '#000', position: 'relative',
  },
  scanner: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },

  qrCorner: {
    position: 'absolute', top: 40, left: 40,
    width: 36, height: 36,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderColor: colors.primary, borderTopLeftRadius: 4,
  },
  qrCornerTR: { left: undefined, right: 40, borderLeftWidth: 0, borderRightWidth: 3, borderTopLeftRadius: 0, borderTopRightRadius: 4 },
  qrCornerBL: { top: undefined, bottom: 40, borderTopWidth: 0, borderBottomWidth: 3, borderTopLeftRadius: 0, borderBottomLeftRadius: 4 },
  qrCornerBR: { top: undefined, left: undefined, bottom: 40, right: 40, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 3, borderBottomWidth: 3, borderTopLeftRadius: 0, borderBottomRightRadius: 4 },
  qrLinea: {
    position: 'absolute', height: 2, left: 40, right: 40,
    backgroundColor: `${colors.primary}99`,
  },

  validandoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  validandoText: { color: '#fff', fontSize: fontSize.body, fontWeight: '600' },

  btnManual: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.md, paddingVertical: spacing.sm,
  },
  btnManualText: { fontSize: fontSize.body, color: colors.textSecondary, fontWeight: '600' },

  // Post-scan
  content: { flex: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  exitoHeader: { alignItems: 'center', paddingVertical: spacing.lg },
  exitoIcono: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: `${colors.success}22`, borderWidth: 2, borderColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  exitoTitulo: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  exitoSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 4 },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  filaInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  filaLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  filaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary, flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.surface3 },
  sinDatos: { fontSize: fontSize.body, color: colors.textHint, textAlign: 'center', paddingVertical: spacing.sm },

  btnPrimario: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  btnPrimarioText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },

  permisoDenegadoTitulo: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  permisoDenegadoSub: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Modal manual
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xl + spacing.md,
    gap: spacing.sm,
  },
  modalTitulo: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  modalSub: { fontSize: fontSize.body, color: colors.textSecondary },
  modalInput: {
    backgroundColor: colors.surface1, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    fontSize: fontSize.body, color: colors.textPrimary, marginTop: spacing.sm,
  },
  modalBotones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalBtnCancelar: {
    flex: 1, borderWidth: 1, borderColor: colors.surface3,
    borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center',
  },
  modalBtnCancelarText: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },
});
