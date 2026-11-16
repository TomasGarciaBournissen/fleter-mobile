import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator, Keyboard, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { buscarDirecciones, resolverDireccion, BUSQUEDA_DISPONIBLE } from '../../services/direcciones';
import { Campo, Etiqueta, Lista, Fila, Nota, Boton } from '../ui';

// Elegir una dirección: búsqueda con Places y, si se pasan, los lugares
// guardados de la empresa. Devuelve { direccion, lat, lng, id_lugar?, nombre? }
// con onElegir.
//
// Es una pantalla completa y no una hoja de abajo: en iPhone el teclado tapaba
// la hoja. El campo va arriba de todo (el teclado no lo alcanza), se cierra solo
// con la X (tocar afuera no existe) y elegir no cierra al instante: la dirección
// elegida aparece debajo del campo con «Usar esta dirección» para confirmar.
export default function HojaParada({ visible, titulo = 'Agregar parada', lugares = [], onElegir, onCerrar }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [elegida, setElegida] = useState(null); // { direccion, lat, lng, id_lugar?, nombre? }
  const espera = useRef(null);

  useEffect(() => {
    if (!visible) { setTexto(''); setSugerencias([]); setError(''); setElegida(null); }
  }, [visible]);

  const escribir = (t) => {
    setTexto(t);
    setError('');
    setElegida(null);
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

  // Marca la sugerencia (con sus coordenadas) para confirmarla; baja el teclado
  // para que se vea el botón
  const marcar = async (sug) => {
    Keyboard.dismiss();
    setBuscando(true);
    setError('');
    try {
      setElegida(await resolverDireccion(sug));
    } catch {
      setError('No pudimos ubicar esa dirección. Elegí otra sugerencia.');
    } finally {
      setBuscando(false);
    }
  };

  const marcarLugar = (l) => {
    Keyboard.dismiss();
    setError('');
    setElegida({ direccion: l.direccion, lat: Number(l.lat), lng: Number(l.lng), id_lugar: l.id_lugar, nombre: l.nombre });
  };

  const [tituloElegida, subElegida] = elegida
    ? (elegida.nombre ? [elegida.nombre, elegida.direccion] : [elegida.direccion.split(',')[0], elegida.direccion.split(',').slice(1).join(',').trim()])
    : [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCerrar}>
      <View style={[s.pantalla, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
        <View style={s.cabeza}>
          <Text style={s.titulo} accessibilityRole="header">{titulo}</Text>
          <Pressable onPress={onCerrar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar"
            style={({ pressed }) => [s.cerrar, pressed && { backgroundColor: colors.surface3 }]}>
            <MaterialCommunityIcons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>

        {BUSQUEDA_DISPONIBLE ? (
          <Campo
            icono="map-marker-outline"
            placeholder="Calle y altura, localidad"
            value={texto}
            onChangeText={escribir}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => { if (sugerencias[0]) marcar(sugerencias[0]); }}
            accessibilityLabel="Buscar dirección"
            style={{ marginTop: 14 }}
          />
        ) : <Nota tipo="aviso">La búsqueda de direcciones no está configurada en esta versión.</Nota>}

        {elegida ? (
          <View style={s.elegida}>
            <MaterialCommunityIcons name={elegida.id_lugar ? 'star' : 'map-marker'} size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={s.elegidaTitulo}>{tituloElegida}</Text>
              {subElegida ? <Text style={s.elegidaSub}>{subElegida}</Text> : null}
            </View>
          </View>
        ) : null}
        {elegida ? <View style={{ marginTop: 10 }}><Boton titulo="Usar esta dirección" onPress={() => onElegir(elegida)} /></View> : null}

        {/* Con el teclado abierto, «handled» deja marcar una sugerencia al primer toque */}
        <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {buscando ? <ActivityIndicator color={colors.accent} /> : null}
          {error ? <Nota tipo="error">{error}</Nota> : null}
          {sugerencias.length ? (
            <Lista>
              {sugerencias.slice(0, 5).map((sug) => (
                <Fila key={sug.id} titulo={sug.titulo} sub={sug.detalle} onPress={() => marcar(sug)} />
              ))}
            </Lista>
          ) : null}

          {lugares.length ? (
            <>
              <Etiqueta style={{ marginTop: 6, marginBottom: 0 }}>Lugares guardados</Etiqueta>
              <View style={s.chips}>
                {lugares.map((l) => {
                  const activo = elegida?.id_lugar === l.id_lugar;
                  return (
                    <Pressable
                      key={l.id_lugar}
                      onPress={() => marcarLugar(l)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activo }}
                      accessibilityLabel={`${l.nombre}, ${l.direccion}`}
                      style={({ pressed }) => [s.chip, activo && s.chipActivo, pressed && { backgroundColor: colors.surface3 }]}
                    >
                      <MaterialCommunityIcons name={activo ? 'star' : 'star-outline'} size={14} color={activo ? colors.accent : colors.ink2} />
                      <Text style={s.chipTexto}>{l.nombre}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (c) => StyleSheet.create({
  pantalla:      { flex: 1, backgroundColor: c.background, paddingHorizontal: 16 },
  cabeza:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  titulo:        { fontFamily: fonts.display, fontSize: 20, color: c.ink, flex: 1 },
  cerrar:        { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  elegida:       { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 14, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.accent, backgroundColor: c.surface },
  elegidaTitulo: { fontFamily: fonts.uiBold, fontSize: 15, color: c.ink },
  elegidaSub:    { fontFamily: fonts.ui, fontSize: 13, color: c.ink3, marginTop: 2 },
  chips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { height: 34, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActivo:    { borderColor: c.accent },
  chipTexto:     { fontFamily: fonts.uiSemiBold, fontSize: 13, color: c.ink2 },
});
