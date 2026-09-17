import React from 'react';
import Svg, { Rect } from 'react-native-svg';
import { colors } from '../theme';

// Isotipo "Carga": seis cajas estibadas forman la F.
// La caja oscura (la carga que se sigue) va en la punta del brazo largo,
// arriba a la derecha. Sobre fondos oscuros esa caja se vuelve clara;
// el naranja no cambia. Retícula 3×3, módulo 10, calle 2, radio 2.
export default function Isotipo({ size = 30, color = colors.primary, trackColor = colors.textPrimary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 34 34">
      <Rect x="0"  y="0"  width="10" height="10" rx="2" fill={color} />
      <Rect x="12" y="0"  width="10" height="10" rx="2" fill={color} />
      <Rect x="24" y="0"  width="10" height="10" rx="2" fill={trackColor} />
      <Rect x="0"  y="12" width="10" height="10" rx="2" fill={color} />
      <Rect x="12" y="12" width="10" height="10" rx="2" fill={color} />
      <Rect x="0"  y="24" width="10" height="10" rx="2" fill={color} />
    </Svg>
  );
}
