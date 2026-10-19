import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, AccessibilityInfo } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// El isotipo «Carga» se estiba caja por caja: primero la base de la F y,
// al final, cae la caja de seguimiento arriba a la derecha. Es el único
// momento animado de la entrada (splash y cierre del alta).
// Retícula 3×3 con módulo 10 y calle 2, igual que Isotipo.js.
const CAJAS = [
  { x: 0,  y: 24, orden: 0 },
  { x: 0,  y: 12, orden: 1 },
  { x: 12, y: 12, orden: 2 },
  { x: 0,  y: 0,  orden: 3 },
  { x: 12, y: 0,  orden: 4 },
  { x: 24, y: 0,  orden: 6, seguimiento: true },
];

export default function IsotipoAnimado({ size = 96, color, trackColor, onTerminar }) {
  const { colors } = useTheme();
  const anims = useRef(CAJAS.map(() => new Animated.Value(0))).current;
  const k = size / 34;

  useEffect(() => {
    let cancelado = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (cancelado) return;
      if (reducir) {
        anims.forEach((a) => a.setValue(1));
        onTerminar?.();
        return;
      }
      Animated.stagger(110, CAJAS.map((c, i) => Animated.timing(anims[i], {
        toValue: 1,
        duration: c.seguimiento ? 460 : 380,
        delay: c.seguimiento ? 220 : 0,
        easing: Easing.bezier(0.2, 0.7, 0.2, 1),
        useNativeDriver: true,
      }))).start(() => onTerminar?.());
    }).catch(() => onTerminar?.());
    return () => { cancelado = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel="Fleter">
      {CAJAS.map((c, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: c.x * k, top: c.y * k, width: 10 * k, height: 10 * k, borderRadius: 2 * k,
            backgroundColor: c.seguimiento ? (trackColor ?? colors.ink) : (color ?? colors.accent),
            opacity: anims[i],
            transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 0.7, 1], outputRange: [-8 * k, 0.6 * k, 0] }) }],
          }}
        />
      ))}
    </View>
  );
}
