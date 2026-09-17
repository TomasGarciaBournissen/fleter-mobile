import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';

let _MapView = null;
let _Marker = null;
let _Polyline = null;
let _PROVIDER_GOOGLE = null;

try {
  const RNMaps = require('react-native-maps');
  _MapView = RNMaps.default;
  _Marker = RNMaps.Marker;
  _Polyline = RNMaps.Polyline;
  _PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
} catch {}

export const PROVIDER_GOOGLE = _PROVIDER_GOOGLE;

export function Marker(props) {
  if (!_Marker) return null;
  return <_Marker {...props} />;
}

export function Polyline(props) {
  if (!_Polyline) return null;
  return <_Polyline {...props} />;
}

export const MapView = React.forwardRef(function MapView({ style, children, ...props }, ref) {
  const { colors } = useTheme();
  if (!_MapView) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 }]}>
        <Ionicons name="map-outline" size={28} color={colors.textHint} />
        <Text style={{ fontSize: fontSize.caption, color: colors.textHint, marginTop: spacing.xs }}>
          Mapa disponible en build nativa
        </Text>
      </View>
    );
  }
  return <_MapView ref={ref} style={style} {...props}>{children}</_MapView>;
});

export default MapView;
