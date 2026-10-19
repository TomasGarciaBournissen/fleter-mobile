import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { obtenerViaje } from '../../services/viajesConductor';
import { duracionHoras, km } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Boton, Nota, Titulo, Bajada, IsotipoAnimado } from '../../components/ui';
import ChipEstado from '../../components/viaje/ChipEstado';

// Cierre del viaje: las cajas del isotipo se estiban en verde (entregado) y
// el estimado contra lo real en tiempos y distancia. Sin precio (el conductor no lo ve).
export default function ViajeTerminadoScreen({ navigation, route }) {
  const { id } = route.params;
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const [v, setV] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerViaje(id).then(setV).catch((err) => setError(mensajeDeError(err, 'No pudimos cargar el resumen.')));
  }, [id]);

  const volver = () => navigation.navigate('Pestanas', { screen: 'Viajes' });

  if (!v) {
    return (
      <Pantalla onVolver={volver}>
        {error ? <Nota tipo="error">{error}</Nota> : <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}
      </Pantalla>
    );
  }

  const e = v.estimado ?? {};
  const r = v.real ?? {};
  const filas = [
    ['Manejo', duracionHoras(e.manejo_horas), duracionHoras(r.manejo_horas)],
    ['Carga y descarga', duracionHoras(e.peon_horas), duracionHoras(r.peon_horas)],
    ['Distancia', km(e.distancia_km), km(r.distancia_km)],
    ['Total', duracionHoras(e.total_horas), duracionHoras(r.total_horas)],
  ];

  return (
    <Pantalla
      onVolver={volver}
      pie={
        <>
          <Boton titulo="Ver mis viajes" onPress={volver} />
          {v.remito_url ? (
            <Boton titulo="Ver remito" variante="borde" onPress={() => Linking.openURL(v.remito_url).catch(() => {})}
              icono={<MaterialCommunityIcons name="file-document-outline" size={18} color={colors.ink} />} />
          ) : null}
        </>
      }
    >
      <View style={{ marginTop: 28, marginBottom: 20 }}>
        <IsotipoAnimado size={64} color={colors.success} />
      </View>
      <ChipEstado estado={v.estado} />
      <Titulo style={{ marginTop: 10 }}>Viaje terminado</Titulo>
      <Bajada>VJ-{v.id_viaje} para {v.organizacion?.nombre}.{v.remito_url ? ' Ya tienen el remito.' : ''}</Bajada>
      <View style={s.tabla}>
        <View style={[s.fila, s.cabecera]}>
          <Text style={[s.celda, s.label]} />
          <Text style={[s.num, s.label]}>Estimado</Text>
          <Text style={[s.num, s.label]}>Real</Text>
        </View>
        {filas.map(([nombre, est, real], i) => (
          <View key={nombre} style={[s.fila, s.borde]}>
            <Text style={[s.celda, i === filas.length - 1 && s.fuerte]}>{nombre}</Text>
            <Text style={s.num}>{est}</Text>
            <Text style={[s.num, i === filas.length - 1 && s.fuerte]}>{real}</Text>
          </View>
        ))}
      </View>
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  tabla:    { marginTop: 18, borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface },
  fila:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  cabecera: { paddingVertical: 8 },
  borde:    { borderTopWidth: 1, borderTopColor: c.line },
  celda:    { flex: 1, fontFamily: fonts.ui, fontSize: 13, color: c.ink },
  num:      { width: 96, textAlign: 'right', fontFamily: fonts.mono, fontSize: 12.5, color: c.ink },
  label:    { fontFamily: fonts.uiSemiBold, fontSize: 11.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.ink3 },
  fuerte:   { fontFamily: fonts.uiBold },
});
