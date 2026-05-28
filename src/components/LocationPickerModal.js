import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { colors, fontSize, spacing, radius } from '../theme';

const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

export default function LocationPickerModal({ visible, titulo, onSelect, onClose }) {
  const ref = useRef(null);

  const handleSelect = (data, details) => {
    if (!details?.geometry) return;
    onSelect({
      direccion: data.description,
      lat: details.geometry.location.lat,
      lng: details.geometry.location.lng,
    });
    ref.current?.clear();
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cerrarBtn}>
            <Text style={styles.cerrarText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.titulo}>{titulo}</Text>
          <View style={{ width: 40 }} />
        </View>

        <GooglePlacesAutocomplete
          ref={ref}
          placeholder="Buscar dirección..."
          onPress={handleSelect}
          fetchDetails
          query={{
            key: PLACES_KEY,
            language: 'es',
            components: 'country:ar',
          }}
          styles={{
            container: styles.autocompleteContainer,
            textInputContainer: styles.textInputContainer,
            textInput: styles.textInput,
            listView: styles.listView,
            row: styles.row,
            description: styles.description,
            separator: styles.separator,
            poweredContainer: styles.poweredContainer,
          }}
          enablePoweredByContainer={false}
          keepResultsAfterBlur={false}
          autoFocus
          debounce={300}
          minLength={3}
          nearbyPlacesAPI="GooglePlacesSearch"
          filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
          renderRow={(rowData) => (
            <View style={styles.rowContent}>
              <Text style={styles.rowMain} numberOfLines={1}>
                {rowData.structured_formatting?.main_text ?? rowData.description}
              </Text>
              {rowData.structured_formatting?.secondary_text ? (
                <Text style={styles.rowSub} numberOfLines={1}>
                  {rowData.structured_formatting.secondary_text}
                </Text>
              ) : null}
            </View>
          )}
        />

        {!PLACES_KEY && (
          <View style={styles.noBanner}>
            <Text style={styles.noBannerText}>
              ⚠ EXPO_PUBLIC_GOOGLE_PLACES_KEY no configurada en .env
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.surface3,
  },
  cerrarBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  cerrarText: { fontSize: 16, color: colors.textSecondary, fontWeight: '700' },
  titulo: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary },

  autocompleteContainer: { flex: 1 },
  textInputContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  textInput: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: radius.md,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  listView: {
    backgroundColor: colors.surface1,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface3,
    overflow: 'hidden',
  },
  row: {
    backgroundColor: colors.surface1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  description: { display: 'none' },
  separator: { height: 1, backgroundColor: colors.surface3 },
  poweredContainer: { display: 'none' },

  rowContent: { paddingVertical: 2 },
  rowMain: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  rowSub: { fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },

  noBanner: {
    margin: spacing.md,
    backgroundColor: `${colors.warning}22`,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.warning,
    padding: spacing.sm,
  },
  noBannerText: { fontSize: fontSize.caption, color: colors.warning, fontWeight: '600' },
});
