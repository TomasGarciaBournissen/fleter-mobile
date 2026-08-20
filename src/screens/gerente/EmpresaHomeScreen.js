import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useMiEmpresa } from '../../hooks/useMiEmpresa';

const MOTIVO_LABELS = {
  conductor_cancelo: 'El conductor canceló el viaje',
  conductor_desafiliado: 'El conductor se desafilió de la empresa',
};

export default function EmpresaHomeScreen({ navigation }) {
  const { empresa, idEmpresa, cargando, recargar } = useMiEmpresa();
  const [detalle, setDetalle] = useState(null);
  const [regenerando, setRegenerando] = useState(false);
  const { socket } = useSocket();

  const cargarDetalle = useCallback(async () => {
    if (!idEmpresa) return;
    try {
      const { data } = await api.get(`/api/empresas/${idEmpresa}`);
      setDetalle(data);
    } catch {}
  }, [idEmpresa]);

  useEffect(() => { cargarDetalle(); }, [cargarDetalle]);

  useEffect(() => {
    if (!socket) return;
    const onRequiereReasignacion = (data) => {
      Alert.alert(
        'Viaje necesita reasignación',
        MOTIVO_LABELS[data.motivo] ?? 'Un viaje asignado necesita un conductor nuevo.',
        [{ text: 'Reasignar', onPress: () => navigation.navigate('AsignarConductor', { viajeId: data.id_viaje, reasignar: true }) }]
      );
    };
    socket.on('viaje:requiere_reasignacion', onRequiereReasignacion);
    return () => socket.off('viaje:requiere_reasignacion', onRequiereReasignacion);
  }, [socket, navigation]);

  const handleRegenerarCodigo = () => {
    Alert.alert(
      'Regenerar código',
      'El código anterior dejará de funcionar. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Regenerar',
          onPress: async () => {
            setRegenerando(true);
            try {
              await api.post(`/api/empresas/${idEmpresa}/regenerar-codigo`);
              recargar();
              cargarDetalle();
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo regenerar el código.');
            } finally {
              setRegenerando(false);
            }
          },
        },
      ]
    );
  };

  const handleCompartir = () => {
    if (!empresa?.codigo_afiliacion) return;
    Share.share({
      message: `Sumate a ${empresa.nombre} en Movix con el código de afiliación: ${empresa.codigo_afiliacion}`,
    }).catch(() => {});
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!empresa) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.vacio}>
          <Text style={styles.vacioText}>No encontramos ninguna empresa asociada a tu cuenta.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{empresa.nombre}</Text>
        <Text style={styles.headerSub}>CUIT {empresa.cuit}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValor}>{detalle?.cantidad_conductores_activos ?? '—'}</Text>
            <Text style={styles.statLabel}>Conductores</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={16} color={colors.warning} />
            <Text style={styles.statValor}>{detalle?.calificacion_promedio != null ? detalle.calificacion_promedio.toFixed(1) : '—'}</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
        </View>

        {/* Código de afiliación */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Código de afiliación</Text>
          <Text style={styles.codigo}>{empresa.codigo_afiliacion}</Text>
          <Text style={styles.codigoSub}>Compartilo con tus conductores para que se afilien</Text>
          <View style={styles.codigoBotones}>
            <TouchableOpacity style={styles.btnSecundario} onPress={handleCompartir}>
              <Ionicons name="share-outline" size={16} color={colors.primary} />
              <Text style={styles.btnSecundarioText}> Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSecundario, regenerando && { opacity: 0.6 }]}
              onPress={handleRegenerarCodigo}
              disabled={regenerando}
            >
              {regenerando
                ? <ActivityIndicator color={colors.primary} size="small" />
                : <><Ionicons name="refresh-outline" size={16} color={colors.primary} /><Text style={styles.btnSecundarioText}> Regenerar</Text></>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Accesos */}
        <TouchableOpacity style={styles.accesoRow} onPress={() => navigation.navigate('Flota')} activeOpacity={0.8}>
          <Ionicons name="car-outline" size={20} color={colors.primary} />
          <Text style={styles.accesoText}>Flota de vehículos</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textHint} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.accesoRow} onPress={() => navigation.navigate('Conductores')} activeOpacity={0.8}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <Text style={styles.accesoText}>Conductores afiliados</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textHint} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  headerTitle: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, alignItems: 'center', gap: 2,
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3, paddingVertical: spacing.md,
  },
  statValor: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: fontSize.caption, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  codigo: { fontSize: 32, fontWeight: '800', color: colors.primary, letterSpacing: 2 },
  codigoSub: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 4, marginBottom: spacing.sm },
  codigoBotones: { flexDirection: 'row', gap: spacing.sm },
  btnSecundario: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${colors.primary}66`, borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  btnSecundarioText: { fontSize: fontSize.body, color: colors.primary, fontWeight: '600' },

  accesoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, marginBottom: spacing.sm,
  },
  accesoText: { flex: 1, fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },

  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  vacioText: { fontSize: fontSize.body, color: colors.textHint, textAlign: 'center' },
});
