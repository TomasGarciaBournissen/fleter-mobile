import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import NuevoViajeModal from './NuevoViajeModal';
import { formatKm, formatPrecio } from '../../utils/format';
import { getOrCreateVehiculo } from '../../utils/vehiculo';

let colors;
let styles;

const vehiculoPopupKey = (userId) => `@fleter_vehiculo_popup_dismissed:${userId}`;

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

const TAG_COLORS = () => ({
  FRAGIL: colors.warning,
  REFRIGERADO: colors.info,
  CARGA_PESADA: colors.textSecondary,
  PELIGROSO: colors.error,
  VOLUMINOSO: colors.textSecondary,
});

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
          <Text style={styles.precio}>${formatPrecio(viaje.precio)}</Text>
          <Text style={styles.distancia}>{formatKm(viaje.distanciaKm)}</Text>
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

const ESTADOS_ACTIVOS = ['CONDUCTOR_ASIGNADO', 'EN_CAMINO_A_ORIGEN', 'CARGANDO', 'EN_RUTA', 'DESCARGANDO'];

export default function DisponiblesScreen({ navigation }) {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const [viajes,        setViajes]        = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [refrescando,   setRefrescando]   = useState(false);
  const [viajeOferta,   setViajeOferta]   = useState(null);
  const [aceptando,     setAceptando]     = useState(false);
  const aceptandoRef   = useRef(false);
  const resumeChecked  = useRef(false);
  const vehiculoChecked = useRef(false);
  const [mostrarPopupVehiculo, setMostrarPopupVehiculo] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();
  const timeoutRef = useRef(null);

  const setAceptandoSync = (val) => {
    aceptandoRef.current = val;
    setAceptando(val);
  };

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

  const handleRefresh = useCallback(async () => {
    setRefrescando(true);
    try {
      const { data } = await api.get('/api/viajes/disponibles');
      setViajes(data.map(mapViaje));
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudieron cargar los viajes');
    } finally {
      setRefrescando(false);
    }
  }, []);

  // Fetch inicial y cada vez que la pantalla recupera el foco (volver de DetalleViaje,
  // cambiar de tab y volver, etc.) — antes solo se pedía una vez al montar.
  useFocusEffect(useCallback(() => { fetchViajes(); }, [fetchViajes]));

  // Al abrir la app: retomar viaje activo si existe
  useEffect(() => {
    if (resumeChecked.current) return;
    resumeChecked.current = true;
    api.get('/api/viajes/mis-viajes-conductor')
      .then(({ data }) => {
        const activo = data.find(v => ESTADOS_ACTIVOS.includes(v.estado));
        if (activo) navigation.navigate('ViajeActivo', { viajeId: activo.id_viaje });
      })
      .catch(() => {});
  }, [navigation]);

  // Al entrar: si el conductor no tiene ningún vehículo registrado, ofrecer agregarlo ahora o más tarde
  useEffect(() => {
    if (vehiculoChecked.current || !user) return;
    vehiculoChecked.current = true;
    (async () => {
      try {
        const dismissed = await AsyncStorage.getItem(vehiculoPopupKey(user.id_usuario));
        if (dismissed) return;
        const { data } = await api.get('/api/conductores/mis-vehiculos');
        if (!data?.length) setMostrarPopupVehiculo(true);
      } catch {}
    })();
  }, [user]);

  const handleAgregarVehiculoAhora = () => {
    setMostrarPopupVehiculo(false);
    navigation.getParent()?.navigate('Perfil', { abrirVehiculo: true });
  };

  const handleAgregarVehiculoDespues = async () => {
    setMostrarPopupVehiculo(false);
    if (user) await AsyncStorage.setItem(vehiculoPopupKey(user.id_usuario), '1');
  };

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
      clearTimeout(timeoutRef.current);
      setViajes(prev => prev.filter(v => v.id !== data.id_viaje));
      if (aceptandoRef.current) {
        setViajeOferta(null);
        setAceptandoSync(false);
        navigation.navigate('ViajeActivo', { viajeId: data.id_viaje, conductor: data.conductor });
      } else {
        setAceptandoSync(false);
        setViajeOferta(cur => cur?.id_viaje === data.id_viaje ? null : cur);
      }
    };

    const onYaAsignado = (data) => {
      clearTimeout(timeoutRef.current);
      setViajeOferta(null);
      setAceptandoSync(false);
      setViajes(prev => prev.filter(v => v.id !== data.id_viaje));
      Alert.alert('Llegaste tarde', 'Otro conductor aceptó este viaje primero.');
    };

    const onError = (data) => {
      if (!data?.mensaje) return;
      clearTimeout(timeoutRef.current);
      setAceptandoSync(false);
      Alert.alert('No se pudo aceptar', data.mensaje);
    };

    socket.on('viaje:disponible',         onDisponible);
    socket.on('viaje:conductor_asignado', onConductorAsignado);
    socket.on('viaje:ya_asignado',        onYaAsignado);
    socket.on('error',                    onError);

    return () => {
      clearTimeout(timeoutRef.current);
      socket.off('viaje:disponible',         onDisponible);
      socket.off('viaje:conductor_asignado', onConductorAsignado);
      socket.off('viaje:ya_asignado',        onYaAsignado);
      socket.off('error',                    onError);
    };
  }, [socket, navigation, user]);

  const handleAceptar = async () => {
    if (!socket || !viajeOferta) return;
    setAceptandoSync(true);
    try {
      const id_vehiculo = await getOrCreateVehiculo();
      socket.emit('viaje:aceptar', { id_viaje: viajeOferta.id_viaje, id_vehiculo });
      timeoutRef.current = setTimeout(() => {
        setAceptandoSync(false);
        setViajeOferta(null);
        Alert.alert('Sin respuesta', 'El servidor no respondió. Intentá de nuevo.');
      }, 10000);
    } catch {
      setAceptandoSync(false);
      Alert.alert('Error', 'No se pudo obtener el vehículo. Intentá de nuevo.');
    }
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
      <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />

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
          onRefresh={handleRefresh}
          refreshing={refrescando}
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

      <Modal visible={mostrarPopupVehiculo} transparent animationType="fade">
        <View style={styles.vehModalOverlay}>
          <View style={styles.vehModalSheet}>
            <View style={styles.vehModalIcono}>
              <Ionicons name="car-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.vehModalTitulo}>Registrá tu vehículo</Text>
            <Text style={styles.vehModalSub}>
              Necesitás al menos un vehículo para poder aceptar viajes. Podés agregarlo ahora
              o hacerlo más tarde desde tu perfil.
            </Text>
            <TouchableOpacity style={styles.vehModalBtnPrimario} onPress={handleAgregarVehiculoAhora} activeOpacity={0.85}>
              <Text style={styles.vehModalBtnPrimarioText}>Agregar vehículo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.vehModalBtnSecundario} onPress={handleAgregarVehiculoDespues} activeOpacity={0.7}>
              <Text style={styles.vehModalBtnSecundarioText}>Más tarde</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
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

  vehModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg,
  },
  vehModalSheet: {
    width: '100%', backgroundColor: colors.surface1, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.lg, alignItems: 'center',
  },
  vehModalIcono: {
    width: 64, height: 64, borderRadius: radius.full,
    backgroundColor: `${colors.primary}18`, borderWidth: 2, borderColor: `${colors.primary}44`,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  vehModalTitulo: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  vehModalSub: {
    fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center',
    lineHeight: 20, marginBottom: spacing.lg,
  },
  vehModalBtnPrimario: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center', width: '100%',
  },
  vehModalBtnPrimarioText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
  vehModalBtnSecundario: { paddingVertical: spacing.md, alignItems: 'center', width: '100%' },
  vehModalBtnSecundarioText: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },
});
