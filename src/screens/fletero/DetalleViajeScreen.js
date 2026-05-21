import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const ZONA_LABELS = { CABA: 'CABA', PROVINCIA: 'Provincia', MIXTO: 'CABA + Prov.' };

const COND_LABELS = {
  FRAGIL: 'Frágil', REFRIGERADO: 'Refrigerado', CARGA_PESADA: 'Carga pesada',
  PELIGROSO: 'Peligroso', VOLUMINOSO: 'Voluminoso',
};
const COND_COLORS = {
  FRAGIL: colors.warning, REFRIGERADO: '#4FC3F7', CARGA_PESADA: colors.textSecondary,
  PELIGROSO: colors.error, VOLUMINOSO: colors.textSecondary,
};

function CondTag({ id }) {
  const color = COND_COLORS[id] ?? colors.textSecondary;
  return (
    <View style={[styles.tag, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}>
      <Text style={[styles.tagText, { color }]}>{COND_LABELS[id] ?? id}</Text>
    </View>
  );
}

function mapViaje(v) {
  const sorted = [...(v.paradas ?? [])].sort((a, b) => a.orden - b.orden);
  return {
    id: v.id_viaje,
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
  const raw = route?.params?.viaje;
  const viaje = raw ? mapViaje(raw) : {
    id: 'v-001',
    origen: 'Palermo Hollywood',
    destino: 'San Telmo',
    paradasIntermedias: [],
    precio: 14500,
    requisitos: ['FRAGIL'],
    publicadoHace: '2 min',
    zona: 'CABA',
    cliente: 'Tomás G.',
  };

  const { socket } = useSocket();
  const { user } = useAuth();
  const [aceptando, setAceptando] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onAsignado = (data) => {
      if (data.id_viaje !== viaje.id) return;
      setAceptando(false);
      if (data.id_usuario_conductor === user?.id_usuario) {
        navigation.replace('ViajeActivo', { viajeId: data.id_viaje, conductor: data.conductor });
      } else {
        // Otro conductor fue asignado — volver a la lista
        Alert.alert('Viaje tomado', 'Otro conductor fue asignado a este viaje.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    };

    const onYaAsignado = (data) => {
      if (data.id_viaje !== viaje.id) return;
      setAceptando(false);
      Alert.alert('Llegaste tarde', 'Otro conductor aceptó este viaje primero.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    };

    socket.on('viaje:conductor_asignado', onAsignado);
    socket.on('viaje:ya_asignado',        onYaAsignado);

    return () => {
      socket.off('viaje:conductor_asignado', onAsignado);
      socket.off('viaje:ya_asignado',        onYaAsignado);
    };
  }, [socket, viaje.id, navigation]);

  const handleAceptar = () => {
    if (!socket || aceptando) return;
    setAceptando(true);
    socket.emit('viaje:aceptar', { id_viaje: viaje.id });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
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
          <Text style={styles.precioValor}>${viaje.precio.toLocaleString('es-AR')}</Text>
          <View style={styles.precioDetalleRow}>
            <Text style={styles.precioDet}>{viaje.paradasIntermedias.length} parada{viaje.paradasIntermedias.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.precioSep}>·</Text>
            <Text style={styles.precioDet}>{ZONA_LABELS[viaje.zona] ?? viaje.zona}</Text>
          </View>
        </View>

        {/* Mapa placeholder */}
        <View style={styles.mapaCard}>
          <Text style={styles.mapaIcono}>🗺</Text>
          <View style={styles.mapaRuta}>
            <Text style={styles.mapaOrigen}>{viaje.origen}</Text>
            <View style={styles.mapaLinea} />
            <Text style={styles.mapaDestino}>{viaje.destino}</Text>
          </View>
          <Text style={styles.mapaNota}>Mapa disponible en Fase 4</Text>
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

  // Mapa placeholder
  mapaCard: {
    height: 150, backgroundColor: colors.surface2,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md, gap: spacing.xs,
  },
  mapaIcono:   { fontSize: 24 },
  mapaRuta:    { alignItems: 'center', gap: 4 },
  mapaOrigen:  { fontSize: fontSize.body, fontWeight: '700', color: colors.primary },
  mapaLinea:   { width: 2, height: 16, backgroundColor: colors.surface3 },
  mapaDestino: { fontSize: fontSize.body, fontWeight: '700', color: colors.error },
  mapaNota:    { fontSize: fontSize.caption, color: colors.textHint },

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
  btnAceptarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
  btnDisabled: { opacity: 0.6 },
});
