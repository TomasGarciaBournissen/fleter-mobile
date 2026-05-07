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
import { colors, fontSize, spacing, radius } from '../../theme';
import { DEV_MODE } from '../../context/AuthContext';

export default function RegisterFleteroScreen({ navigation }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    contrasena: '',
    telefono: '',
    nro_licencia: '',
    licencia_vencimiento: '', // ISO 8601 — ej: "2027-12-31"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Refs para avanzar entre campos con el teclado
  const apellidoRef = useRef();
  const dniRef = useRef();
  const telefonoRef = useRef();
  const emailRef = useRef();
  const contrasenaRef = useRef();
  const licenciaRef = useRef();
  const vencimientoRef = useRef();

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.nombre.trim()) return 'El nombre es requerido.';
    if (!form.apellido.trim()) return 'El apellido es requerido.';
    if (!/^\d{7,9}$/.test(form.dni.trim())) return 'El DNI debe tener entre 7 y 9 dígitos.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'El email no es válido.';
    if (form.contrasena.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (!form.nro_licencia.trim()) return 'El número de licencia es requerido.';
    if (!form.licencia_vencimiento.trim()) return 'La fecha de vencimiento de licencia es requerida.';
    // Validar formato de fecha YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.licencia_vencimiento.trim())) {
      return 'La fecha de vencimiento debe tener el formato AAAA-MM-DD (ej: 2027-12-31).';
    }
    return null;
  };

  const handleRegistro = async () => {
    setError('');

    if (DEV_MODE) {
      // En dev: simula registro exitoso → muestra pantalla de cuenta pendiente
      navigation.replace('CuentaPendiente');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { registroConductor } = await import('../../services/auth');
      const datos = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        email: form.email.trim().toLowerCase(),
        contrasena: form.contrasena,
        nro_licencia: form.nro_licencia.trim(),
        // El backend espera ISO 8601 datetime
        licencia_vencimiento: `${form.licencia_vencimiento.trim()}T00:00:00.000Z`,
        ...(form.telefono.trim() && { telefono: form.telefono.trim() }),
      };
      await registroConductor(datos);
      // Registro exitoso → ir a pantalla de cuenta pendiente
      navigation.replace('CuentaPendiente');
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
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
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Ser conductor</Text>
            <Text style={styles.subtitle}>Registrate para recibir viajes y generar ingresos</Text>
          </View>

          {/* Banner informativo */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>⏳</Text>
            <Text style={styles.infoText}>
              Tu cuenta será revisada por el equipo de Fleter antes de que puedas recibir viajes.
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.sectionLabel}>Datos personales</Text>

            <Field label="Nombre *">
              <TextInput
                style={styles.input}
                placeholder="Carlos"
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
                placeholder="Martínez"
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
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </Field>

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Licencia de conducir</Text>

            <Field label="Número de licencia *">
              <TextInput
                ref={licenciaRef}
                style={styles.input}
                placeholder="B123456"
                placeholderTextColor={colors.textHint}
                value={form.nro_licencia}
                onChangeText={set('nro_licencia')}
                autoCapitalize="characters"
                returnKeyType="next"
                onSubmitEditing={() => vencimientoRef.current?.focus()}
              />
            </Field>

            <Field label="Vencimiento de licencia * (AAAA-MM-DD)">
              <TextInput
                ref={vencimientoRef}
                style={styles.input}
                placeholder="2027-12-31"
                placeholderTextColor={colors.textHint}
                value={form.licencia_vencimiento}
                onChangeText={set('licencia_vencimiento')}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
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
                placeholder="carlos@email.com"
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
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.btnPrimaryText}>Enviar solicitud</Text>
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

const fieldStyles = StyleSheet.create({
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
  return 'Ocurrió un error. Intentá de nuevo.';
}

const styles = StyleSheet.create({
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginBottom: spacing.md,
  },
  backText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  title: {
    fontSize: fontSize.h1,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface1,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  form: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  sectionLabel: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface3,
    marginVertical: spacing.lg,
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
    color: '#000',
    fontSize: fontSize.h3,
    fontWeight: '700',
  },
});
