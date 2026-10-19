import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../MapViewWrapper';

// Mapa del recorrido con los marcadores del DS: origen naranja, paradas gris,
// destino cuadrado tinta y la posición del conductor en azul. Usa la ruta
// planeada del backend si viene; si no, une las paradas en orden.
export default function MapaRecorrido({ paradas = [], rutaPlaneada, posicion, alto = 200, style }) {
  const { colors } = useTheme();
  const ref = useRef(null);
  const puntos = useMemo(
    () => paradas.filter((p) => p.latitud != null).map((p) => ({ latitude: Number(p.latitud), longitude: Number(p.longitud) })),
    [paradas],
  );
  const linea = useMemo(() => {
    const coords = rutaPlaneada?.coordinates ?? rutaPlaneada;
    if (Array.isArray(coords) && coords.length > 1) {
      return coords.map((c) => (Array.isArray(c) ? { latitude: c[1], longitude: c[0] } : { latitude: c.lat ?? c.latitude, longitude: c.lng ?? c.longitude }));
    }
    return puntos;
  }, [rutaPlaneada, puntos]);

  useEffect(() => {
    const todos = posicion ? [...puntos, posicion] : puntos;
    if (todos.length && ref.current?.fitToCoordinates) {
      ref.current.fitToCoordinates(todos, { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: false });
    }
  }, [puntos, posicion]);

  return (
    <View style={[s.caja, { height: alto, borderColor: colors.line, backgroundColor: colors.surface2 }, style]}>
      <MapView ref={ref} style={StyleSheet.absoluteFill} provider={PROVIDER_GOOGLE} showsUserLocation={false} toolbarEnabled={false}>
        {linea.length > 1 ? <Polyline coordinates={linea} strokeColor={colors.accent} strokeWidth={4} /> : null}
        {puntos.map((p, i) => (
          <Marker key={i} coordinate={p} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={[
              s.marca,
              i === 0 ? { backgroundColor: colors.accent, borderRadius: 7 }
                : i === puntos.length - 1 ? { backgroundColor: colors.ink, borderRadius: 2 }
                : { backgroundColor: colors.ink3, borderRadius: 7 },
              { borderColor: colors.surface },
            ]} />
          </Marker>
        ))}
        {posicion ? (
          <Marker coordinate={posicion} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={[s.yo, { backgroundColor: colors.info, borderColor: colors.surface }]} />
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
}

const s = StyleSheet.create({
  caja:  { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  marca: { width: 14, height: 14, borderWidth: 2 },
  yo:    { width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
});
