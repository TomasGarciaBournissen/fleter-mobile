import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import api from '../../services/api';
import { useMiEmpresa } from '../../hooks/useMiEmpresa';

let colors;
let styles;

function cumpleCondiciones(vehiculo, condicionesReq) {
  if (!condicionesReq.length) return true;
  const propias = (vehiculo.condiciones ?? []).map(c => c.condicion);
  return condicionesReq.every(c => propias.includes(c));
}

export default function AsignarConductorScreen({ navigation, route }) {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const { viajeId, reasignar } = route.params ?? {};
  const { idEmpresa } = useMiEmpresa();

  const [viaje,       setViaje]       = useState(null);
  const [conductores, setConductores] = useState([]);
  const [vehiculos,   setVehiculos]   = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [idConductor, setIdConductor] = useState(null);
  const [idVehiculo,  setIdVehiculo]  = useState(null);
  const [asignando,   setAsignando]   = useState(false);
  const [liberando,   setLiberando]   = useState(false);

  const cargar = useCallback(async () => {
    if (!idEmpresa || !viajeId) return;
    setCargando(true);
    try {
      const [{ data: v }, { data: cs }, { data: vs }] = await Promise.all([
        api.get(`/api/viajes/${viajeId}`),
        api.get(`/api/empresas/${idEmpresa}/conductores`),
        api.get(`/api/empresas/${idEmpresa}/vehiculos`),
      ]);
      setViaje(v);
      setConductores(cs.filter(c => c.estado === 'ACTIVO'));
      setVehiculos(vs);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la información del viaje.');
    } finally {
      setCargando(false);
    }
  }, [idEmpresa, viajeId]);

  useEffect(() => { cargar(); }, [cargar]);

  const condicionesReq = (viaje?.condiciones_req ?? []).map(c => c.condicion);
  const vehiculosElegibles = vehiculos.filter(v => cumpleCondiciones(v, condicionesReq));

  const handleAsignar = async () => {
    if (!idConductor || !idVehiculo) return;
    setAsignando(true);
    try {
      const endpoint = reasignar ? 'reasignar' : 'asignar';
      await api.post(`/api/viajes/${viajeId}/${endpoint}`, { id_conductor: idConductor, id_vehiculo: idVehiculo });
      navigation.replace('ViajeActivoGerente', { viajeId });
    } catch (e) {
      const msg = e?.response?.status === 409
        ? (e?.response?.data?.error ?? 'El viaje cambió de estado, refrescá e intentá de nuevo.')
        : (e?.response?.data?.error ?? 'No se pudo asignar el conductor.');
      Alert.alert('Error', msg);
    } finally {
      setAsignando(false);
    }
  };

  const handleLiberar = () => {
    Alert.alert(
      'Liberar viaje',
      'El viaje vuelve al mercado abierto y otra empresa o conductor lo puede tomar. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Liberar', style: 'destructive',
          onPress: async () => {
            setLiberando(true);
            try {
              await api.post(`/api/viajes/${viajeId}/cancelar-reserva`);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo liberar el viaje.');
              setLiberando(false);
            }
          },
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>{reasignar ? 'Reasignar viaje' : 'Asignar viaje'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.seccionLabel}>CONDUCTOR</Text>
        {conductores.length === 0 ? (
          <Text style={styles.vacioText}>No tenés conductores activos en la empresa.</Text>
        ) : (
          <View style={styles.chipsWrap}>
            {conductores.map(c => {
              const nombre = `${c.usuario?.nombre ?? ''} ${c.usuario?.apellido ?? ''}`.trim();
              const activo = idConductor === c.id_conductor;
              return (
                <TouchableOpacity
                  key={c.id_conductor}
                  style={[styles.chip, activo && styles.chipActivo]}
                  onPress={() => setIdConductor(c.id_conductor)}
                >
                  <Text style={[styles.chipText, activo && styles.chipTextActivo]}>{nombre || 'Conductor'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={[styles.seccionLabel, { marginTop: spacing.lg }]}>VEHÍCULO</Text>
        {condicionesReq.length > 0 && (
          <Text style={styles.vacioSub}>Solo se muestran vehículos que cumplen los requisitos del viaje.</Text>
        )}
        {vehiculosElegibles.length === 0 ? (
          <Text style={styles.vacioText}>No tenés vehículos que cumplan los requisitos de este viaje.</Text>
        ) : (
          <View style={styles.chipsWrap}>
            {vehiculosElegibles.map(v => {
              const activo = idVehiculo === v.id_vehiculo;
              return (
                <TouchableOpacity
                  key={v.id_vehiculo}
                  style={[styles.chip, activo && styles.chipActivo]}
                  onPress={() => setIdVehiculo(v.id_vehiculo)}
                >
                  <Text style={[styles.chipText, activo && styles.chipTextActivo]}>{v.marca} {v.modelo} · {v.patente}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnAsignar, (!idConductor || !idVehiculo || asignando || liberando) && { opacity: 0.5 }]}
          onPress={handleAsignar}
          disabled={!idConductor || !idVehiculo || asignando || liberando}
          activeOpacity={0.85}
        >
          {asignando
            ? <ActivityIndicator color={colors.onAccent} />
            : <Text style={styles.btnAsignarText}>{reasignar ? 'Reasignar' : 'Asignar'}</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnLiberar, (asignando || liberando) && { opacity: 0.5 }]}
          onPress={handleLiberar}
          disabled={asignando || liberando}
          activeOpacity={0.7}
        >
          {liberando
            ? <ActivityIndicator color={colors.textSecondary} />
            : <Text style={styles.btnLiberarText}>Liberar viaje (volver al mercado)</Text>
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
  headerTitle: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 120 },

  seccionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textHint,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm,
  },
  vacioText: { fontSize: fontSize.body, color: colors.textHint },
  vacioSub: { fontSize: fontSize.caption, color: colors.textHint, marginBottom: spacing.sm },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1, borderColor: colors.surface3, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface1,
  },
  chipActivo: { borderColor: colors.primary, backgroundColor: `${colors.primary}18` },
  chipText: { fontSize: fontSize.body, color: colors.textSecondary, fontWeight: '600' },
  chipTextActivo: { color: colors.primary },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  btnAsignar: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  btnAsignarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.onAccent },
  btnLiberar: {
    paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.xs,
  },
  btnLiberarText: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },
});
