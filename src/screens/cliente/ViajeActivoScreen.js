import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Linking, Platform, Modal, Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../components/MapViewWrapper';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { formatPrecio } from '../../utils/format';

const TIMELINE_ESTADOS = [
  { id: 'CONDUCTOR_ASIGNADO', label: 'Fletero asignado' },
  { id: 'EN_CAMINO_A_ORIGEN', label: 'En camino al origen' },
  { id: 'CARGANDO',           label: 'Cargando mercadería' },
  { id: 'EN_RUTA',            label: 'En ruta' },
  { id: 'DESCARGANDO',        label: 'Descargando' },
  { id: 'FINALIZADO',         label: 'Entregado' },
];

function estadoIndex(e) {
  return TIMELINE_ESTADOS.findIndex(s => s.id === e);
}

const ESTADO_BADGE_LABELS = {
  CONDUCTOR_ASIGNADO: 'ASIGNADO',
  EN_CAMINO_A_ORIGEN: 'EN CAMINO',
  CARGANDO:           'CARGANDO',
  EN_RUTA:            'EN RUTA',
  DESCARGANDO:        'DESCARGANDO',
  FINALIZADO:         'ENTREGADO',
  CANCELADO:          'CANCELADO',
};

export default function ViajeActivoScreen({ navigation, route }) {
  const { viajeId, conductor: conductorParam, vehiculo: vehiculoParam } = route.params ?? {};
  const { socket } = useSocket();

  const [viaje,          setViaje]        = useState(null);
  const [estado,         setEstado]       = useState('CONDUCTOR_ASIGNADO');
  const [conductorPos,   setConductorPos] = useState(null);
  const [alertaDesvio,   setAlertaDesvio] = useState(null);
  const [alertaParada,   setAlertaParada] = useState(null);
  const [velocidad,      setVelocidad]    = useState(null);
  const [cargando,       setCargando]     = useState(true);
  const [cancelando,     setCancelando]   = useState(false);
  const [qrParadas,      setQrParadas]    = useState([]);
  const [modalQR,        setModalQR]      = useState(false);
  const [qrParadaIdx,    setQrParadaIdx]  = useState(0);
  const conductorMarkerRef = useRef(null);

  // Fetch trip data + QR tokens
  useEffect(() => {
    if (!viajeId) { setCargando(false); return; }
    api.get(`/api/viajes/${viajeId}`)
      .then(({ data }) => { setViaje(data); setEstado(data.estado); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [viajeId]);

  // Cargar QRs cuando el viaje llega a CARGANDO o posterior
  useEffect(() => {
    const estadosConQR = ['CARGANDO', 'EN_RUTA', 'DESCARGANDO'];
    if (!viajeId || !estadosConQR.includes(estado) || qrParadas.length > 0) return;
    api.get(`/api/viajes/${viajeId}/qr-paradas`)
      .then(({ data }) => setQrParadas(data ?? []))
      .catch(() => {});
  }, [estado, viajeId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onMapaActualizar = (data) => {
      setConductorPos({ latitude: data.lat, longitude: data.lng });
      if (data.velocidad_kmh != null) setVelocidad(data.velocidad_kmh);
    };

    const onEstadoCambiado = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      setEstado(data.estado_nuevo);
    };

    const onAlertaDesvio = (data) => {
      setAlertaDesvio(data.mensaje);
      // Auto-dismiss after 10s
      setTimeout(() => setAlertaDesvio(null), 10000);
    };

    const onAlertaParada = (data) => {
      setAlertaParada(data.mensaje);
      setTimeout(() => setAlertaParada(null), 10000);
    };

    const onFinalizado = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      setEstado('FINALIZADO');
    };

    socket.on('mapa:actualizar',       onMapaActualizar);
    socket.on('viaje:estado_cambiado', onEstadoCambiado);
    socket.on('alerta:desvio',         onAlertaDesvio);
    socket.on('alerta:parada',         onAlertaParada);
    socket.on('viaje:finalizado',      onFinalizado);

    return () => {
      socket.off('mapa:actualizar',       onMapaActualizar);
      socket.off('viaje:estado_cambiado', onEstadoCambiado);
      socket.off('alerta:desvio',         onAlertaDesvio);
      socket.off('alerta:parada',         onAlertaParada);
      socket.off('viaje:finalizado',      onFinalizado);
    };
  }, [socket, viajeId]);

  const paradas = viaje?.paradas?.slice().sort((a, b) => a.orden - b.orden) ?? [];
  const origen  = paradas[0];
  const destino = paradas[paradas.length - 1];
  const mostrarQR = ['CARGANDO', 'EN_RUTA', 'DESCARGANDO', 'FINALIZADO'].includes(estado);
  const qrActual  = qrParadas[qrParadaIdx] ?? null;

  const conductorNombre = conductorParam
    ? `${conductorParam.nombre} ${conductorParam.apellido}`.trim()
    : viaje?.conductor?.usuario ? `${viaje.conductor.usuario.nombre} ${viaje.conductor.usuario.apellido}`.trim() : '';
  const conductorTel   = viaje?.conductor?.usuario?.telefono ?? '';
  const conductorCalif = conductorParam?.calificacion_promedio ?? viaje?.conductor?.calificacion_promedio;
  const vehiculoInfo   = vehiculoParam
    ? `${vehiculoParam.marca} ${vehiculoParam.modelo} · ${vehiculoParam.patente}`
    : '';

  const handleCancelar = () => {
    Alert.alert(
      'Cancelar viaje',
      '¿Seguro que querés cancelar? Esta acción no se puede deshacer.',
      [
        { text: 'No, continuar', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelando(true);
            try {
              await api.patch(`/api/viajes/${viajeId}/estado`, { estado: 'CANCELADO' });
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } catch (e) {
              const msg = e?.response?.data?.error ?? 'No se pudo cancelar el viaje';
              Alert.alert('Error', msg);
            } finally {
              setCancelando(false);
            }
          },
        },
      ]
    );
  };

  const precioEstimado = viaje?.precio_estimado ? `$${formatPrecio(viaje.precio_estimado)}` : '—';
  const estadoIdx = estadoIndex(estado);
  const badgeLabel = ESTADO_BADGE_LABELS[estado] ?? estado;

  const initialRegion = conductorPos
    ? { latitude: conductorPos.latitude, longitude: conductorPos.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 }
    : origen?.latitud
      ? { latitude: origen.latitud, longitude: origen.longitud, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  if (cargando) {
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
        <Text style={styles.headerTitle}>Viaje en curso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Alertas */}
        {alertaDesvio ? (
          <TouchableOpacity style={styles.alertaBanner} onPress={() => setAlertaDesvio(null)}>
            <Ionicons name="warning-outline" size={16} color={colors.error} />
            <Text style={styles.alertaBannerText}> {alertaDesvio}</Text>
          </TouchableOpacity>
        ) : null}
        {alertaParada ? (
          <TouchableOpacity style={[styles.alertaBanner, styles.alertaBannerWarning]} onPress={() => setAlertaParada(null)}>
            <Ionicons name="pause-circle-outline" size={16} color={colors.warning} />
            <Text style={[styles.alertaBannerText, { color: colors.warning }]}> {alertaParada}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Estado + Costo */}
        <View style={styles.estadoCard}>
          <View>
            <Text style={styles.estadoLabel}>Estado del viaje</Text>
            <View style={styles.badgeActivo}>
              <Text style={styles.badgeActivoText}>{badgeLabel}</Text>
            </View>
            {velocidad != null && (
              <Text style={styles.velocidadText}>{velocidad} km/h</Text>
            )}
          </View>
          <View style={styles.costoBlock}>
            <Text style={styles.costoLabel}>Total acordado</Text>
            <Text style={styles.costoValor}>{precioEstimado}</Text>
          </View>
        </View>

        {/* Mapa */}
        <View style={styles.mapaContainer}>
          <MapView
            style={styles.mapa}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {conductorPos && (
              <Marker coordinate={conductorPos} title="Fletero" ref={conductorMarkerRef}>
                <View style={styles.markerConductor}>
                  <Ionicons name="car" size={14} color={colors.textPrimary} />
                </View>
              </Marker>
            )}
            {origen?.latitud ? (
              <Marker
                coordinate={{ latitude: origen.latitud, longitude: origen.longitud }}
                title="Origen"
                pinColor={colors.primary}
              />
            ) : null}
            {destino?.latitud && destino !== origen ? (
              <Marker
                coordinate={{ latitude: destino.latitud, longitude: destino.longitud }}
                title="Destino"
                pinColor={colors.error}
              />
            ) : null}
          </MapView>
          {!conductorPos && (
            <View style={styles.mapaOverlay}>
              <Ionicons name="locate-outline" size={18} color={colors.textHint} />
              <Text style={styles.mapaOverlayText}> Esperando posición del fletero...</Text>
            </View>
          )}
        </View>

        {/* Ruta */}
        {paradas.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ruta</Text>
            <View style={styles.rutaRow}>
              <View style={styles.rutaDots}>
                <View style={styles.dotOrigen} />
                {paradas.slice(1, -1).map((_, i) => (
                  <React.Fragment key={i}>
                    <View style={styles.rutaLinea} />
                    <View style={styles.dotParada} />
                  </React.Fragment>
                ))}
                <View style={styles.rutaLinea} />
                <View style={styles.dotDestino} />
              </View>
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text style={styles.rutaValor}>{origen?.direccion ?? ''}</Text>
                {paradas.slice(1, -1).map((p, i) => (
                  <Text key={i} style={styles.rutaParada}>{p.direccion}</Text>
                ))}
                <Text style={styles.rutaValor}>{destino?.direccion ?? ''}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Fletero */}
        {conductorNombre ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fletero</Text>
            <View style={styles.fleteroRow}>
              <View style={styles.fleteroAvatar}>
                <Text style={styles.fleteroAvatarText}>{conductorNombre.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fleteroNombre}>{conductorNombre}</Text>
                {vehiculoInfo ? <Text style={styles.fleteroInfo}>{vehiculoInfo}</Text> : null}
              </View>
              {conductorCalif != null && (
                <View style={styles.puntajeChip}>
                  <Ionicons name="star" size={13} color={colors.warning} />
                  <Text style={styles.puntajeText}> {conductorCalif}</Text>
                </View>
              )}
            </View>
            {conductorTel ? (
              <>
                <View style={styles.divider} />
                <View style={styles.accionesRow}>
                  <TouchableOpacity style={styles.btnAccion} onPress={() => Linking.openURL(`tel:${conductorTel}`)}>
                    <Ionicons name="call-outline" size={16} color={colors.primary} />
                    <Text style={styles.btnAccionText}> Llamar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnAccion} onPress={() => Linking.openURL(`sms:${conductorTel}`)}>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                    <Text style={styles.btnAccionText}> Mensaje</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado del viaje</Text>
          {TIMELINE_ESTADOS.map((item, i) => {
            const hecho  = i <= estadoIdx;
            const activo = i === estadoIdx;
            const isLast = i === TIMELINE_ESTADOS.length - 1;
            return (
              <View key={item.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    hecho  && !activo && styles.timelineDotHecho,
                    activo && styles.timelineDotActivo,
                  ]}>
                    {hecho && !activo && <View style={styles.timelineDotInner} />}
                  </View>
                  {!isLast && <View style={[styles.timelineLinea, hecho && !activo && styles.timelineLineaActiva]} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineLabel,
                    activo && styles.timelineLabelActivo,
                    !hecho && styles.timelineLabelInactivo,
                  ]}>
                    {item.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* QR de entrega — visible desde CARGANDO en adelante */}
        {mostrarQR && qrParadas.length > 0 && (
          <View style={styles.card}>
            <View style={styles.qrHeader}>
              <Text style={styles.cardTitle}>Código QR de entrega</Text>
              {qrParadas.length > 1 && (
                <View style={styles.qrPaginador}>
                  <TouchableOpacity
                    disabled={qrParadaIdx === 0}
                    onPress={() => setQrParadaIdx(i => i - 1)}
                    style={[styles.qrPagBtn, qrParadaIdx === 0 && { opacity: 0.3 }]}
                  >
                    <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.qrPagText}>{qrParadaIdx + 1}/{qrParadas.length}</Text>
                  <TouchableOpacity
                    disabled={qrParadaIdx === qrParadas.length - 1}
                    onPress={() => setQrParadaIdx(i => i + 1)}
                    style={[styles.qrPagBtn, qrParadaIdx === qrParadas.length - 1 && { opacity: 0.3 }]}
                  >
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {qrActual?.direccion ? (
              <Text style={styles.qrSub} numberOfLines={1}>{qrActual.direccion}</Text>
            ) : null}
            <TouchableOpacity style={styles.qrPreviewWrap} onPress={() => setModalQR(true)} activeOpacity={0.85}>
              <QRCode value={qrActual.qr_firmado} size={120} color={colors.textPrimary} backgroundColor={colors.surface1} />
              <View style={styles.qrAgrandar}>
                <Ionicons name="expand-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.qrAgrandarText}> Tocar para agrandar</Text>
              </View>
            </TouchableOpacity>
            {/* Código en texto para Expo Go — el conductor puede copiarlo manualmente */}
            <View style={styles.qrTextoWrap}>
              <Text style={styles.qrTextoLabel}>Código para ingreso manual:</Text>
              <Text style={styles.qrTexto} selectable>{qrActual.qr_firmado}</Text>
            </View>
          </View>
        )}

        {mostrarQR && qrParadas.length === 0 && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: spacing.lg }]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.qrSub, { textAlign: 'center', marginTop: spacing.sm }]}>
              Cargando códigos QR...
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Modal QR pantalla completa */}
      <Modal visible={modalQR} transparent animationType="fade">
        <TouchableOpacity style={styles.modalQROverlay} activeOpacity={1} onPress={() => setModalQR(false)}>
          <View style={styles.modalQRSheet}>
            <Text style={styles.modalQRTitulo}>Código QR de entrega</Text>
            <Text style={styles.modalQRSub}>
              {qrActual?.direccion ?? 'Mostrá este código al fletero'}
            </Text>
            {qrActual?.qr_firmado && (
              <View style={styles.modalQRBox}>
                <QRCode value={qrActual.qr_firmado} size={220} color={colors.textPrimary} backgroundColor={colors.surface1} />
              </View>
            )}
            <TouchableOpacity style={styles.modalQRCerrar} onPress={() => setModalQR(false)}>
              <Text style={styles.modalQRCerrarText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnCancelar, cancelando && { opacity: 0.5 }]}
          onPress={handleCancelar}
          disabled={cancelando}
          activeOpacity={0.85}
        >
          {cancelando
            ? <ActivityIndicator color={colors.error} />
            : <Text style={styles.btnCancelarText}>Cancelar viaje</Text>
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
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 100 },

  alertaBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: `${colors.error}18`, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.error,
    padding: spacing.sm, marginBottom: spacing.sm,
  },
  alertaBannerWarning: {
    backgroundColor: `${colors.warning}18`, borderColor: colors.warning,
  },
  alertaBannerText: { fontSize: fontSize.body, fontWeight: '600', color: colors.error, flex: 1 },

  estadoCard: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.primary,
    padding: spacing.md, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  estadoLabel: { fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: 4 },
  badgeActivo: {
    backgroundColor: `${colors.primary}22`, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeActivoText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.8 },
  velocidadText:   { fontSize: fontSize.caption, color: colors.textHint, marginTop: 4 },
  costoBlock:  { alignItems: 'flex-end' },
  costoLabel:  { fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: 2 },
  costoValor:  { fontSize: 28, fontWeight: '800', color: colors.textPrimary },

  mapaContainer: {
    height: 230, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.surface3, marginBottom: spacing.md,
  },
  mapa: { flex: 1 },
  mapaOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: `${colors.surface2}CC`,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
  },
  mapaOverlayText: { fontSize: fontSize.body, color: colors.textHint, marginLeft: 4 },

  markerConductor: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    padding: 6, borderWidth: 2, borderColor: colors.textPrimary,
  },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md,
  },

  rutaRow:    { flexDirection: 'row', gap: spacing.sm },
  rutaDots:   { alignItems: 'center', paddingTop: 2, width: 12 },
  dotOrigen:  { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  dotParada:  { width: 8,  height: 8,  borderRadius: radius.full, backgroundColor: colors.warning },
  rutaLinea:  { width: 2,  height: 20, backgroundColor: colors.surface3, marginVertical: 2 },
  rutaValor:  { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  rutaParada: { fontSize: fontSize.body, color: colors.textSecondary },

  fleteroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fleteroAvatar: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  fleteroAvatarText: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  fleteroNombre:     { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },
  fleteroInfo:       { fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  puntajeChip: {
    backgroundColor: `${colors.warning}22`, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center',
  },
  puntajeText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.warning },
  divider:     { height: 1, backgroundColor: colors.surface3, marginVertical: spacing.sm },
  accionesRow: { flexDirection: 'row', gap: spacing.sm },
  btnAccion: {
    flex: 1, borderWidth: 1, borderColor: `${colors.primary}66`,
    borderRadius: radius.md, paddingVertical: spacing.sm,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  btnAccionText: { fontSize: fontSize.body, color: colors.primary, fontWeight: '600' },

  timelineRow:     { flexDirection: 'row', gap: spacing.sm },
  timelineLeft:    { alignItems: 'center', width: 16 },
  timelineDot: {
    width: 12, height: 12, borderRadius: radius.full,
    backgroundColor: colors.surface3, borderWidth: 2, borderColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineDotHecho:  { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineDotActivo: { backgroundColor: `${colors.primary}22`, borderColor: colors.primary },
  timelineDotInner:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textPrimary },
  timelineLinea:     { width: 2, flex: 1, backgroundColor: colors.surface3, minHeight: 20 },
  timelineLineaActiva: { backgroundColor: colors.primary },
  timelineContent:   { flex: 1, paddingBottom: spacing.md },
  timelineLabel:     { fontSize: fontSize.body, color: colors.textPrimary, fontWeight: '600' },
  timelineLabelActivo:  { color: colors.primary },
  timelineLabelInactivo:{ color: colors.textHint },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  btnCancelar: {
    borderWidth: 1, borderColor: colors.error, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  btnCancelarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.error },

  qrHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  qrPaginador: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qrPagBtn:    { padding: 4 },
  qrPagText:   { fontSize: fontSize.caption, fontWeight: '700', color: colors.textSecondary },
  qrSub: { fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: spacing.md },
  qrPreviewWrap: { alignItems: 'center', gap: spacing.sm },
  qrAgrandar: { flexDirection: 'row', alignItems: 'center' },
  qrAgrandarText: { fontSize: fontSize.caption, color: colors.textSecondary },
  qrTextoWrap: {
    marginTop: spacing.sm, backgroundColor: colors.surface2,
    borderRadius: radius.md, padding: spacing.sm,
    borderWidth: 1, borderColor: colors.surface3,
  },
  qrTextoLabel: { fontSize: fontSize.caption, color: colors.textHint, marginBottom: 4 },
  qrTexto: {
    fontSize: 10, color: colors.textSecondary,
    fontFamily: 'monospace', lineHeight: 14,
  },

  modalQROverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalQRSheet: {
    backgroundColor: colors.background, borderRadius: radius.xl,
    padding: spacing.xl, alignItems: 'center', width: '85%', gap: spacing.sm,
  },
  modalQRTitulo: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  modalQRSub:    { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center' },
  modalQRBox: {
    padding: spacing.lg, backgroundColor: colors.surface1,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.surface3,
    marginVertical: spacing.md,
  },
  modalQRCerrar: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xl,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.surface3,
  },
  modalQRCerrarText: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },
});
