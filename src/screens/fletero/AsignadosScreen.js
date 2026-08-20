import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { formatPrecio } from '../../utils/format';

function mapViaje(v) {
  const paradas = (v.paradas ?? []).slice().sort((a, b) => a.orden - b.orden);
  return {
    id: v.id_viaje,
    origen: paradas[0]?.direccion ?? '',
    destino: paradas[paradas.length - 1]?.direccion ?? '',
    precio: v.precio_estimado,
    fecha: v.fecha_programada,
    vehiculo: v.vehiculo,
  };
}

function ViajeCard({ viaje, onPress }) {
  const fecha = viaje.fecha ? new Date(viaje.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
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
            <Text style={[styles.rutaValor, { marginTop: spacing.xs }]}>{viaje.destino}</Text>
          </View>
        </View>
        <View style={styles.precioBlock}>
          <Text style={styles.precio}>${formatPrecio(viaje.precio)}</Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        {viaje.vehiculo?.patente ? (
          <Text style={styles.meta}>{viaje.vehiculo.marca} {viaje.vehiculo.modelo} · {viaje.vehiculo.patente}</Text>
        ) : <View />}
        <Text style={styles.meta}>{fecha}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AsignadosScreen({ navigation }) {
  const [viajes,   setViajes]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const { socket } = useSocket();

  const fetchViajes = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/api/viajes/asignados');
      setViajes(data.map(mapViaje));
    } catch {
      setViajes([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { fetchViajes(); }, [fetchViajes]);

  useEffect(() => {
    if (!socket) return;
    const onAsignado = () => fetchViajes();
    socket.on('viaje:asignado', onAsignado);
    return () => socket.off('viaje:asignado', onAsignado);
  }, [socket, fetchViajes]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Asignados</Text>
        <Text style={styles.headerSub}>Viajes que te asignó una empresa</Text>
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
            <ViajeCard viaje={item} onPress={() => navigation.navigate('ViajeActivo', { viajeId: item.id })} />
          )}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="briefcase-outline" size={32} color={colors.textHint} />
              <Text style={styles.vacioText}>No tenés viajes asignados por ninguna empresa</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  headerTitle: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3, padding: spacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  rutaBlock: { flex: 1, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  rutaDots: { alignItems: 'center', paddingTop: 3, width: 12 },
  dotOrigen: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  rutaLinea: { width: 2, height: 22, backgroundColor: colors.surface3, marginVertical: 2 },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  rutaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },

  precioBlock: { alignItems: 'flex-end' },
  precio: { fontSize: fontSize.h2, fontWeight: '800', color: colors.primary },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  meta: { fontSize: fontSize.caption, color: colors.textHint },

  vacio: { alignItems: 'center', paddingTop: 60, gap: spacing.xs, paddingHorizontal: spacing.lg },
  vacioText: { fontSize: fontSize.body, color: colors.textHint, textAlign: 'center' },
});
