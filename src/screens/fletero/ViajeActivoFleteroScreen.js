import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
  ScrollView, ActivityIndicator, Alert, Linking, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../components/MapViewWrapper';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { formatPrecio } from '../../utils/format';
import {
  setLocationEmitter,
  startLocationTracking,
  stopLocationTracking,
} from '../../tasks/locationTask';

const ESTADOS = [
  { id: 'CONDUCTOR_ASIGNADO',  label: 'Conductor asignado' },
  { id: 'EN_CAMINO_A_ORIGEN',  label: 'En camino al origen' },
  { id: 'CARGANDO',            label: 'Cargando mercadería' },
  { id: 'EN_RUTA',             label: 'En ruta al destino' },
  { id: 'DESCARGANDO',         label: 'Descargando' },
  { id: 'FINALIZADO',          label: 'Viaje finalizado' },
];

function estadoIndex(e) {
  return ESTADOS.findIndex(s => s.id === e);
}

export default function ViajeActivoFleteroScreen({ navigation, route }) {
  const { viajeId } = route.params ?? {};
  const { socket } = useSocket();

  const [viaje, setViaje]               = useState(null);
  const [estado, setEstado]             = useState('CONDUCTOR_ASIGNADO');
  const [posicion, setPosicion]         = useState(null);
  const [cargandoAccion, setCargandoAccion] = useState(false);
  const [debugGps, setDebugGps]         = useState(null);
  const posicionRef = useRef(null);
  const mapRef      = useRef(null);

  // Fetch trip data
  useEffect(() => {
    if (!viajeId) return;
    api.get(`/api/viajes/${viajeId}`)
      .then(({ data }) => { setViaje(data); setEstado(data.estado); })
      .catch(() => {});
  }, [viajeId]);

  // GPS setup: permissions + watch position + background task
  useEffect(() => {
    if (!socket || !viajeId) return;

    let watchSub   = null;
    let intervalId = null;
    let active     = true;

    const setup = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (active) Alert.alert('Permiso requerido', 'Necesitamos tu ubicación para el viaje.');
        return;
      }

      await Location.requestBackgroundPermissionsAsync().catch(() => {});

      setLocationEmitter((lat, lng) => {
        socket.emit('conductor:ubicacion', { id_viaje: viajeId, lat, lng, timestamp: Date.now() });
        setDebugGps(prev => ({ ...prev, lastEmit: new Date().toLocaleTimeString('es-AR') }));
      });

      watchSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 3000, distanceInterval: 0 },
        (loc) => {
          if (!active) return;
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setPosicion(coords);
          posicionRef.current = coords;
          setDebugGps(prev => ({
            ...prev,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            updates: (prev?.updates ?? 0) + 1,
          }));
        }
      );

      const bgStarted = await startLocationTracking().then(() => true).catch(() => false);
      if (!bgStarted) {
        // Fallback: emit from foreground interval
        intervalId = setInterval(() => {
          const p = posicionRef.current;
          if (p) socket.emit('conductor:ubicacion', { id_viaje: viajeId, lat: p.latitude, lng: p.longitude, timestamp: Date.now() });
        }, 15000);
      }
    };

    setup();

    return () => {
      active = false;
      watchSub?.remove();
      if (intervalId) clearInterval(intervalId);
      stopLocationTracking();
    };
  }, [socket, viajeId]);

  // Socket: estado_cambiado + viaje:finalizado
  useEffect(() => {
    if (!socket) return;
    const onEstadoCambiado = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      setEstado(data.estado_nuevo);
    };
    const onFinalizado = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      setEstado('FINALIZADO');
      navigation.replace('Cobro', { viajeId, precioReal: data.precio_real, remitoUrl: data.remito_url });
    };
    socket.on('viaje:estado_cambiado', onEstadoCambiado);
    socket.on('viaje:finalizado',      onFinalizado);
    return () => {
      socket.off('viaje:estado_cambiado', onEstadoCambiado);
      socket.off('viaje:finalizado',      onFinalizado);
    };
  }, [socket, viajeId]);

  const handleAccion = async () => {
    if (estado === 'DESCARGANDO') {
      navigation.navigate('QREntrega', { viajeId, paradas });
      return;
    }

    let nuevoEstado = null;
    if (estado === 'CONDUCTOR_ASIGNADO' || estado === 'EN_CAMINO_A_ORIGEN') nuevoEstado = 'CARGANDO';
    else if (estado === 'CARGANDO') nuevoEstado = 'EN_RUTA';
    else if (estado === 'EN_RUTA') nuevoEstado = 'DESCARGANDO';
    if (!nuevoEstado) return;

    setCargandoAccion(true);
    try {
      await api.patch(`/api/viajes/${viajeId}/estado`, { estado: nuevoEstado });
      setEstado(nuevoEstado);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo actualizar el estado');
    } finally {
      setCargandoAccion(false);
    }
  };

  const getBotonLabel = () => {
    if (estado === 'CONDUCTOR_ASIGNADO' || estado === 'EN_CAMINO_A_ORIGEN') return 'Llegué al origen — Iniciar carga';
    if (estado === 'CARGANDO')    return 'Carga lista — Salir hacia destino';
    if (estado === 'EN_RUTA')     return 'Llegué al destino — Iniciar descarga';
    if (estado === 'DESCARGANDO') return 'Escanear QR de entrega';
    return null;
  };

  const paradas     = viaje?.paradas?.slice().sort((a, b) => a.orden - b.orden) ?? [];
  const origen      = paradas[0];
  const destino     = paradas[paradas.length - 1];
  const cliente     = viaje?.cliente?.usuario;
  const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}`.trim() : '';
  const clienteTel  = cliente?.telefono ?? '';
  const precioText  = viaje?.precio_estimado ? `$${formatPrecio(viaje.precio_estimado)}` : '';
  const botonLabel  = getBotonLabel();
  const estadoIdx   = estadoIndex(estado);

  const initialRegion = posicion
    ? { latitude: posicion.latitude, longitude: posicion.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : origen?.latitud
      ? { latitude: origen.latitud, longitude: origen.longitud, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Viaje en curso</Text>
        {precioText ? (
          <View style={styles.precioChip}>
            <Text style={styles.precioChipText}>{precioText}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Mapa */}
        <View style={styles.mapaContainer}>
          <MapView
            ref={mapRef}
            style={styles.mapa}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {posicion && (
              <Marker coordinate={posicion} title="Yo">
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
            {paradas.slice(1, -1).map((p, i) => p?.latitud ? (
              <Marker
                key={p.id_parada ?? i}
                coordinate={{ latitude: p.latitud, longitude: p.longitud }}
                title={`Parada ${i + 1}`}
                pinColor={colors.warning}
              />
            ) : null)}
          </MapView>
        </View>

        {/* Debug GPS — visible solo mientras no hay build nativa */}
        {debugGps && (
          <View style={styles.debugCard}>
            <View style={styles.debugHeader}>
              <View style={styles.debugDot} />
              <Text style={styles.debugTitle}>GPS activo</Text>
              {debugGps?.updates != null && (
                <Text style={styles.debugUpdates}>{debugGps.updates} updates</Text>
              )}
            </View>
            <Text style={styles.debugLine}>
              {debugGps.lat != null ? `${debugGps.lat.toFixed(5)}, ${debugGps.lng.toFixed(5)}` : 'Obteniendo posición...'}
            </Text>
            {debugGps.lastEmit && (
              <Text style={styles.debugLine}>Último emit al backend: {debugGps.lastEmit}</Text>
            )}
          </View>
        )}

        {/* Banner informativo para estado CARGANDO */}
        {estado === 'CARGANDO' && (
          <View style={styles.infoBanner}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <Text style={styles.infoBannerText}> Cargá la mercadería. Cuando empieces a moverte, el viaje continúa automáticamente.</Text>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progreso del viaje</Text>
          {ESTADOS.map((e, i) => {
            const hecho  = i < estadoIdx;
            const activo = i === estadoIdx;
            const isLast = i === ESTADOS.length - 1;
            return (
              <View key={e.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    hecho  && styles.timelineDotHecho,
                    activo && styles.timelineDotActivo,
                  ]}>
                    {hecho && <Ionicons name="checkmark" size={10} color={colors.textPrimary} />}
                  </View>
                  {!isLast && <View style={[styles.timelineLinea, hecho && styles.timelineLineaHecha]} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineLabel,
                    activo && styles.timelineLabelActivo,
                    hecho  && styles.timelineLabelHecho,
                    !hecho && !activo && styles.timelineLabelPendiente,
                  ]}>
                    {e.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Cliente */}
        {clienteNombre ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cliente</Text>
            <View style={styles.clienteRow}>
              <View style={styles.clienteAvatar}>
                <Text style={styles.clienteAvatarText}>{clienteNombre.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clienteNombre}>{clienteNombre}</Text>
                {clienteTel ? <Text style={styles.clienteTel}>{clienteTel}</Text> : null}
              </View>
              {clienteTel ? (
                <TouchableOpacity style={styles.btnLlamar} onPress={() => Linking.openURL(`tel:${clienteTel}`)}>
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                  <Text style={styles.btnLlamarText}> Llamar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

      </ScrollView>

      {botonLabel ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btnAccion, cargandoAccion && styles.btnDisabled]}
            onPress={handleAccion}
            disabled={cargandoAccion}
            activeOpacity={0.85}
          >
            {cargandoAccion
              ? <ActivityIndicator color={colors.textPrimary} />
              : <Text style={styles.btnAccionText}>{botonLabel}</Text>
            }
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  precioChip: {
    backgroundColor: `${colors.primary}22`, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: `${colors.primary}44`,
  },
  precioChipText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 110 },

  mapaContainer: {
    height: 250, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.surface3, marginBottom: spacing.md,
  },
  mapa: { flex: 1 },

  markerConductor: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    padding: 6, borderWidth: 2, borderColor: colors.textPrimary,
  },

  debugCard: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  debugHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  debugDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  debugTitle:   { fontSize: fontSize.caption, fontWeight: '700', color: colors.textSecondary },
  debugUpdates: { fontSize: fontSize.caption, color: colors.success, fontWeight: '700', marginLeft: 'auto' },
  debugLine:   { fontSize: fontSize.caption, color: colors.textHint, fontFamily: 'monospace' },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: `${colors.warning}18`,
    borderRadius: radius.md, borderWidth: 1, borderColor: `${colors.warning}66`,
    padding: spacing.sm, marginBottom: spacing.md,
  },
  infoBannerText: { fontSize: fontSize.body, color: colors.warning, fontWeight: '600', flex: 1 },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },

  timelineRow: { flexDirection: 'row', gap: spacing.sm },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineDot: {
    width: 20, height: 20, borderRadius: radius.full,
    borderWidth: 2, borderColor: colors.surface3,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineDotHecho:  { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineDotActivo: { borderColor: colors.primary, backgroundColor: `${colors.primary}22` },
  timelineLinea:     { width: 2, flex: 1, minHeight: 16, backgroundColor: colors.surface3, marginVertical: 2 },
  timelineLineaHecha:{ backgroundColor: colors.primary },
  timelineContent:   { flex: 1, paddingBottom: spacing.md },
  timelineLabel:     { fontSize: fontSize.body, fontWeight: '600' },
  timelineLabelActivo:   { color: colors.primary },
  timelineLabelHecho:    { color: colors.textHint },
  timelineLabelPendiente:{ color: colors.textHint },

  clienteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clienteAvatar: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.surface3,
  },
  clienteAvatarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
  clienteNombre:  { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },
  clienteTel:     { fontSize: fontSize.caption, color: colors.textSecondary },
  btnLlamar: {
    borderWidth: 1, borderColor: `${colors.primary}66`,
    borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    flexDirection: 'row', alignItems: 'center',
  },
  btnLlamarText: { fontSize: fontSize.body, color: colors.primary, fontWeight: '600' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  btnAccion: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  btnAccionText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
  btnDisabled:   { opacity: 0.6 },
});
