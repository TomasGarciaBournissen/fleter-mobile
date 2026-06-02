import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export default function CuentaPendienteScreen() {
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.container}>
        {/* Ícono de estado */}
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={36} color={colors.warning} />
        </View>

        {/* Mensaje principal */}
        <Text style={styles.title}>Solicitud en revisión</Text>
        <Text style={styles.subtitle}>
          Recibimos tu solicitud. El equipo de Fleter está verificando tus datos y
          licencia de conducir.
        </Text>

        {/* Tarjeta de info */}
        <View style={styles.card}>
          <InfoRow icon={<Ionicons name="id-card-outline" size={20} color={colors.textSecondary} />} text="Verificación de identidad y DNI" />
          <InfoRow icon={<MaterialIcons name="drive-eta" size={20} color={colors.textSecondary} />} text="Validación de licencia de conducir" />
          <InfoRow icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />} text="Aprobación del equipo Fleter" />
        </View>

        <Text style={styles.timeText}>
          Este proceso suele tardar entre 24 y 48 horas hábiles. Te notificaremos
          por email cuando tu cuenta esté activa.
        </Text>

        {/* Botón de salir */}
        <TouchableOpacity
          style={styles.btnLogout}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Text style={styles.btnLogoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface1,
    borderWidth: 2,
    borderColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: fontSize.h1,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIcon: {
    width: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  timeText: {
    fontSize: fontSize.caption,
    color: colors.textHint,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  btnLogout: {
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  btnLogoutText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
});
