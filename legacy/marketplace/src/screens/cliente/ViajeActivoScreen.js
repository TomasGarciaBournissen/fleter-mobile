import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Linking, Platform, Modal, Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../../components/MapViewWrapper';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { formatPrecio } from '../../utils/format';

let colors;
let styles;

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

function routeToCoords(route) {
  if (!Array.isArray(route)) return [];
  return route.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
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
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const { viajeId, conductor: conductorParam, vehiculo: vehiculoParam } = route.params ?? {};
  const { socket } = useSocket();

  const [viaje,          setViaje]        = useState(null);
  const [estado,         setEstado]       = useState('CONDUCTOR_ASIGNADO');
  const [conductorPos,   setConductorPos] = useState(null);
  const [alertaDesvio,   setAlertaDesvio] = useState(null);
  const [alertaParada,   setAlertaParada] = useState(null);
  const [alertaRuta,     setAlertaRuta]   = useState(false);
  const [velocidad,      setVelocidad]    = useState(null);
  const [eta,            setEta]          = useState(null);
  const [rutaCoords,     setRutaCoords]   = useState([]);
  const [cargando,       setCargando]     = useState(true);
  const [cancelando,     setCancelando]   = useState(false);
  const [mapaFullscreen, setMapaFullscreen] = useState(false);
  const conductorMarkerRef = useRef(null);
  const finalizadoRef      = useRef(false);
  const mapRef       = useRef(null);
  const mapRefFull    = useRef(null);

  // Fetch trip data
  useEffect(() => {
    if (!viajeId) { setCargando(false); return; }
    api.get(`/api/viajes/${viajeId}`)
      .then(({ data }) => {
        setViaje(data);
        setEstado(data.estado);
        if (data.ruta_planeada) setRutaCoords(routeToCoords(data.ruta_planeada));
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [viajeId]);

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

    const onIniciado = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      setEstado('EN_CAMINO_A_ORIGEN');
    };

    const onAlertaDesvio = (data) => {
      setAlertaDesvio(data.mensaje);
      setTimeout(() => setAlertaDesvio(null), 10000);
    };

    const onAlertaParada = (data) => {
      setAlertaParada(data.mensaje);
      setTimeout(() => setAlertaParada(null), 10000);
    };

    const onEtaActualizar = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      setEta(data.minutos_restantes);
    };

    const onRutaRecalculada = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      if (data.nueva_ruta) setRutaCoords(routeToCoords(data.nueva_ruta));
      setAlertaRuta(true);
      setTimeout(() => setAlertaRuta(false), 6000);
    };

    const onFinalizado = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      if (finalizadoRef.current) return;
      finalizadoRef.current = true;
      setEstado('FINALIZADO');
      navigation.navigate('Calificacion', {
        viajeId,
        precioReal: data.precio_real,
        remitoUrl: data.remito_url,
      });
    };

    socket.on('mapa:actualizar',       onMapaActualizar);
    socket.on('viaje:estado_cambiado', onEstadoCambiado);
    socket.on('viaje:iniciado',        onIniciado);
    socket.on('alerta:desvio',         onAlertaDesvio);
    socket.on('alerta:parada',         onAlertaParada);
    socket.on('eta:actualizar',        onEtaActualizar);
    socket.on('ruta:recalculada',      onRutaRecalculada);
    socket.on('viaje:finalizado',      onFinalizado);

    return () => {
      socket.off('mapa:actualizar',       onMapaActualizar);
      socket.off('viaje:estado_cambiado', onEstadoCambiado);
      socket.off('viaje:iniciado',        onIniciado);
      socket.off('alerta:desvio',         onAlertaDesvio);
      socket.off('alerta:parada',         onAlertaParada);
      socket.off('eta:actualizar',        onEtaActualizar);
      socket.off('ruta:recalculada',      onRutaRecalculada);
      socket.off('viaje:finalizado',      onFinalizado);
    };
  }, [socket, viajeId, navigation]);

  const paradas = viaje?.paradas?.slice().sort((a, b) => a.orden - b.orden) ?? [];
  const origen  = paradas[0];
  const destino = paradas[paradas.length - 1];

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
              await api.post(`/api/viajes/${viajeId}/cancelar-cliente`);
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

  const handleCentrarConductor = (ref) => {
    if (!conductorPos) return;
    ref.current?.animateToRegion({
      latitude: conductorPos.latitude,
      longitude: conductorPos.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  const renderMapMarkers = () => (
    <>
      {rutaCoords.length > 1 && (
        <Polyline coordinates={rutaCoords} strokeColor={colors.primary} strokeWidth={3} />
      )}
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
    </>
  );

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
      <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />

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
        {alertaRuta ? (
          <View style={[styles.alertaBanner, styles.alertaBannerInfo]}>
            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            <Text style={[styles.alertaBannerText, { color: colors.primary }]}> Ruta recalculada por desvío</Text>
          </View>
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
            {eta != null && (
              <Text style={styles.etaText}>Llega en ~{eta} min</Text>
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
            ref={mapRef}
            style={styles.mapa}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {renderMapMarkers()}
          </MapView>
          {!conductorPos && (
            <View style={styles.mapaOverlay}>
              <Ionicons name="locate-outline" size={18} color={colors.textHint} />
              <Text style={styles.mapaOverlayText}> Esperando posición del fletero...</Text>
            </View>
          )}
          <View style={styles.mapaBotones}>
            <TouchableOpacity
              style={[styles.mapaBotonChico, !conductorPos && styles.mapaBotonDisabled]}
              onPress={() => handleCentrarConductor(mapRef)}
              disabled={!conductorPos}
            >
              <Ionicons name="locate" size={16} color={conductorPos ? colors.primary : colors.textHint} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapaBotonChico}
              onPress={() => setMapaFullscreen(true)}
            >
              <Ionicons name="expand" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
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

      </ScrollView>

      {/* Modal mapa pantalla completa */}
      <Modal visible={mapaFullscreen} animationType="slide" onRequestClose={() => setMapaFullscreen(false)}>
        <SafeAreaView style={styles.mapaFullSafeArea}>
          <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />
          <View style={styles.mapaFullHeader}>
            <Text style={styles.headerTitle}>Mapa</Text>
            <TouchableOpacity onPress={() => setMapaFullscreen(false)} style={styles.backBtn}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.mapaFullContainer}>
            <MapView
              ref={mapRefFull}
              style={styles.mapa}
              provider={PROVIDER_GOOGLE}
              initialRegion={initialRegion}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {renderMapMarkers()}
            </MapView>
            <View style={styles.mapaBotones}>
              <TouchableOpacity
                style={[styles.mapaBotonChico, !conductorPos && styles.mapaBotonDisabled]}
                onPress={() => handleCentrarConductor(mapRefFull)}
                disabled={!conductorPos}
              >
                <Ionicons name="locate" size={18} color={conductorPos ? colors.primary : colors.textHint} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {estado === 'CONDUCTOR_ASIGNADO' && (
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
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
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
  alertaBannerInfo: {
    backgroundColor: `${colors.primary}18`, borderColor: colors.primary,
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
  etaText:         { fontSize: fontSize.caption, color: colors.primary,  fontWeight: '700', marginTop: 2 },
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

  mapaBotones: {
    position: 'absolute', right: spacing.sm, bottom: spacing.sm,
    gap: spacing.xs,
  },
  mapaBotonChico: {
    width: 34, height: 34, borderRadius: radius.full,
    backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 3,
  },
  mapaBotonDisabled: { opacity: 0.5 },

  mapaFullSafeArea: { flex: 1, backgroundColor: colors.background },
  mapaFullHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  mapaFullContainer: { flex: 1, marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: radius.lg, overflow: 'hidden', position: 'relative' },

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
  fleteroAvatarText: { fontSize: fontSize.h2, fontWeight: '800', color: colors.onAccent },
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
});
