import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SelectorApariencia from '../../components/SelectorApariencia';

let colors;
let styles;

export default function PerfilGerenteScreen() {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const { user, logout } = useAuth();
  const nombre  = user ? `${user.nombre} ${user.apellido}` : 'Gerente';
  const inicial = (user?.nombre ?? 'G').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi perfil</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{inicial}</Text>
          </View>
          <Text style={styles.nombre}>{nombre}</Text>
          <Text style={styles.rol}>Gerente</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos personales</Text>
          <View style={styles.fila}>
            <Text style={styles.filaLabel}>Email</Text>
            <Text style={styles.filaValor}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Apariencia</Text>
          <SelectorApariencia />
        </View>

        <TouchableOpacity style={styles.btnCerrar} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.btnCerrarText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  headerTitle: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  avatarCard: {
    alignItems: 'center', paddingVertical: spacing.xl,
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3, marginBottom: spacing.md,
  },
  avatar: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: `${colors.primary}22`,
    borderWidth: 2, borderColor: `${colors.primary}44`,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.primary },
  nombre: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },
  rol: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 4 },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  filaLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  filaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary, maxWidth: '60%', textAlign: 'right' },

  btnCerrar: {
    borderWidth: 1, borderColor: colors.error,
    borderRadius: radius.lg, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.sm,
  },
  btnCerrarText: { fontSize: fontSize.h3, fontWeight: '700', color: colors.error },
});
