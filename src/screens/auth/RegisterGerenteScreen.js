import React, { useState, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useAuth, DEV_MODE } from '../../context/AuthContext';

let colors;
let styles;
let fieldStyles;

export default function RegisterGerenteScreen({ navigation }) {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  fieldStyles = useThemedStyles(createFieldStyles);
  const { mockLogin } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    contrasena: '',
    telefono: '',
    cuit_empresa: '',
    nombre_empresa: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apellidoRef  = useRef();
  const dniRef        = useRef();
  const telefonoRef    = useRef();
  const emailRef        = useRef();
  const contrasenaRef    = useRef();
  const cuitRef            = useRef();
  const nombreEmpresaRef    = useRef();

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.nombre.trim()) return 'El nombre es requerido.';
    if (!form.apellido.trim()) return 'El apellido es requerido.';
    if (!/^\d{7,9}$/.test(form.dni.trim())) return 'El DNI debe tener entre 7 y 9 dígitos.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'El email no es válido.';
    if (form.contrasena.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (!/^\d{11,13}$/.test(form.cuit_empresa.trim())) return 'El CUIT debe tener entre 11 y 13 dígitos.';
    if (!form.nombre_empresa.trim()) return 'El nombre de la empresa es requerido.';
    return null;
  };

  const handleRegistro = async () => {
    setError('');

    if (DEV_MODE) {
      mockLogin('GERENTE');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { registroGerente } = await import('../../services/auth');
      const datos = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        email: form.email.trim().toLowerCase(),
        contrasena: form.contrasena,
        cuit_empresa: form.cuit_empresa.trim(),
        nombre_empresa: form.nombre_empresa.trim(),
        ...(form.telefono.trim() && { telefono: form.telefono.trim() }),
      };
      await registroGerente(datos);
      // useAuth detecta el cambio en onAuthStateChanged → navega a GerenteStack automáticamente
    } catch (err) {
      setError(mapApiError(err));
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Registrar mi empresa</Text>
            <Text style={styles.subtitle}>Gestioná tu flota, tus conductores y los viajes de tu empresa</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.sectionLabel}>Datos personales</Text>

            <Field label="Nombre *">
              <TextInput
                style={styles.input}
                placeholder="Laura"
                placeholderTextColor={colors.textHint}
                value={form.nombre}
                onChangeText={set('nombre')}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => apellidoRef.current?.focus()}
              />
            </Field>

            <Field label="Apellido *">
              <TextInput
                ref={apellidoRef}
                style={styles.input}
                placeholder="Gómez"
                placeholderTextColor={colors.textHint}
                value={form.apellido}
                onChangeText={set('apellido')}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => dniRef.current?.focus()}
              />
            </Field>

            <Field label="DNI *">
              <TextInput
                ref={dniRef}
                style={styles.input}
                placeholder="12345678"
                placeholderTextColor={colors.textHint}
                value={form.dni}
                onChangeText={set('dni')}
                keyboardType="number-pad"
                maxLength={9}
                returnKeyType="next"
                onSubmitEditing={() => telefonoRef.current?.focus()}
              />
            </Field>

            <Field label="Teléfono">
              <TextInput
                ref={telefonoRef}
                style={styles.input}
                placeholder="+54 11 1234-5678"
                placeholderTextColor={colors.textHint}
                value={form.telefono}
                onChangeText={set('telefono')}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => cuitRef.current?.focus()}
              />
            </Field>

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Tu empresa</Text>

            <Field label="CUIT de la empresa *">
              <TextInput
                ref={cuitRef}
                style={styles.input}
                placeholder="30712345678"
                placeholderTextColor={colors.textHint}
                value={form.cuit_empresa}
                onChangeText={set('cuit_empresa')}
                keyboardType="number-pad"
                maxLength={13}
                returnKeyType="next"
                onSubmitEditing={() => nombreEmpresaRef.current?.focus()}
              />
            </Field>

            <Field label="Nombre de la empresa *">
              <TextInput
                ref={nombreEmpresaRef}
                style={styles.input}
                placeholder="Fletes del Sur"
                placeholderTextColor={colors.textHint}
                value={form.nombre_empresa}
                onChangeText={set('nombre_empresa')}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </Field>

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Acceso a la cuenta</Text>

            <Field label="Email *">
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="laura@empresa.com"
                placeholderTextColor={colors.textHint}
                value={form.email}
                onChangeText={set('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => contrasenaRef.current?.focus()}
              />
            </Field>

            <Field label="Contraseña * (mín. 6 caracteres)">
              <TextInput
                ref={contrasenaRef}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textHint}
                value={form.contrasena}
                onChangeText={set('contrasena')}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegistro}
              />
            </Field>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleRegistro}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={colors.onAccent} />
                : <Text style={styles.btnPrimaryText}>Crear empresa</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const createFieldStyles = (colors) => StyleSheet.create({
  label: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

function mapApiError(err) {
  const msg = err?.response?.data?.error || '';
  if (msg.includes('email ya esta registrado')) return 'Este email ya está en uso.';
  if (msg.includes('DNI ya esta registrado')) return 'Este DNI ya está registrado.';
  if (err?.code === 'auth/network-request-failed') return 'Sin conexión. Verificá tu internet.';
  if (err?.response?.status === 400) return msg || 'Revisá los datos ingresados.';
  if (err?.response?.status === 409) return msg || 'Ya existe una empresa con ese CUIT.';
  return 'Ocurrió un error. Intentá de nuevo.';
}

const createStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  header: { paddingTop: spacing.lg, paddingBottom: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  backText: { color: colors.primary, fontSize: fontSize.body, fontWeight: '600' },
  title: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary },
  form: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.surface3,
  },
  sectionLabel: {
    fontSize: fontSize.caption, fontWeight: '700', color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md,
  },
  divider: { height: 1, backgroundColor: colors.surface3, marginVertical: spacing.lg },
  input: {
    backgroundColor: colors.surface2, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    fontSize: fontSize.body, color: colors.textPrimary,
  },
  errorText: { color: colors.error, fontSize: fontSize.caption, marginBottom: spacing.md, textAlign: 'center' },
  btnPrimary: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: colors.onAccent, fontSize: fontSize.h3, fontWeight: '700' },
});
