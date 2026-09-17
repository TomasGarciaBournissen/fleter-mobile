import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { fontSize, spacing, radius, fonts } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import Isotipo from '../../components/Isotipo';
import { useAuth } from '../../context/AuthContext';
import { DEV_MODE } from '../../context/AuthContext';

let colors;
let styles;

export default function LoginScreen({ navigation }) {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const { mockLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (DEV_MODE) {
      // En dev: simulamos login directo sin Firebase ni backend
      mockLogin('CLIENTE');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Completá todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const { loginEmail } = await import('../../services/auth');
      await loginEmail(email.trim().toLowerCase(), password);
      // useAuth detecta el cambio en onAuthStateChanged y navega automáticamente
    } catch (err) {
      setError(mapFirebaseError(err?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Marca */}
          <View style={styles.header}>
            <Isotipo size={52} />
            <Text style={styles.logo}>
              Fleter<Text style={styles.logoDot}>.</Text>
            </Text>
            <Text style={styles.tagline}>Tu logística, de punta a punta.</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Iniciar sesión</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@empresa.com"
                placeholderTextColor={colors.textHint}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textHint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={colors.onAccent} />
                : <Text style={styles.btnPrimaryText}>Entrar</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Registro */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tenés cuenta?</Text>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('RegisterCliente')}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>Registrarme como cliente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSecondary, { marginTop: spacing.sm }]}
              onPress={() => navigation.navigate('RegisterFletero')}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>Registrarme como conductor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSecondary, { marginTop: spacing.sm }]}
              onPress={() => navigation.navigate('RegisterGerente')}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>Registrar mi empresa</Text>
            </TouchableOpacity>
          </View>

          {/* ── PANEL DEV ── solo visible con DEV_MODE = true */}
          {DEV_MODE && (
            <View style={styles.devPanel}>
              <Text style={styles.devTitle}>🛠 DEV MODE</Text>
              <TouchableOpacity
                style={styles.devBtn}
                onPress={() => mockLogin('CLIENTE')}
                activeOpacity={0.7}
              >
                <Text style={styles.devBtnText}>Entrar como CLIENTE →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devBtn, { marginTop: spacing.xs }]}
                onPress={() => mockLogin('CONDUCTOR')}
                activeOpacity={0.7}
              >
                <Text style={styles.devBtnText}>Entrar como CONDUCTOR →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devBtn, { marginTop: spacing.xs }]}
                onPress={() => mockLogin('GERENTE')}
                activeOpacity={0.7}
              >
                <Text style={styles.devBtnText}>Entrar como GERENTE →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Traduce los códigos de error de Firebase a mensajes amigables en español
function mapFirebaseError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email o contraseña incorrectos.';
    case 'auth/invalid-email':
      return 'El email no es válido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Verificá tu internet.';
    default:
      return 'Ocurrió un error. Intentá de nuevo.';
  }
}

const createStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
  },
  logo: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginTop: spacing.md,
  },
  logoDot: {
    color: colors.primary,
  },
  tagline: {
    fontFamily: fonts.accent,
    fontSize: fontSize.caption,
    color: colors.textHint,
    marginTop: spacing.sm,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  form: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  formTitle: {
    fontSize: fontSize.h2,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.surface3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.caption,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: colors.onAccent,
    fontSize: fontSize.h3,
    fontWeight: '700',
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  btnSecondary: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.textPrimary,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  // ── Dev panel ──────────────────────────────────────────────
  devPanel: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: 'rgba(229,151,0,0.08)',
    alignItems: 'center',
  },
  devTitle: {
    color: colors.warning,
    fontSize: fontSize.caption,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  devBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  devBtnText: {
    color: colors.warning,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
});
