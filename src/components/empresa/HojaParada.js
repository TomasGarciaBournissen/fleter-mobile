import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { buscarDirecciones, resolverDireccion, BUSQUEDA_DISPONIBLE } from '../../services/direcciones';
import { Campo, Etiqueta, HojaInferior, Lista, Fila, Nota, Boton } from '../ui';

// Hoja para elegir una dirección: búsqueda con Places y, si se pasan, los
// lugares guardados de la empresa a un toque. Devuelve
// { direccion, lat, lng, id_lugar?, nombre? } con onElegir.
// La hoja es alta y tocar afuera no la cierra (solo baja el teclado): se sale
// eligiendo una dirección —tocándola o con «Buscar» del teclado, que toma la
// primera sugerencia— o con «Cancelar».
export default function HojaParada({ visible, titulo = 'Agregar parada', lugares = [], onElegir, onCerrar }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const [texto, setTexto] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const espera = useRef(null);

  useEffect(() => {
    if (!visible) { setTexto(''); setSugerencias([]); setError(''); }
  }, [visible]);

  const escribir = (t) => {
    setTexto(t);
    setError('');
    clearTimeout(espera.current);
    if (t.trim().length < 3) { setSugerencias([]); return; }
    espera.current = setTimeout(async () => {
      setBuscando(true);
      try {
        setSugerencias(await buscarDirecciones(t.trim()));
      } catch {
        setError('No pudimos buscar direcciones. Revisá la conexión y probá de nuevo.');
      } finally {
        setBuscando(false);
      }
    }, 350);
  };

  const elegir = async (sug) => {
    setBuscando(true);
    try {
      onElegir(await resolverDireccion(sug));
    } catch {
      setError('No pudimos ubicar esa dirección. Elegí otra sugerencia.');
    } finally {
      setBuscando(false);
    }
  };

  return (
    <HojaInferior visible={visible} titulo={titulo} onCerrar={onCerrar} alta cerrarConFondo={false}>
      {BUSQUEDA_DISPONIBLE ? (
        <Campo
          icono="map-marker-outline"
          placeholder="Calle y altura, localidad"
          value={texto}
          onChangeText={escribir}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => { if (sugerencias[0]) elegir(sugerencias[0]); }}
          accessibilityLabel="Buscar dirección"
          style={{ marginTop: 0 }}
        />
      ) : <Nota tipo="aviso">La búsqueda de direcciones no está configurada en esta versión.</Nota>}
      {/* Con el teclado abierto, «handled» deja elegir una sugerencia al primer toque */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingBottom: 4 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {buscando ? <ActivityIndicator color={colors.accent} /> : null}
        {error ? <Nota tipo="error">{error}</Nota> : null}
        {sugerencias.length ? (
          <Lista>
            {sugerencias.slice(0, 5).map((sug) => (
              <Fila key={sug.id} titulo={sug.titulo} sub={sug.detalle} onPress={() => elegir(sug)} />
            ))}
          </Lista>
        ) : null}

        {lugares.length ? (
          <>
            <Etiqueta style={{ marginTop: 6, marginBottom: 0 }}>Lugares guardados</Etiqueta>
            <View style={s.chips}>
              {lugares.map((l) => (
                <Pressable
                  key={l.id_lugar}
                  onPress={() => onElegir({ direccion: l.direccion, lat: Number(l.lat), lng: Number(l.lng), id_lugar: l.id_lugar, nombre: l.nombre })}
                  accessibilityRole="button"
                  accessibilityLabel={`${l.nombre}, ${l.direccion}`}
                  style={({ pressed }) => [s.chip, pressed && { backgroundColor: colors.surface3 }]}
                >
                  <MaterialCommunityIcons name="star-outline" size={14} color={colors.ink2} />
                  <Text style={s.chipTexto}>{l.nombre}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
      <Boton titulo="Cancelar" variante="fantasma" onPress={onCerrar} />
    </HojaInferior>
  );
}

const createStyles = (c) => StyleSheet.create({
  chips:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:      { height: 34, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipTexto: { fontFamily: fonts.uiSemiBold, fontSize: 13, color: c.ink2 },
});
