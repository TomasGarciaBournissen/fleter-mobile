import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import HojaInferior from './HojaInferior';

// Hora en franjas de 15 min, con grilla propia (UXUI.md: nada de pickers
// nativos). `valor` y lo que devuelve onElegir son 'HH:MM'. `desde` apaga las
// franjas anteriores (por ejemplo, las que ya pasaron hoy).
const FRANJAS = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`);

export default function HojaHora({ visible, valor, desde, titulo = '¿A qué hora?', onElegir, onCerrar }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const ref = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const i = FRANJAS.indexOf(valor ?? '08:00');
    const fila = Math.floor(Math.max(0, i) / 4);
    setTimeout(() => ref.current?.scrollTo({ y: Math.max(0, fila - 1) * 52, animated: false }), 0);
  }, [visible, valor]);

  return (
    <HojaInferior visible={visible} titulo={titulo} onCerrar={onCerrar}>
      <ScrollView ref={ref} style={{ maxHeight: 320 }}>
        <View style={s.grilla}>
          {FRANJAS.map((f) => {
            const sel = f === valor;
            const apagada = desde && f < desde;
            return (
              <Pressable
                key={f}
                disabled={apagada}
                onPress={() => onElegir(f)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel, disabled: apagada }}
                style={({ pressed }) => [s.franja, sel && s.franjaSel, pressed && !sel && { backgroundColor: colors.surface3 }]}
              >
                <Text style={[s.texto, sel && s.textoSel, apagada && { color: colors.ink4 }]}>{f}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </HojaInferior>
  );
}

const createStyles = (c) => StyleSheet.create({
  grilla:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  franja:    { width: '23%', height: 44, borderRadius: 8, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
  franjaSel: { backgroundColor: c.ink, borderColor: c.ink },
  texto:     { fontFamily: fonts.mono, fontSize: 14, color: c.ink },
  textoSel:  { color: c.onInk },
});
