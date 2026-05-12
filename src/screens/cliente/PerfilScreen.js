import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const USUARIO_MOCK = {
  nombre: 'Tomás García',
  email: 'tomas@movix.com',
  telefono: '+54 11 5555-1234',
  metodoPago: 'Mercado Pago',
  direccionFrecuente: 'Palermo Hollywood, CABA',
  puntaje: 4.8,
  viajesTotal: 47,
};

function FilaPerfil({ label, value, editable, onChangeText }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.filaLabel}>{label}</Text>
      {editable ? (
        <TextInput
          style={styles.filaInput}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textHint}
        />
      ) : (
        <Text style={styles.filaValue}>{value}</Text>
      )}
    </View>
  );
}

function SeccionCard({ titulo, children }) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>{titulo}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function PerfilScreen({ navigation }) {
  const { logout } = useAuth();
  const [usuario, setUsuario] = useState(USUARIO_MOCK);
  const [notifViajes, setNotifViajes] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);
  const [editando, setEditando] = useState(false);

  const actualizar = (campo, valor) => setUsuario((prev) => ({ ...prev, [campo]: valor }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi perfil</Text>
        <TouchableOpacity onPress={() => setEditando((v) => !v)} style={styles.editBtn}>
          <Text style={styles.editBtnText}>{editando ? 'Guardar' : 'Editar'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + stats */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuario.nombre.charAt(0)}
            </Text>
          </View>
          <Text style={styles.avatarNombre}>{usuario.nombre}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValor}>{usuario.viajesTotal}</Text>
              <Text style={styles.statLabel}>Viajes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValor}>★ {usuario.puntaje}</Text>
              <Text style={styles.statLabel}>Puntaje</Text>
            </View>
          </View>
        </View>

        {/* Datos personales */}
        <SeccionCard titulo="Datos personales">
          <FilaPerfil label="Nombre" value={usuario.nombre} editable={editando} onChangeText={(v) => actualizar('nombre', v)} />
          <View style={styles.divider} />
          <FilaPerfil label="Email" value={usuario.email} editable={false} />
          <View style={styles.divider} />
          <FilaPerfil label="Teléfono" value={usuario.telefono} editable={editando} onChangeText={(v) => actualizar('telefono', v)} />
        </SeccionCard>

        {/* Dirección frecuente */}
        <SeccionCard titulo="Dirección frecuente">
          <FilaPerfil
            label="Dirección"
            value={usuario.direccionFrecuente}
            editable={editando}
            onChangeText={(v) => actualizar('direccionFrecuente', v)}
          />
        </SeccionCard>

        {/* Método de pago */}
        <SeccionCard titulo="Método de pago">
          <View style={styles.fila}>
            <Text style={styles.filaLabel}>Método actual</Text>
            <View style={styles.metodoPagoChip}>
              <Text style={styles.metodoPagoText}>{usuario.metodoPago}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.btnSecundario}>
            <Text style={styles.btnSecundarioText}>Cambiar método de pago</Text>
          </TouchableOpacity>
        </SeccionCard>

        {/* Notificaciones */}
        <SeccionCard titulo="Notificaciones">
          <View style={styles.notifFila}>
            <View>
              <Text style={styles.notifLabel}>Estado de viajes</Text>
              <Text style={styles.notifSub}>Actualizaciones en tiempo real</Text>
            </View>
            <Switch
              value={notifViajes}
              onValueChange={setNotifViajes}
              trackColor={{ false: colors.surface3, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.notifFila}>
            <View>
              <Text style={styles.notifLabel}>Promociones</Text>
              <Text style={styles.notifSub}>Ofertas y descuentos</Text>
            </View>
            <Switch
              value={notifPromos}
              onValueChange={setNotifPromos}
              trackColor={{ false: colors.surface3, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </SeccionCard>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.btnCerrarSesion} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.btnCerrarSesionText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface1,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },
  editBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: `${colors.primary}22`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editBtnText: { fontSize: fontSize.body, color: colors.primary, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  avatarSection: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: {
    width: 80, height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#000' },
  avatarNombre: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  statItem: { alignItems: 'center' },
  statValor: { fontSize: fontSize.h2, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.surface3 },

  seccion: { marginBottom: spacing.md },
  seccionTitulo: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.textHint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    overflow: 'hidden',
  },

  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  filaLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  filaValue: { fontSize: fontSize.body, color: colors.textPrimary, fontWeight: '600' },
  filaInput: {
    fontSize: fontSize.body,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.sm,
  },

  metodoPagoChip: {
    backgroundColor: `${colors.primary}22`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  metodoPagoText: { fontSize: fontSize.caption, color: colors.primary, fontWeight: '700' },

  divider: { height: 1, backgroundColor: colors.surface3, marginHorizontal: spacing.md },

  btnSecundario: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  btnSecundarioText: { fontSize: fontSize.body, color: colors.primary, fontWeight: '600' },

  notifFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notifLabel: { fontSize: fontSize.body, color: colors.textPrimary, fontWeight: '600' },
  notifSub: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },

  btnCerrarSesion: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  btnCerrarSesionText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.error },
});
