import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../../components/MapViewWrapper';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { formatPrecio } from '../../utils/format';
import api from '../../services/api';
import { getOrCreateVehiculo } from '../../utils/vehiculo';

let colors;
let styles;

const ZONA_LABELS = { CABA: 'CABA', PROVINCIA: 'Provincia', MIXTO: 'CABA + Prov.' };

const COND_LABELS = {
  FRAGIL: 'Frágil', REFRIGERADO: 'Refrigerado', CARGA_PESADA: 'Carga pesada',
  PELIGROSO: 'Peligroso', VOLUMINOSO: 'Voluminoso',
};
const COND_COLORS = () => ({
  FRAGIL: colors.warning, REFRIGERADO: colors.info, CARGA_PESADA: colors.textSecondary,
  PELIGROSO: colors.error, VOLUMINOSO: colors.textSecondary,
});

function CondTag({ id }) {
  const color = COND_COLORS()[id] ?? colors.textSecondary;
  return (
    <View style={[styles.tag, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}>
      <Text style={[styles.tagText, { color }]}>{COND_LABELS[id] ?? id}</Text>
    </View>
  );
}

function routeToCoords(route) {
  if (!Array.isArray(route)) return [];
  return route.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

// Región que encuadra todos los puntos del recorrido, con margen.
function regionParaPuntos(puntos) {
  if (puntos.length === 0) {
    return { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }
  const lats = puntos.map(p => p.latitude);
  const lngs = puntos.map(p => p.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude:  (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta:  Math.max((maxLat - minLat) * 1.5, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.02),
  };
}

function mapViaje(v) {
  const sorted = [...(v.paradas ?? [])].sort((a, b) => a.orden - b.orden);
  return {
    id: v.id_viaje,
    puntos: sorted
      .filter(p => p?.latitud != null && p?.longitud != null)
      .map(p => ({ latitude: Number(p.latitud), longitude: Number(p.longitud) })),
    ruta: routeToCoords(v.ruta_planeada),
    origen: sorted[0]?.direccion ?? '',
    destino: sorted[sorted.length - 1]?.direccion ?? '',
    paradasIntermedias: sorted.slice(1, -1),
    precio: v.precio_estimado,
    requisitos: (v.condiciones_req ?? []).map(c => c.condicion),
    publicadoHace: new Date(v.fecha_programada).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    zona: v.zona,
    cliente: `${v.cliente?.usuario?.nombre ?? ''} ${v.cliente?.usuario?.apellido ?? ''}`.trim(),
  };
}

export default function DetalleViajeScreen({ navigation, route }) {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const rawParams = route?.params?.viaje;
  const [viaje, setViaje] = useState(rawParams ? mapViaje(rawParams) : null);
  const [cargandoDetalle, setCargandoDetalle] = useState(!rawParams);

  const { socket } = useSocket();
  const [aceptando, setAceptando] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const idViaje = rawParams?.id_viaje;
    if (!idViaje) return;
    api.get(`/api/viajes/${idViaje}`)
      .then(({ data }) => setViaje(mapViaje(data)))
      .catch(() => {})
      .finally(() => setCargandoDetalle(false));
  }, [rawParams?.id_viaje]);

  if (!viaje && cargandoDetalle) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!viaje) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ padding: spacing.md }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textHint, marginTop: spacing.xl, textAlign: 'center' }}>
            No se pudo cargar el viaje
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    if (!socket) return;

    const onAsignado = (data) => {
      if (data.id_viaje !== viaje.id) return;
      clearTimeout(timeoutRef.current);
      setAceptando(false);
      // si llegamos acá, este conductor ganó (el perdedor recibe viaje:ya_asignado)
      navigation.replace('ViajeActivo', { viajeId: data.id_viaje, conductor: data.conductor });
    };

    const onYaAsignado = (data) => {
      if (data.id_viaje !== viaje.id) return;
      clearTimeout(timeoutRef.current);
      setAceptando(false);
      Alert.alert('Llegaste tarde', 'Otro conductor aceptó este viaje primero.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    };

    const onError = (data) => {
      if (!data?.mensaje) return;
      clearTimeout(timeoutRef.current);
      setAceptando(false);
      Alert.alert('No se pudo aceptar', data.mensaje);
    };

    socket.on('viaje:conductor_asignado', onAsignado);
    socket.on('viaje:ya_asignado',        onYaAsignado);
    socket.on('error',                    onError);

    return () => {
      clearTimeout(timeoutRef.current);
      socket.off('viaje:conductor_asignado', onAsignado);
      socket.off('viaje:ya_asignado',        onYaAsignado);
      socket.off('error',                    onError);
    };
  }, [socket, viaje.id, navigation]);

  const handleAceptar = async () => {
    if (!socket || aceptando) return;
    setAceptando(true);
    try {
      const id_vehiculo = await getOrCreateVehiculo();
      socket.emit('viaje:aceptar', { id_viaje: viaje.id, id_vehiculo });
      timeoutRef.current = setTimeout(() => {
        setAceptando(false);
        Alert.alert('Sin respuesta', 'El servidor no respondió. Intentá de nuevo.');
      }, 10000);
    } catch {
      setAceptando(false);
      Alert.alert('Error', 'No se pudo obtener el vehículo. Intentá de nuevo.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del viaje</Text>
        <Text style={styles.tiempo}>{viaje.publicadoHace}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Precio */}
        <View style={styles.precioCard}>
          <Text style={styles.precioLabel}>Ganás</Text>
          <Text style={styles.precioValor}>${formatPrecio(viaje.precio)}</Text>
          <View style={styles.precioDetalleRow}>
            <Text style={styles.precioDet}>{viaje.paradasIntermedias.length} parada{viaje.paradasIntermedias.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.precioSep}>·</Text>
            <Text style={styles.precioDet}>{ZONA_LABELS[viaje.zona] ?? viaje.zona}</Text>
          </View>
        </View>

        {/* Mapa del recorrido */}
        <View style={styles.mapaCard}>
          <MapView
            style={styles.mapa}
            provider={PROVIDER_GOOGLE}
            region={regionParaPuntos(viaje.puntos)}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {viaje.puntos.length > 1 && (
              <Polyline
                coordinates={viaje.ruta.length > 1 ? viaje.ruta : viaje.puntos}
                strokeColor={colors.primary}
                strokeWidth={3}
              />
            )}
            {viaje.puntos.map((p, i) => {
              const esOrigen = i === 0;
              const esDestino = i === viaje.puntos.length - 1 && i > 0;
              return (
                <Marker
                  key={i}
                  coordinate={p}
                  title={esOrigen ? 'Origen' : esDestino ? 'Destino' : `Parada ${i}`}
                  pinColor={esOrigen ? colors.primary : esDestino ? colors.error : colors.warning}
                />
              );
            })}
          </MapView>
        </View>

        {/* Ruta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ruta</Text>
          <View style={styles.rutaRow}>
            <View style={styles.rutaDots}>
              <View style={styles.dotOrigen} />
              <View style={styles.lineaRuta} />
              <View style={styles.dotDestino} />
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <View>
                <Text style={styles.rutaSubLabel}>Origen</Text>
                <Text style={styles.rutaValor}>{viaje.origen}</Text>
              </View>
              {viaje.paradasIntermedias.length > 0 && (
                <Text style={styles.rutaParadas}>
                  + {viaje.paradasIntermedias.length} parada{viaje.paradasIntermedias.length !== 1 ? 's' : ''} intermedia{viaje.paradasIntermedias.length !== 1 ? 's' : ''}
                </Text>
              )}
              <View>
                <Text style={styles.rutaSubLabel}>Destino</Text>
                <Text style={styles.rutaValor}>{viaje.destino}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Carga */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Carga</Text>
          {viaje.descripcion
            ? <Text style={styles.descripcion}>{viaje.descripcion}</Text>
            : null
          }
          {viaje.requisitos?.length > 0 ? (
            <View style={styles.tagsRow}>
              {viaje.requisitos.map(r => <CondTag key={r} id={r} />)}
            </View>
          ) : (
            <Text style={styles.sinReq}>Sin requisitos especiales</Text>
          )}
        </View>

        {/* Cliente */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>
          <View style={styles.clienteRow}>
            <View style={styles.clienteAvatar}>
              <Text style={styles.clienteAvatarText}>
                {(viaje.cliente || 'C').charAt(0)}
              </Text>
            </View>
            <Text style={styles.clienteNombre}>{viaje.cliente}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnRechazar}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.btnRechazarText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnAceptar, aceptando && styles.btnDisabled]}
          onPress={handleAceptar}
          disabled={aceptando}
          activeOpacity={0.85}
        >
          {aceptando
            ? <ActivityIndicator color={colors.surface1} />
            : <Text style={styles.btnAceptarText}>Aceptar viaje</Text>
          }
        </TouchableOpacity>
      </View>
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
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },
  tiempo: { fontSize: fontSize.caption, color: colors.textHint, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 120 },

  // Precio
  precioCard: {
    backgroundColor: `${colors.primary}12`, borderRadius: radius.lg,
    borderWidth: 1, borderColor: `${colors.primary}44`,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md,
  },
  precioLabel:      { fontSize: fontSize.caption, fontWeight: '600', color: colors.textSecondary },
  precioValor:      { fontSize: 44, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  precioDetalleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  precioDet:        { fontSize: fontSize.body, color: colors.textSecondary },
  precioSep:        { color: colors.textHint },

  // Mapa del recorrido (fijo, sin gestos: es una vista previa)
  mapaCard: {
    height: 180, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.surface3, marginBottom: spacing.md,
  },
  mapa: { flex: 1 },

  // Cards
  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },

  // Ruta
  rutaRow:     { flexDirection: 'row', gap: spacing.sm },
  rutaDots:    { alignItems: 'center', paddingTop: 2, width: 12 },
  dotOrigen:   { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  dotDestino:  { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  lineaRuta:   { width: 2, flex: 1, minHeight: 28, backgroundColor: colors.surface3, marginVertical: 3 },
  rutaSubLabel:{ fontSize: fontSize.caption, color: colors.textHint },
  rutaValor:   { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  rutaParadas: { fontSize: fontSize.caption, color: colors.textSecondary, fontStyle: 'italic' },

  // Carga
  descripcion: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: spacing.sm },
  tagsRow:     { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  tag:         { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText:     { fontSize: 10, fontWeight: '700' },
  sinReq:      { fontSize: fontSize.body, color: colors.textHint },

  // Cliente
  clienteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clienteAvatar: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: `${colors.primary}22`,
    borderWidth: 1, borderColor: `${colors.primary}44`,
    alignItems: 'center', justifyContent: 'center',
  },
  clienteAvatarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.primary },
  clienteNombre:     { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  btnRechazar: {
    flex: 1, borderWidth: 1, borderColor: colors.surface3,
    borderRadius: radius.lg, paddingVertical: spacing.md,
    alignItems: 'center', backgroundColor: colors.surface1,
  },
  btnRechazarText: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textSecondary },
  btnAceptar: {
    flex: 2, backgroundColor: colors.primary,
    borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center',
  },
  btnAceptarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.onAccent },
  btnDisabled: { opacity: 0.6 },
});
