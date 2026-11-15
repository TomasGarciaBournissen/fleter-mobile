import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Platform, Linking,
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
  { id: 'CONDUCTOR_ASIGNADO', label: 'Conductor asignado' },
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

export default function ViajeActivoGerenteScreen({ navigation, route }) {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const { viajeId } = route.params ?? {};
  const { socket } = useSocket();

  const [viaje,        setViaje]        = useState(null);
  const [estado,       setEstado]       = useState('CONDUCTOR_ASIGNADO');
  const [conductorPos, setConductorPos] = useState(null);
  const [eta,          setEta]          = useState(null);
  const [costo,        setCosto]        = useState(null);
  const [rutaCoords,   setRutaCoords]   = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [remitoUrl,    setRemitoUrl]    = useState(null);
  const mapRef = useRef(null);

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

  useEffect(() => {
    if (!socket) return;

    const onMapaActualizar = (data) => setConductorPos({ latitude: data.lat, longitude: data.lng });
    const onEstadoCambiado = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      setEstado(data.estado_nuevo);
    };
    const onEtaActualizar = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      setEta(data.minutos_restantes);
    };
    const onCostoActualizar = (data) => setCosto(data.precio_acumulado);
    const onRutaRecalculada = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      if (data.nueva_ruta) setRutaCoords(routeToCoords(data.nueva_ruta));
    };
    const onFinalizado = (data) => {
      if (Number(data.id_viaje) !== Number(viajeId)) return;
      setEstado('FINALIZADO');
      if (data.remito_url) setRemitoUrl(data.remito_url);
    };

    socket.on('mapa:actualizar',       onMapaActualizar);
    socket.on('viaje:estado_cambiado', onEstadoCambiado);
    socket.on('eta:actualizar',        onEtaActualizar);
    socket.on('costo:actualizar',      onCostoActualizar);
    socket.on('ruta:recalculada',      onRutaRecalculada);
    socket.on('viaje:finalizado',      onFinalizado);

    return () => {
      socket.off('mapa:actualizar',       onMapaActualizar);
      socket.off('viaje:estado_cambiado', onEstadoCambiado);
      socket.off('eta:actualizar',        onEtaActualizar);
      socket.off('costo:actualizar',      onCostoActualizar);
      socket.off('ruta:recalculada',      onRutaRecalculada);
      socket.off('viaje:finalizado',      onFinalizado);
    };
  }, [socket, viajeId]);

  useEffect(() => {
    if (estado !== 'FINALIZADO' || remitoUrl || !viajeId) return;
    api.get(`/api/viajes/${viajeId}/remito`)
      .then(({ data }) => setRemitoUrl(data.remito_url))
      .catch(() => {});
  }, [estado, remitoUrl, viajeId]);

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const paradas = viaje?.paradas?.slice().sort((a, b) => a.orden - b.orden) ?? [];
  const origen  = paradas[0];
  const destino = paradas[paradas.length - 1];
  const conductorNombre = viaje?.conductor?.usuario ? `${viaje.conductor.usuario.nombre} ${viaje.conductor.usuario.apellido}`.trim() : '';
  const clienteNombre   = viaje?.cliente?.usuario ? `${viaje.cliente.usuario.nombre} ${viaje.cliente.usuario.apellido}`.trim() : '';
  const estadoIdx = estadoIndex(estado);

  const initialRegion = conductorPos
    ? { latitude: conductorPos.latitude, longitude: conductorPos.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 }
    : origen?.latitud
      ? { latitude: origen.latitud, longitude: origen.longitud, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.1, longitudeDelta: 0.1 };

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

        <View style={styles.mapaContainer}>
          <MapView
            ref={mapRef}
            style={styles.mapa}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {rutaCoords.length > 1 && (
              <Polyline coordinates={rutaCoords} strokeColor={colors.primary} strokeWidth={3} />
            )}
            {conductorPos && (
              <Marker coordinate={conductorPos} title="Conductor">
                <View style={styles.markerConductor}>
                  <Ionicons name="car" size={14} color={colors.textPrimary} />
                </View>
              </Marker>
            )}
            {origen?.latitud ? <Marker coordinate={{ latitude: origen.latitud, longitude: origen.longitud }} title="Origen" pinColor={colors.primary} /> : null}
            {destino?.latitud && destino !== origen ? <Marker coordinate={{ latitude: destino.latitud, longitude: destino.longitud }} title="Destino" pinColor={colors.error} /> : null}
          </MapView>
          {!conductorPos && (
            <View style={styles.mapaOverlay}>
              <Text style={styles.mapaOverlayText}>Esperando posición del conductor...</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          {eta != null && (
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.statValor}>{eta} min</Text>
            </View>
          )}
          {costo != null && (
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={16} color={colors.primary} />
              <Text style={styles.statValor}>${formatPrecio(costo)}</Text>
            </View>
          )}
        </View>

        {estado === 'FINALIZADO' && remitoUrl ? (
          <TouchableOpacity style={styles.remitoBtn} onPress={() => Linking.openURL(remitoUrl)} activeOpacity={0.85}>
            <Ionicons name="document-outline" size={16} color={colors.primary} />
            <Text style={styles.remitoBtnText}>Ver remito PDF</Text>
            <Ionicons name="open-outline" size={14} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progreso del viaje</Text>
          {TIMELINE_ESTADOS.map((e, i) => {
            const hecho  = i <= estadoIdx;
            const activo = i === estadoIdx;
            const isLast = i === TIMELINE_ESTADOS.length - 1;
            return (
              <View key={e.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, hecho && !activo && styles.timelineDotHecho, activo && styles.timelineDotActivo]}>
                    {hecho && !activo && <Ionicons name="checkmark" size={10} color={colors.textPrimary} />}
                  </View>
                  {!isLast && <View style={[styles.timelineLinea, hecho && !activo && styles.timelineLineaHecha]} />}
                </View>
                <Text style={[styles.timelineLabel, activo && { color: colors.primary }, !hecho && { color: colors.textHint }]}>{e.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>
          <Text style={styles.personaNombre}>{clienteNombre || '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conductor</Text>
          <Text style={styles.personaNombre}>{conductorNombre || '—'}</Text>
          {viaje?.vehiculo?.patente ? (
            <Text style={styles.personaSub}>{viaje.vehiculo.marca} {viaje.vehiculo.modelo} · {viaje.vehiculo.patente}</Text>
          ) : null}
        </View>

      </ScrollView>
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
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  mapaContainer: {
    height: 220, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.surface3, marginBottom: spacing.md,
  },
  mapa: { flex: 1 },
  mapaOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: `${colors.surface2}CC`, alignItems: 'center', justifyContent: 'center',
  },
  mapaOverlayText: { fontSize: fontSize.body, color: colors.textHint },
  markerConductor: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    padding: 6, borderWidth: 2, borderColor: colors.textPrimary,
  },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3, paddingVertical: spacing.sm,
  },
  statValor: { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },

  remitoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, marginBottom: spacing.md,
  },
  remitoBtnText: { flex: 1, fontSize: fontSize.body, color: colors.primary, fontWeight: '600' },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },

  timelineRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  timelineLeft: { alignItems: 'center', width: 16 },
  timelineDot: {
    width: 12, height: 12, borderRadius: radius.full,
    backgroundColor: colors.surface3, borderWidth: 2, borderColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineDotHecho: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineDotActivo: { backgroundColor: `${colors.primary}22`, borderColor: colors.primary },
  timelineLinea: { width: 2, flex: 1, backgroundColor: colors.surface3, minHeight: 20 },
  timelineLineaHecha: { backgroundColor: colors.primary },
  timelineLabel: { fontSize: fontSize.body, color: colors.textPrimary, fontWeight: '600', paddingBottom: spacing.md },

  personaNombre: { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },
  personaSub: { fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
});
