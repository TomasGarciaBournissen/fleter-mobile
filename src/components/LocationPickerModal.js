import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, SafeAreaView, StatusBar, TextInput,
  FlatList, ActivityIndicator,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../theme';

const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

async function autocomplete(input) {
  const params = new URLSearchParams({
    input,
    components: 'country:ar',
    language: 'es',
    key: PLACES_KEY,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
  );
  const json = await res.json();
  console.log('[Places] respuesta:', JSON.stringify(json));
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(json.error_message ?? json.status);
  }
  return json.predictions ?? [];
}

async function fetchDetails(placeId) {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'geometry,formatted_address,name',
    key: PLACES_KEY,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`
  );
  return res.json();
}

export default function LocationPickerModal({ visible, titulo, onSelect, onClose }) {
  const [query,       setQuery]       = useState('');
  const [resultados,  setResultados]  = useState([]);
  const [cargando,    setCargando]    = useState(false);
  const [error,       setError]       = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!visible) { setQuery(''); setResultados([]); setError(''); }
  }, [visible]);

  const handleChange = (text) => {
    setQuery(text);
    setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) { setResultados([]); return; }

    debounceRef.current = setTimeout(async () => {
      if (!PLACES_KEY) { setError('EXPO_PUBLIC_GOOGLE_PLACES_KEY no configurada'); return; }
      setCargando(true);
      try {
        const sugerencias = await autocomplete(text);
        setResultados(sugerencias);
      } catch (e) {
        setError('Error al buscar: ' + (e.message ?? ''));
      } finally {
        setCargando(false);
      }
    }, 350);
  };

  const handleSelect = async (sugerencia) => {
    const placeId = sugerencia.place_id;
    if (!placeId) return;
    setCargando(true);
    try {
      const details = await fetchDetails(placeId);
      const result = details.result;
      onSelect({
        direccion: result?.formatted_address ?? sugerencia.description ?? '',
        lat: result?.geometry?.location?.lat ?? 0,
        lng: result?.geometry?.location?.lng ?? 0,
      });
    } catch (e) {
      setError('No se pudo obtener la dirección');
    } finally {
      setCargando(false);
    }
  };

  const renderItem = ({ item }) => {
    const main = item.structured_formatting?.main_text ?? item.description ?? '';
    const sec  = item.structured_formatting?.secondary_text ?? '';
    return (
      <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.7}>
        <Text style={styles.rowMain} numberOfLines={1}>{main}</Text>
        {sec ? <Text style={styles.rowSub} numberOfLines={1}>{sec}</Text> : null}
      </TouchableOpacity>
    );
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

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Buscar dirección..."
            placeholderTextColor={colors.textHint}
            value={query}
            onChangeText={handleChange}
            autoFocus
            clearButtonMode="while-editing"
          />
          {cargando && <ActivityIndicator style={styles.spinner} color={colors.primary} />}
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={resultados}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          ListEmptyComponent={
            !cargando && query.length >= 3
              ? <Text style={styles.vacio}>Sin resultados</Text>
              : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },

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
  titulo:     { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: spacing.md,
    backgroundColor: colors.surface1,
    borderWidth: 1, borderColor: colors.surface3,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1, height: 48,
    fontSize: fontSize.body, color: colors.textPrimary,
  },
  spinner: { marginLeft: spacing.xs },

  row: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface1,
  },
  rowMain: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  rowSub:  { fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  separador: { height: 1, backgroundColor: colors.surface3 },

  vacio: {
    textAlign: 'center', marginTop: spacing.xl,
    fontSize: fontSize.body, color: colors.textHint,
  },

  errorBanner: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    backgroundColor: `${colors.error}18`, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.error,
    padding: spacing.sm,
  },
  errorText: { fontSize: fontSize.caption, color: colors.error, fontWeight: '600' },
});
