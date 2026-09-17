import React from 'react';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

// Isotipo "Carga": seis cajas estibadas forman la F.
// La caja de seguimiento (la carga que se sigue) va en la punta del brazo
// largo, arriba a la derecha. Sobre fondos oscuros esa caja se vuelve clara;
// el naranja no cambia. Retícula 3×3, módulo 10, calle 2, radio 2.
export default function Isotipo({ size = 30, color, trackColor }) {
  const { colors } = useTheme();
  const caja = color ?? colors.accent;
  const seguimiento = trackColor ?? colors.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 34 34">
      <Rect x="0"  y="0"  width="10" height="10" rx="2" fill={caja} />
      <Rect x="12" y="0"  width="10" height="10" rx="2" fill={caja} />
      <Rect x="24" y="0"  width="10" height="10" rx="2" fill={seguimiento} />
      <Rect x="0"  y="12" width="10" height="10" rx="2" fill={caja} />
      <Rect x="12" y="12" width="10" height="10" rx="2" fill={caja} />
      <Rect x="0"  y="24" width="10" height="10" rx="2" fill={caja} />
    </Svg>
  );
}
