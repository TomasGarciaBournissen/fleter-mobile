import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../theme';

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
  if (!_MapView) {
    return (
      <View style={[style, styles.placeholder]}>
        <Ionicons name="map-outline" size={28} color={colors.textHint} />
        <Text style={styles.placeholderText}>Mapa disponible en build nativa</Text>
      </View>
    );
  }
  return <_MapView ref={ref} style={style} {...props}>{children}</_MapView>;
});

export default MapView;

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  placeholderText: {
    fontSize: fontSize.caption,
    color: colors.textHint,
    marginTop: spacing.xs,
  },
});
