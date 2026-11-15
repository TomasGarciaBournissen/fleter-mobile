import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useMiEmpresa } from '../../hooks/useMiEmpresa';
import { formatPrecio } from '../../utils/format';

let colors;
let styles;

const TAG_LABELS = {
  FRAGIL: 'Frágil', REFRIGERADO: 'Refrigerado', CARGA_PESADA: 'Carga pesada',
  PELIGROSO: 'Peligroso', VOLUMINOSO: 'Voluminoso',
};
const TAG_COLORS = () => ({
  FRAGIL: colors.warning, REFRIGERADO: colors.info, CARGA_PESADA: colors.textSecondary,
  PELIGROSO: colors.error, VOLUMINOSO: colors.textSecondary,
});

function mapViaje(v) {
  const paradas = (v.paradas ?? []).slice().sort((a, b) => a.orden - b.orden);
  return {
    _raw: v,
    id: v.id_viaje,
    origen: paradas[0]?.direccion ?? '',
    destino: paradas[paradas.length - 1]?.direccion ?? '',
    precio: v.precio_estimado,
    requisitos: (v.condiciones_req ?? []).map(c => c.condicion),
    cliente: `${v.cliente?.usuario?.nombre ?? ''} ${v.cliente?.usuario?.apellido ?? ''}`.trim(),
  };
}

function TagRequisito({ label }) {
  const color = TAG_COLORS()[label] ?? colors.textSecondary;
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
            <Text style={[styles.rutaValor, { marginTop: spacing.xs }]}>{viaje.destino}</Text>
          </View>
        </View>
        <Text style={styles.precio}>${formatPrecio(viaje.precio)}</Text>
      </View>
      {viaje.requisitos.length > 0 && (
        <View style={styles.tagsRow}>
          {viaje.requisitos.map(r => <TagRequisito key={r} label={r} />)}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DisponiblesGerenteScreen({ navigation }) {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const { idEmpresa } = useMiEmpresa();
  const [viajes,   setViajes]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const { socket } = useSocket();

  const fetchViajes = useCallback(async () => {
    if (!idEmpresa) return;
    setCargando(true);
    try {
      const { data } = await api.get(`/api/empresas/${idEmpresa}/viajes-disponibles`);
      setViajes(data.map(mapViaje));
    } catch {
      setViajes([]);
    } finally {
      setCargando(false);
    }
  }, [idEmpresa]);

  useEffect(() => { fetchViajes(); }, [fetchViajes]);

  useEffect(() => {
    if (!socket) return;
    const onDisponible = (data) => {
      setViajes(prev => {
        if (prev.some(v => v.id === data.id_viaje)) return prev;
        return [mapViaje({ ...data, condiciones_req: data.condiciones_req ?? [] }), ...prev];
      });
    };
    const onReservado = (data) => {
      setViajes(prev => prev.filter(v => v.id !== data.id_viaje));
    };
    socket.on('viaje:disponible', onDisponible);
    socket.on('viaje:reservado',  onReservado);
    return () => {
      socket.off('viaje:disponible', onDisponible);
      socket.off('viaje:reservado',  onReservado);
    };
  }, [socket]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Disponibles</Text>
        <Text style={styles.headerSub}>
          {cargando ? 'Buscando viajes...' : `${viajes.length} viajes para tu flota`}
        </Text>
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
            <ViajeCard viaje={item} onPress={() => navigation.navigate('DetalleViajeGerente', { viaje: item._raw })} />
          )}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={styles.vacioText}>No hay viajes disponibles para tu flota por ahora</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
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

  precio: { fontSize: fontSize.h2, fontWeight: '800', color: colors.primary },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  tag: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '700' },

  vacio: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.lg },
  vacioText: { fontSize: fontSize.body, color: colors.textHint, textAlign: 'center' },
});
