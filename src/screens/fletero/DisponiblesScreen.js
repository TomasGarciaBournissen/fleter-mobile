import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import NuevoViajeModal from './NuevoViajeModal';

function mapViaje(v) {
  const sorted = [...v.paradas].sort((a, b) => a.orden - b.orden);
  return {
    _raw: v,
    id: v.id_viaje,
    origen: sorted[0]?.direccion ?? '',
    destino: sorted[sorted.length - 1]?.direccion ?? '',
    paradas: Math.max(0, sorted.length - 2),
    precio: v.precio_estimado,
    requisitos: (v.condiciones_req ?? []).map(c => c.condicion),
    publicadoHace: new Date(v.fecha_programada).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    zona: v.zona,
    cliente: `${v.cliente?.usuario?.nombre ?? ''} ${v.cliente?.usuario?.apellido ?? ''}`.trim(),
  };
}

const TAG_LABELS = {
  FRAGIL: 'Frágil',
  REFRIGERADO: 'Refrigerado',
  CARGA_PESADA: 'Carga pesada',
  PELIGROSO: 'Peligroso',
  VOLUMINOSO: 'Voluminoso',
};

const TAG_COLORS = {
  FRAGIL: colors.warning,
  REFRIGERADO: '#4FC3F7',
  CARGA_PESADA: colors.textSecondary,
  PELIGROSO: colors.error,
  VOLUMINOSO: colors.textSecondary,
};

function TagRequisito({ label }) {
  const color = TAG_COLORS[label] ?? colors.textSecondary;
  return (
    <View style={[styles.tag, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}>
      <Text style={[styles.tagText, { color }]}>{TAG_LABELS[label] ?? label}</Text>
    </View>
  );
}

function ViajeCard({ viaje, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={styles.rutaBlock}>
          <View style={styles.rutaDots}>
            <View style={styles.dotOrigen} />
            <View style={styles.rutaLinea} />
            <View style={styles.dotDestino} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rutaValor}>{viaje.origen}</Text>
            {viaje.paradas > 0 && (
              <Text style={styles.paradasText}>
                {viaje.paradas} parada{viaje.paradas > 1 ? 's' : ''}
              </Text>
            )}
            <Text style={[styles.rutaValor, { marginTop: viaje.paradas > 0 ? 2 : spacing.xs }]}>
              {viaje.destino}
            </Text>
          </View>
        </View>
        <View style={styles.precioBlock}>
          <Text style={styles.precio}>${viaje.precio.toLocaleString('es-AR')}</Text>
          <Text style={styles.distancia}>{viaje.distanciaKm} km</Text>
        </View>
      </View>

      {viaje.descripcion ? (
        <Text style={styles.descripcion} numberOfLines={1}>{viaje.descripcion}</Text>
      ) : null}

      <View style={styles.cardBottom}>
        <View style={styles.tagsRow}>
          {viaje.requisitos.map((r) => <TagRequisito key={r} label={r} />)}
        </View>
        <Text style={styles.tiempo}>{viaje.publicadoHace}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DisponiblesScreen({ navigation }) {
  const [viajes,        setViajes]        = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [viajeOferta,   setViajeOferta]   = useState(null);
  const [aceptando,     setAceptando]     = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  const fetchViajes = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/api/viajes/disponibles');
      setViajes(data.map(mapViaje));
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudieron cargar los viajes');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { fetchViajes(); }, [fetchViajes]);

  // Socket: escuchar viajes nuevos en tiempo real
  useEffect(() => {
    if (!socket) return;

    const onDisponible = (data) => {
      setViajeOferta(data);
      setViajes(prev => {
        if (prev.some(v => v.id === data.id_viaje)) return prev;
        return [mapViaje({ ...data, condiciones_req: data.condiciones_req ?? [] }), ...prev];
      });
    };

    const onConductorAsignado = (data) => {
      setViajes(prev => prev.filter(v => v.id !== data.id_viaje));
      if (data.id_usuario_conductor === user?.id_usuario) {
        setViajeOferta(null);
        setAceptando(false);
        navigation.navigate('ViajeActivo', { viajeId: data.id_viaje, conductor: data.conductor });
      } else {
        // Otro conductor ganó la carrera — solo sacar el viaje de la lista
        if (viajeOferta?.id_viaje === data.id_viaje) setViajeOferta(null);
      }
    };

    const onYaAsignado = (data) => {
      setViajeOferta(null);
      setAceptando(false);
      // Quitar el viaje ya tomado de la lista
      setViajes(prev => prev.filter(v => v.id !== data.id_viaje));
      Alert.alert('Llegaste tarde', 'Otro conductor aceptó este viaje primero.');
    };

    socket.on('viaje:disponible',         onDisponible);
    socket.on('viaje:conductor_asignado', onConductorAsignado);
    socket.on('viaje:ya_asignado',        onYaAsignado);

    return () => {
      socket.off('viaje:disponible',         onDisponible);
      socket.off('viaje:conductor_asignado', onConductorAsignado);
      socket.off('viaje:ya_asignado',        onYaAsignado);
    };
  }, [socket, navigation]);

  const handleAceptar = () => {
    if (!socket || !viajeOferta) return;
    setAceptando(true);
    socket.emit('viaje:aceptar', { id_viaje: viajeOferta.id_viaje });
  };

  const handleRechazar = () => {
    setViajeOferta(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <NuevoViajeModal
        visible={!!viajeOferta && !aceptando}
        viaje={viajeOferta}
        onAceptar={handleAceptar}
        onRechazar={handleRechazar}
      />
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Disponibles</Text>
          <Text style={styles.headerSub}>
            {cargando ? 'Buscando viajes...' : `${viajes.length} viajes cerca tuyo`}
          </Text>
        </View>
        <View style={styles.activoBadge}>
          <View style={styles.activoDot} />
          <Text style={styles.activoText}>En línea</Text>
        </View>
      </View>

      {cargando ? (
        <View style={styles.vacio}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={viajes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchViajes}
          refreshing={cargando}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <ViajeCard
              viaje={item}
              onPress={() => navigation.navigate('DetalleViaje', { viaje: item._raw })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={styles.vacioText}>No hay viajes disponibles por ahora</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  activoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.primary}22`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
  },
  activoDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.primary },
  activoText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.primary },

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  rutaBlock: { flex: 1, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  rutaDots: { alignItems: 'center', paddingTop: 3, width: 12 },
  dotOrigen: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  rutaLinea: { width: 2, height: 22, backgroundColor: colors.surface3, marginVertical: 2 },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  rutaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  paradasText: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },

  precioBlock: { alignItems: 'flex-end' },
  precio: { fontSize: fontSize.h2, fontWeight: '800', color: colors.primary },
  distancia: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },

  descripcion: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  tagsRow: { flexDirection: 'row', gap: spacing.xs, flex: 1, flexWrap: 'wrap' },
  tag: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 10, fontWeight: '700' },
  tiempo: { fontSize: fontSize.caption, color: colors.textHint },

  vacio: { alignItems: 'center', paddingTop: 60 },
  vacioText: { fontSize: fontSize.body, color: colors.textHint },
});
