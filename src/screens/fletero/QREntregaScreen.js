import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import api from '../../services/api';

let colors;
let styles;

export default function QREntregaScreen({ navigation, route }) {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const { viajeId, paradas = [] } = route.params ?? {};

  // paradas pendientes ordenadas por orden
  const paradasPendientes = paradas
    .filter(p => p.estado !== 'ENTREGADO')
    .sort((a, b) => a.orden - b.orden);

  const [paradaIdx,      setParadaIdx]      = useState(0);
  const [permisoOk,      setPermisoOk]      = useState(null);
  const [confirmando,    setConfirmando]    = useState(false);
  const [confirmada,     setConfirmada]     = useState(false);
  const [viajeFinalizado, setViajeFinalizado] = useState(false);
  const [precioReal,     setPrecioReal]     = useState(null);
  const [remitoUrl,      setRemitoUrl]      = useState(null);

  const paradaActual = paradasPendientes[paradaIdx] ?? null;
  const esUltimaParada = paradaIdx === paradasPendientes.length - 1;

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setPermisoOk(status === 'granted');
    });
  }, []);

  const pedirPermiso = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermisoOk(status === 'granted');
  };

  const handleConfirmar = async () => {
    if (!paradaActual || confirmando) return;
    setConfirmando(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { data } = await api.post(`/api/viajes/${viajeId}/confirmar-parada`, {
        id_parada: paradaActual.id_parada,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });

      if (data.viaje_finalizado) {
        setViajeFinalizado(true);
        setPrecioReal(data.precio_real);
        setRemitoUrl(data.remito_url);
        setConfirmada(true);
      } else {
        const siguiente = paradaIdx + 1;
        if (siguiente < paradasPendientes.length) {
          setParadaIdx(siguiente);
        } else {
          setConfirmada(true);
        }
      }
    } catch (e) {
      const msg = e?.response?.data?.error ?? 'No pudimos obtener tu ubicación o confirmar la parada. Intentá de nuevo.';
      Alert.alert('No se pudo confirmar', msg);
    } finally {
      setConfirmando(false);
    }
  };

  const handleIrACobro = () => {
    navigation.replace('Cobro', { viajeId, precioReal, remitoUrl });
  };

  // ── Permiso de ubicación denegado ───────────────────────────────────────────
  if (permisoOk === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmar entrega</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centrado}>
          <Ionicons name="location-outline" size={48} color={colors.textHint} />
          <Text style={styles.permisoDenegadoTitulo}>Necesitamos tu ubicación</Text>
          <Text style={styles.permisoDenegadoSub}>
            Para confirmar una entrega necesitamos verificar que estés en la parada.
            Habilitá el permiso de ubicación para continuar.
          </Text>
          <TouchableOpacity style={styles.btnPrimario} onPress={pedirPermiso}>
            <Text style={styles.btnPrimarioText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecundario} onPress={() => Linking.openSettings()}>
            <Text style={styles.btnSecundarioText}>Abrir configuración</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Cargando permisos ───────────────────────────────────────────────────────
  if (permisoOk === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  // ── Sin paradas para confirmar ──────────────────────────────────────────────
  if (paradasPendientes.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmar entrega</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centrado}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
          <Text style={styles.permisoDenegadoTitulo}>Todas las paradas confirmadas</Text>
          <TouchableOpacity style={styles.btnPrimario} onPress={handleIrACobro}>
            <Text style={styles.btnPrimarioText}>Ver cobro</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Confirmar entrega</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Indicador de parada actual */}
      {paradasPendientes.length > 1 && (
        <View style={styles.paradaIndicador}>
          <Text style={styles.paradaIndicadorText}>
            Parada {paradaIdx + 1} de {paradasPendientes.length}
          </Text>
          {paradaActual?.direccion ? (
            <Text style={styles.paradaDireccion} numberOfLines={1}>{paradaActual.direccion}</Text>
          ) : null}
        </View>
      )}

      {/* ── Parada confirmada ───────────────────────────────────────────────── */}
      {confirmada ? (
        <View style={styles.content}>
          <View style={styles.exitoHeader}>
            <View style={styles.exitoIcono}>
              <Ionicons name="checkmark" size={36} color={colors.success} />
            </View>
            <Text style={styles.exitoTitulo}>
              {viajeFinalizado ? 'Viaje finalizado' : 'Parada confirmada'}
            </Text>
            <Text style={styles.exitoSub}>
              {viajeFinalizado
                ? 'Todas las paradas fueron entregadas'
                : 'Podés continuar al siguiente destino'}
            </Text>
          </View>

          {viajeFinalizado && precioReal != null && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resumen</Text>
              <View style={styles.filaInfo}>
                <Text style={styles.filaLabel}>Total del viaje</Text>
                <Text style={styles.filaPrecio}>${precioReal.toLocaleString('es-AR')}</Text>
              </View>
              {remitoUrl ? (
                <View style={styles.filaInfo}>
                  <Text style={styles.filaLabel}>Remito generado</Text>
                  <Ionicons name="document-outline" size={16} color={colors.success} />
                </View>
              ) : null}
            </View>
          )}

          <TouchableOpacity style={styles.btnPrimario} onPress={handleIrACobro} activeOpacity={0.85}>
            <Text style={styles.btnPrimarioText}>
              {viajeFinalizado ? 'Ver cobro' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Confirmación por ubicación ──────────────────────────────────────── */
        <View style={styles.confirmarWrap}>
          <View style={styles.confirmarIconoWrap}>
            <Ionicons name="location" size={56} color={colors.primary} />
          </View>

          <Text style={styles.instruccion}>
            {paradaActual?.direccion
              ? `Confirmá tu llegada a: ${paradaActual.direccion}`
              : 'Confirmá tu llegada a esta parada'}
          </Text>
          <Text style={styles.instruccionSub}>
            Verificamos tu ubicación GPS al confirmar. Tenés que estar cerca de la parada.
          </Text>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[styles.btnAccion, confirmando && styles.btnDisabled]}
            onPress={handleConfirmar}
            disabled={confirmando}
            activeOpacity={0.85}
          >
            {confirmando
              ? <ActivityIndicator color={colors.textPrimary} />
              : <Text style={styles.btnAccionText}>{esUltimaParada ? 'Finalizar viaje' : 'Confirmar entrega'}</Text>
            }
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: colors.surface1, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },

  paradaIndicador: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.surface2, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  paradaIndicadorText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  paradaDireccion:     { fontSize: fontSize.body, color: colors.textPrimary, fontWeight: '600', marginTop: 2 },

  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },

  confirmarWrap: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.xl },
  confirmarIconoWrap: {
    alignSelf: 'center', width: 96, height: 96, borderRadius: radius.full,
    backgroundColor: `${colors.primary}18`, borderWidth: 2, borderColor: `${colors.primary}44`,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  instruccion: {
    fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary,
    textAlign: 'center', marginBottom: spacing.xs,
  },
  instruccionSub: {
    fontSize: fontSize.body, color: colors.textSecondary,
    textAlign: 'center',
  },

  btnAccion: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  btnAccionText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
  btnDisabled: { opacity: 0.6 },

  content: { flex: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  exitoHeader: { alignItems: 'center', paddingVertical: spacing.lg },
  exitoIcono: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: `${colors.success}22`, borderWidth: 2, borderColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  exitoTitulo: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  exitoSub:    { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  filaInfo:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  filaLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  filaPrecio: { fontSize: fontSize.h2, fontWeight: '800', color: colors.primary },

  btnPrimario: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center', width: '100%',
  },
  btnPrimarioText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.onAccent },
  btnSecundario: { paddingVertical: spacing.sm, alignItems: 'center' },
  btnSecundarioText: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },

  permisoDenegadoTitulo: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  permisoDenegadoSub:    { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
