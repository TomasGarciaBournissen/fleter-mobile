import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';

// Versión web de MapViewWrapper: react-native-maps no existe en web y su
// sola importación rompe el bundle. Misma API, con un placeholder en vez del mapa.
export const PROVIDER_GOOGLE = undefined;
export function Marker() { return null; }
export function Polyline() { return null; }

export const MapView = React.forwardRef(function MapView({ style }, _ref) {
  const { colors } = useTheme();
  return (
    <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 }]}>
      <Ionicons name="map-outline" size={28} color={colors.textHint} />
      <Text style={{ fontSize: fontSize.caption, color: colors.textHint, marginTop: spacing.xs }}>
        Mapa disponible en build nativa
      </Text>
    </View>
  );
});

export default MapView;
