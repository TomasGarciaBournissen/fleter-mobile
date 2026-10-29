import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';

// Campo de formulario del DS v2: label visible arriba (nunca solo placeholder),
// foco con borde naranja y halo, hint debajo y error pegado al campo.
// `secreto` agrega el botón de mostrar/ocultar; `onPress` lo vuelve un selector
// (por ejemplo, abre el calendario) en vez de un campo de texto.
// `error`: texto → mensaje debajo; `true` → solo el borde rojo (cuando el
// mensaje ya está en otro campo, como email + contraseña en el login).
const Campo = forwardRef(function Campo(
  { label, opcional, hint, error, secreto, mono, icono, onPress, value, style, ...inputProps },
  ref,
) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [foco, setFoco] = useState(false);
  const [visible, setVisible] = useState(false);

  // editable={false}: se ve como dato fijo, no como campo para escribir
  const fijo = inputProps.editable === false;
  const caja = [styles.caja, fijo && styles.cajaFija, foco && styles.cajaFoco, error && styles.cajaError];
  // Mono solo para el dato cargado: el placeholder va en la fuente de UI
  const texto = [styles.input, mono && !!value && styles.mono, fijo && { color: colors.ink2 }];

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <Text style={styles.label}>
          {label}{opcional ? <Text style={styles.opcional}> (opcional)</Text> : null}
        </Text>
      ) : null}
      <View style={[styles.halo, foco && styles.haloFoco]}>
        {onPress ? (
          <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={caja}>
            {icono ? <MaterialCommunityIcons name={icono} size={20} color={colors.ink3} /> : null}
            <Text style={[styles.valor, mono && value && styles.mono, !value && { color: colors.ink3 }]}>{value || inputProps.placeholder}</Text>
          </Pressable>
        ) : (
          <View style={caja}>
            {icono ? <MaterialCommunityIcons name={icono} size={20} color={colors.ink3} /> : null}
            <TextInput
              accessibilityLabel={label}
              {...inputProps}
              ref={ref}
              value={value}
              style={texto}
              placeholderTextColor={colors.ink3}
              secureTextEntry={secreto && !visible}
              onFocus={(e) => { setFoco(true); inputProps.onFocus?.(e); }}
              onBlur={(e) => { setFoco(false); inputProps.onBlur?.(e); }}
            />
            {secreto ? (
              <Pressable
                onPress={() => setVisible((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                hitSlop={6}
                style={styles.ojo}
              >
                <MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.ink3} />
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
      {typeof error === 'string' && error ? (
        <View style={styles.errorFila} accessibilityLiveRegion="polite">
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.errorInk} style={{ marginTop: 1 }} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

export default Campo;

const createStyles = (c) => StyleSheet.create({
  wrap:     { marginTop: 16 },
  label:    { fontFamily: fonts.uiSemiBold, fontSize: 11.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.ink3, marginBottom: 6 },
  opcional: { fontFamily: fonts.uiMedium, textTransform: 'none', letterSpacing: 0 },
  // El halo es un borde externo de 3px que solo se pinta con foco
  halo:     { margin: -3, padding: 3, borderRadius: 9 },
  haloFoco: { backgroundColor: c.accentSoft },
  caja:     { height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  cajaFoco: { borderColor: c.accent },
  cajaFija: { backgroundColor: c.surface2 },
  cajaError:{ borderColor: c.error },
  input:    { flex: 1, minWidth: 0, height: '100%', fontFamily: fonts.ui, fontSize: 15, color: c.ink, paddingVertical: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null) },
  valor:    { flex: 1, fontFamily: fonts.ui, fontSize: 15, color: c.ink },
  mono:     { fontFamily: fonts.mono, letterSpacing: 0.4 },
  ojo:      { width: 36, height: 36, marginRight: -8, alignItems: 'center', justifyContent: 'center' },
  hint:     { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 6 },
  errorFila:{ flexDirection: 'row', gap: 6, marginTop: 8 },
  error:    { flex: 1, fontFamily: fonts.uiMedium, fontSize: 13, color: c.errorInk, lineHeight: 18 },
});
