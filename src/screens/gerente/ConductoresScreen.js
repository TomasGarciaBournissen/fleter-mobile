import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import api from '../../services/api';
import { useMiEmpresa } from '../../hooks/useMiEmpresa';

let colors;
let styles;

function ConductorCard({ c, onAprobar, onDesafiliar }) {
  const nombre = `${c.usuario?.nombre ?? ''} ${c.usuario?.apellido ?? ''}`.trim();
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{nombre.charAt(0) || 'C'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.nombre}>{nombre || 'Conductor'}</Text>
        <Text style={[styles.estado, c.estado === 'PENDIENTE' && { color: colors.warning }]}>
          {c.estado === 'PENDIENTE' ? 'Pendiente de aprobación' : 'Activo'}
        </Text>
      </View>
      {c.estado === 'PENDIENTE' ? (
        <TouchableOpacity style={styles.btnAprobar} onPress={() => onAprobar(c)}>
          <Text style={styles.btnAprobarText}>Aprobar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => onDesafiliar(c)} style={styles.eliminarBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="exit-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ConductoresScreen() {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const { idEmpresa } = useMiEmpresa();
  const [conductores, setConductores] = useState([]);
  const [cargando,    setCargando]    = useState(true);

  const cargar = useCallback(async () => {
    if (!idEmpresa) return;
    setCargando(true);
    try {
      const { data } = await api.get(`/api/empresas/${idEmpresa}/conductores`);
      setConductores(data);
    } catch {
      setConductores([]);
    } finally {
      setCargando(false);
    }
  }, [idEmpresa]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleAprobar = async (c) => {
    try {
      await api.post(`/api/empresas/${idEmpresa}/conductores/${c.id_conductor}/aprobar`);
      setConductores(prev => prev.map(x => x.id_conductor === c.id_conductor ? { ...x, estado: 'ACTIVO' } : x));
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo aprobar.');
    }
  };

  const handleDesafiliar = (c) => {
    const nombre = `${c.usuario?.nombre ?? ''} ${c.usuario?.apellido ?? ''}`.trim();
    Alert.alert(
      'Desafiliar conductor',
      `¿Sacar a ${nombre || 'este conductor'} de la empresa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desafiliar', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/empresas/${idEmpresa}/conductores/${c.id_conductor}`);
              setConductores(prev => prev.filter(x => x.id_conductor !== c.id_conductor));
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo desafiliar.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conductores</Text>
        <Text style={styles.headerSub}>Conductores afiliados a tu empresa</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cargando ? (
          <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.lg }} />
        ) : conductores.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="people-outline" size={32} color={colors.textHint} />
            <Text style={styles.vacioText}>Todavía no tenés conductores afiliados</Text>
            <Text style={styles.vacioSub}>Compartí tu código de afiliación desde la pantalla de Empresa</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {conductores.map((c, i) => (
              <React.Fragment key={c.id_conductor}>
                {i > 0 && <View style={styles.divider} />}
                <ConductorCard c={c} onAprobar={handleAprobar} onDesafiliar={handleDesafiliar} />
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  headerTitle: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3, padding: spacing.md,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
  nombre: { fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary },
  estado: { fontSize: fontSize.caption, color: colors.success, marginTop: 2 },
  eliminarBtn: { padding: 4 },

  btnAprobar: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  btnAprobarText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.onAccent },

  divider: { height: 1, backgroundColor: colors.surface3, marginVertical: spacing.xs },

  vacio: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.xs, paddingHorizontal: spacing.lg },
  vacioText: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  vacioSub: { fontSize: fontSize.caption, color: colors.textHint, textAlign: 'center' },
});
