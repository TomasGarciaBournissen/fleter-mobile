import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, SafeAreaView, StatusBar, TextInput,
  FlatList, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, radius } from '../theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

let colors;
let styles;

const PLACES_KEY       = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';
const HISTORIAL_KEY    = 'fleter_historial_direcciones';
const HISTORIAL_MAX    = 8;

// Places New API — autocomplete (v1)
async function autocomplete(input) {
  const res = await fetch(
    'https://places.googleapis.com/v1/places:autocomplete',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_KEY,
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ['ar'],
        languageCode: 'es',
      }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return json.suggestions ?? [];
}

// Places New API — place details (v1)
async function fetchDetails(placeId) {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        'X-Goog-Api-Key': PLACES_KEY,
        'X-Goog-FieldMask': 'location,formattedAddress,displayName',
      },
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return json;
}

async function leerHistorial() {
  try {
    const raw = await AsyncStorage.getItem(HISTORIAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function guardarEnHistorial(ubicacion) {
  try {
    const prev = await leerHistorial();
    // Sacar duplicados por dirección exacta y poner la nueva primera
    const filtrado = prev.filter(h => h.direccion !== ubicacion.direccion);
    const nuevo = [ubicacion, ...filtrado].slice(0, HISTORIAL_MAX);
    await AsyncStorage.setItem(HISTORIAL_KEY, JSON.stringify(nuevo));
  } catch {}
}

export default function LocationPickerModal({ visible, titulo, onSelect, onClose }) {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const [query,       setQuery]       = useState('');
  const [resultados,  setResultados]  = useState([]);
  const [historial,   setHistorial]   = useState([]);
  const [cargando,    setCargando]    = useState(false);
  const [error,       setError]       = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (visible) {
      leerHistorial().then(setHistorial);
    } else {
      setQuery('');
      setResultados([]);
      setError('');
    }
  }, [visible]);

  const historialFiltrado = query.length > 0
    ? historial.filter(h => h.direccion.toLowerCase().includes(query.toLowerCase()))
    : historial;

  const handleChange = (text) => {
    setQuery(text);
    setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) { setResultados([]); return; }

    debounceRef.current = setTimeout(async () => {
      if (!PLACES_KEY) { setError('EXPO_PUBLIC_GOOGLE_PLACES_KEY no configurada en .env'); return; }
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

  const seleccionar = async (ubicacion) => {
    await guardarEnHistorial(ubicacion);
    onSelect(ubicacion);
  };

  const handleSelect = async (sugerencia) => {
    const placeId = sugerencia.placePrediction?.placeId;
    if (!placeId) return;
    setCargando(true);
    try {
      const details = await fetchDetails(placeId);
      const ubicacion = {
        direccion: details.formattedAddress ?? sugerencia.placePrediction?.text?.text ?? '',
        lat: details.location?.latitude ?? 0,
        lng: details.location?.longitude ?? 0,
      };
      await seleccionar(ubicacion);
    } catch (e) {
      setError('No se pudo obtener la dirección');
    } finally {
      setCargando(false);
    }
  };

  const renderHistorialItem = ({ item }) => (
    <TouchableOpacity style={styles.row} onPress={() => seleccionar(item)} activeOpacity={0.7}>
      <Ionicons name="time-outline" size={16} color={colors.textHint} style={{ marginRight: spacing.sm }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowMain} numberOfLines={1}>{item.direccion}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const pred = item.placePrediction;
    const main = pred?.structuredFormat?.mainText?.text ?? pred?.text?.text ?? '';
    const sec  = pred?.structuredFormat?.secondaryText?.text ?? '';
    return (
      <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.7}>
        <Ionicons name="location-outline" size={16} color={colors.textHint} style={{ marginRight: spacing.sm }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowMain} numberOfLines={1}>{main}</Text>
          {sec ? <Text style={styles.rowSub} numberOfLines={1}>{sec}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cerrarBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
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

        {/* Historial — se muestra siempre que haya resultados de Places o cuando el query filtra el historial */}
        {historialFiltrado.length > 0 && (
          <>
            <Text style={styles.seccionLabel}>
              {query.length === 0 ? 'Recientes' : 'Del historial'}
            </Text>
            <FlatList
              data={historialFiltrado}
              keyExtractor={(item) => item.direccion}
              renderItem={renderHistorialItem}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separador} />}
              scrollEnabled={false}
            />
            {resultados.length > 0 && <View style={styles.separadorSeccion} />}
          </>
        )}

        {/* Resultados de Places API */}
        {resultados.length > 0 && (
          <>
            {historialFiltrado.length > 0 && (
              <Text style={styles.seccionLabel}>Sugerencias</Text>
            )}
            <FlatList
              data={resultados}
              keyExtractor={(_, i) => String(i)}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separador} />}
            />
          </>
        )}

        {!cargando && query.length >= 3 && resultados.length === 0 && historialFiltrado.length === 0 && (
          <Text style={styles.vacio}>Sin resultados</Text>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
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

  seccionLabel: {
    fontSize: fontSize.caption, fontWeight: '700', color: colors.textHint,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 4,
  },
  separadorSeccion: { height: 8, backgroundColor: colors.surface2 },

  row: {
    flexDirection: 'row', alignItems: 'center',
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
