import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StatusBar, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { IsotipoAnimado, Eslogan } from '../../components/ui';

// Splash naranja mientras se resuelve la sesión: las cajas se estiban,
// cae la de seguimiento y aparecen marca y eslogan. Avisa con `onTerminar`.
export default function SplashScreen({ onTerminar }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const texto = useRef(new Animated.Value(0)).current;

  useEffect(() => () => texto.stopAnimation(), [texto]);

  const alTerminarCajas = () => {
    Animated.timing(texto, { toValue: 1, duration: 360, useNativeDriver: true }).start(() => {
      setTimeout(() => onTerminar?.(), 250);
    });
  };

  return (
    <View style={s.fondo}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.accent} />
      <IsotipoAnimado size={120} color={colors.onAccentLarge} trackColor={colors.onAccent} onTerminar={alTerminarCajas} />
      <Animated.View style={{ alignItems: 'center', opacity: texto, transform: [{ translateY: texto.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
        <Text style={s.wordmark}>Fleter</Text>
        <Eslogan color={colors.onAccent} style={{ marginTop: 14 }} />
      </Animated.View>
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  fondo:    { flex: 1, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontFamily: fonts.display, fontSize: 44, letterSpacing: -1.3, color: c.onAccent, marginTop: 18 },
});
