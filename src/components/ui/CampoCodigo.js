import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { formatearCodigo } from '../../utils/formularios';

// Código de invitación XXXXX-XXXXX en un solo campo grande. Acepta pegar
// (con o sin guion, espacios o minúsculas) y tiene un botón «Pegar».
export default function CampoCodigo({ value, onChange, accessibilityLabel = 'Código de invitación', autoFocus }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const [foco, setFoco] = useState(false);

  const pegar = async () => {
    const texto = await Clipboard.getStringAsync().catch(() => '');
    if (texto) onChange(formatearCodigo(texto));
  };

  return (
    <View style={[s.halo, foco && s.haloFoco]}>
      <View style={[s.caja, foco && s.cajaFoco]}>
        <TextInput
          value={value}
          onChangeText={(t) => onChange(formatearCodigo(t))}
          placeholder="XXXXX-XXXXX"
          placeholderTextColor={colors.ink4}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          spellCheck={false}
          maxLength={11}
          autoFocus={autoFocus}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          accessibilityLabel={accessibilityLabel}
          style={s.input}
        />
        <Pressable onPress={pegar} accessibilityRole="button" accessibilityLabel="Pegar el código" style={({ pressed }) => [s.pegar, pressed && { backgroundColor: colors.surface3 }]}>
          <Text style={s.pegarTexto}>Pegar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  halo:     { marginTop: 21, margin: -3, padding: 3, borderRadius: 13 },
  haloFoco: { backgroundColor: c.accentSoft },
  caja:     { height: 64, borderRadius: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 8, gap: 8 },
  cajaFoco: { borderColor: c.accent },
  input:    { flex: 1, minWidth: 0, height: '100%', fontFamily: fonts.monoMedium, fontSize: 22, letterSpacing: 2.6, color: c.ink, paddingVertical: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null) },
  pegar:    { height: 36, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface2, justifyContent: 'center' },
  pegarTexto: { fontFamily: fonts.uiSemiBold, fontSize: 13, color: c.ink },
});
