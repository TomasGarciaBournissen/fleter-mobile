import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, TextInput, Modal, ScrollView,
} from 'react-native';
let CameraView = null;
let Camera = null;
try {
  ({ CameraView, Camera } = require('expo-camera'));
} catch {}
const SCANNER_DISPONIBLE = CameraView != null;
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import api from '../../services/api';

export default function QREntregaScreen({ navigation, route }) {
  const { viajeId, paradas = [] } = route.params ?? {};

  // paradas pendientes ordenadas por orden
  const paradasPendientes = paradas
    .filter(p => p.estado !== 'ENTREGADO')
    .sort((a, b) => a.orden - b.orden);

  const [paradaIdx,    setParadaIdx]    = useState(0);
  const [permisoOk,    setPermisoOk]    = useState(null);
  const [validando,    setValidando]    = useState(false);
  const [confirmada,   setConfirmada]   = useState(false);
  const [viajeFinalizado, setViajeFinalizado] = useState(false);
  const [precioReal,   setPrecioReal]   = useState(null);
  const [remitoUrl,    setRemitoUrl]    = useState(null);
  const [modalManual,  setModalManual]  = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const scannedRef = useRef(false);

  const paradaActual = paradasPendientes[paradaIdx] ?? null;

  useEffect(() => {
    if (!SCANNER_DISPONIBLE) {
      setPermisoOk(false);
      return;
    }
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setPermisoOk(status === 'granted');
    });
  }, []);

  const validarQR = async (qrFirmado) => {
    if (!qrFirmado?.trim()) return;
    setValidando(true);
    try {
      // Obtener posición GPS actual para validación de proximidad
      let lat = 0, lng = 0;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } catch {}

      const { data } = await api.post(`/api/viajes/${viajeId}/confirmar-parada`, {
        qr_firmado: qrFirmado.trim(),
        lat,
        lng,
      });

      if (data.viaje_finalizado) {
        setViajeFinalizado(true);
        setPrecioReal(data.precio_real);
        setRemitoUrl(data.remito_url);
        setConfirmada(true);
      } else {
        // Quedan más paradas
        const siguiente = paradaIdx + 1;
        if (siguiente < paradasPendientes.length) {
          setParadaIdx(siguiente);
          scannedRef.current = false;
        } else {
          setConfirmada(true);
        }
      }
    } catch (e) {
      scannedRef.current = false;
      const msg = e?.response?.data?.error ?? 'QR inválido o no corresponde a esta parada';
      Alert.alert('Error al confirmar', msg, [{ text: 'Reintentar' }]);
    } finally {
      setValidando(false);
    }
  };

  const handleScan = ({ data }) => {
    if (scannedRef.current || validando) return;
    scannedRef.current = true;
    validarQR(data);
  };

  const handleManual = () => {
    setModalManual(false);
    validarQR(codigoManual);
    setCodigoManual('');
  };

  const handleIrACobro = () => {
    navigation.replace('Cobro', { viajeId, precioReal, remitoUrl });
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
          <Ionicons name={SCANNER_DISPONIBLE ? 'camera-off-outline' : 'qr-code-outline'} size={48} color={colors.textHint} />
          <Text style={styles.permisoDenegadoTitulo}>
            {SCANNER_DISPONIBLE ? 'Sin acceso a la cámara' : 'Escáner no disponible en Expo Go'}
          </Text>
          <Text style={styles.permisoDenegadoSub}>
            {SCANNER_DISPONIBLE
              ? 'Habilitá el permiso de cámara en Configuración para escanear el QR.'
              : 'Pedile al cliente el texto del QR e ingresalo manualmente para confirmar la entrega.'}
          </Text>
          <TouchableOpacity style={styles.btnPrimario} onPress={() => setModalManual(true)}>
            <Text style={styles.btnPrimarioText}>Ingresar código manualmente</Text>
          </TouchableOpacity>
        </View>

        {/* Modal manual — necesita estar acá también para el early return de Expo Go */}
        <Modal visible={modalManual} transparent animationType="slide">
          <KeyboardAvoidingView
            style={styles.modalKAV}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => { setModalManual(false); setCodigoManual(''); }} />
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitulo}>Ingresar código QR</Text>
              <Text style={styles.modalSub}>Copiá el código que muestra el cliente en pantalla</Text>
              <TextInput
                style={styles.modalInput}
                value={codigoManual}
                onChangeText={setCodigoManual}
                placeholder="Pegá el código aquí..."
                placeholderTextColor={colors.textHint}
                multiline
                autoFocus
              />
              <View style={styles.modalBotones}>
                <TouchableOpacity style={styles.modalBtnCancelar} onPress={() => { setModalManual(false); setCodigoManual(''); }}>
                  <Text style={styles.modalBtnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtnConfirmar, !codigoManual.trim() && { opacity: 0.4 }]}
                  onPress={handleManual}
                  disabled={!codigoManual.trim()}
                >
                  {validando
                    ? <ActivityIndicator color={colors.textPrimary} />
                    : <Text style={styles.modalBtnConfirmarText}>Confirmar</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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

  // ── Sin paradas para escanear ───────────────────────────────────────────────
  if (paradasPendientes.length === 0) {
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
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
          <Text style={styles.permisoDenegadoTitulo}>Todas las paradas confirmadas</Text>
          <TouchableOpacity style={styles.btnPrimario} onPress={handleIrACobro}>
            <Text style={styles.btnPrimarioText}>Ver cobro</Text>
          </TouchableOpacity>
        </View>
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

      {/* Indicador de parada actual */}
      {paradasPendientes.length > 1 && (
        <View style={styles.paradaIndicador}>
          <Text style={styles.paradaIndicadorText}>
            Parada {paradaIdx + 1} de {paradasPendientes.length}
          </Text>
          {paradaActual?.direccion ? (
            <Text style={styles.paradaDireccion} numberOfLines={1}>{paradaActual.direccion}</Text>
          ) : null}
        </View>
      )}

      {/* ── QR confirmado ───────────────────────────────────────────────────── */}
      {confirmada ? (
        <View style={styles.content}>
          <View style={styles.exitoHeader}>
            <View style={styles.exitoIcono}>
              <Ionicons name="checkmark" size={36} color={colors.success} />
            </View>
            <Text style={styles.exitoTitulo}>
              {viajeFinalizado ? 'Viaje finalizado' : 'Parada confirmada'}
            </Text>
            <Text style={styles.exitoSub}>
              {viajeFinalizado
                ? 'Todas las paradas fueron entregadas'
                : 'Podés continuar al siguiente destino'}
            </Text>
          </View>

          {viajeFinalizado && precioReal != null && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resumen</Text>
              <View style={styles.filaInfo}>
                <Text style={styles.filaLabel}>Total del viaje</Text>
                <Text style={styles.filaPrecio}>${precioReal.toLocaleString('es-AR')}</Text>
              </View>
              {remitoUrl ? (
                <View style={styles.filaInfo}>
                  <Text style={styles.filaLabel}>Remito generado</Text>
                  <Ionicons name="document-outline" size={16} color={colors.success} />
                </View>
              ) : null}
            </View>
          )}

          <TouchableOpacity style={styles.btnPrimario} onPress={handleIrACobro} activeOpacity={0.85}>
            <Text style={styles.btnPrimarioText}>
              {viajeFinalizado ? 'Ver cobro' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Scanner ──────────────────────────────────────────────────────── */
        <View style={styles.scannerWrap}>
          <Text style={styles.instruccion}>
            {paradaActual?.direccion
              ? `Escaneá el QR en: ${paradaActual.direccion}`
              : 'Apuntá la cámara al código QR del destinatario'}
          </Text>

          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.scanner}
              onBarcodeScanned={handleScan}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
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

  paradaIndicador: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.surface2, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  paradaIndicadorText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  paradaDireccion:     { fontSize: fontSize.body, color: colors.textPrimary, fontWeight: '600', marginTop: 2 },

  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },

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

  content: { flex: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  exitoHeader: { alignItems: 'center', paddingVertical: spacing.lg },
  exitoIcono: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: `${colors.success}22`, borderWidth: 2, borderColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  exitoTitulo: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  exitoSub:    { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  filaInfo:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  filaLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  filaPrecio: { fontSize: fontSize.h2, fontWeight: '800', color: colors.primary },

  btnPrimario: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  btnPrimarioText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },

  permisoDenegadoTitulo: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  permisoDenegadoSub:    { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  modalKAV:     { flex: 1, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xl + spacing.md,
    gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 16,
  },
  modalTitulo: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  modalSub:    { fontSize: fontSize.body, color: colors.textSecondary },
  modalInput: {
    backgroundColor: colors.surface1, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    fontSize: fontSize.body, color: colors.textPrimary,
    minHeight: 80, textAlignVertical: 'top',
  },
  modalBotones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  modalBtnCancelar: {
    flex: 1, borderWidth: 1, borderColor: colors.surface3,
    borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center',
    backgroundColor: colors.surface1,
  },
  modalBtnCancelarText: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },
  modalBtnConfirmar: {
    flex: 2, backgroundColor: colors.primary,
    borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center',
  },
  modalBtnConfirmarText: { fontSize: fontSize.body, fontWeight: '800', color: colors.textPrimary },
});
