import React, { useCallback, useState } from 'react';
import { View, Text, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { fonts } from '../../theme';
import { listarViajes } from '../../services/viajesConductor';
import { EN_CURSO, FINALES } from '../../utils/estados';
import { diaCorto } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { partirDireccion } from '../../components/viaje/Recorrido';
import useEnVivo from '../../hooks/useEnVivo';
import { Pantalla, Titulo, Boton, Nota } from '../../components/ui';
import TarjetaViaje from '../../components/viaje/TarjetaViaje';
import ChipEstado from '../../components/viaje/ChipEstado';

const EVENTOS = ['viaje:asignado', 'serie:asignada', 'viaje:editado', 'viaje:desasignado', 'viaje:cancelado', 'viaje:vencido'];
const esHoy = (iso) => new Date(iso).toDateString() === new Date().toDateString();

// Pestaña principal del conductor: lo que espera una acción suya arriba
// (sin confirmar), después el día y los próximos. Un viaje en curso queda fijo
// arriba para volver a él (también al reabrir la app).
export default function ViajesScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { user } = useAuth();
  const [viajes, setViajes] = useState(null);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const todos = await listarViajes();
      setViajes(todos.filter((v) => !FINALES.includes(v.estado)));
      setError('');
    } catch (err) {
      setError(mensajeDeError(err, 'No pudimos cargar tus viajes. Tirá para abajo para reintentar.'));
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  useEnVivo(EVENTOS, cargar);

  const refrescar = async () => { setRefrescando(true); await cargar(); setRefrescando(false); };

  const enCurso = viajes?.find((v) => EN_CURSO.includes(v.estado));
  const porConfirmar = viajes?.filter((v) => v.estado === 'ASIGNADO') ?? [];
  const confirmados = viajes?.filter((v) => v.estado === 'CONFIRMADO') ?? [];
  const hoy = confirmados.filter((v) => esHoy(v.fecha_programada));
  const proximos = confirmados.filter((v) => !esHoy(v.fecha_programada));
  const abrir = (v) => navigation.navigate(EN_CURSO.includes(v.estado) ? 'ViajeActivo' : 'DetalleViaje', { id: v.id_viaje });
  // En ruta: la siguiente a la que no llegó. En una parada: donde llegó y todavía no salió.
  const proxima = enCurso?.estado === 'EN_RUTA'
    ? enCurso.paradas?.find((p) => !p.llegada_real)
    : enCurso?.paradas?.find((p) => p.llegada_real && !p.salida_real);
  const empresas = user?.organizaciones?.map((o) => o.nombre) ?? [];

  return (
    <Pantalla edges={['top']} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.accent} />}>
      {enCurso ? (
        <View style={s.enCurso}>
          <View style={s.fila}><ChipEstado estado={enCurso.estado} /><Text style={s.id}>VJ-{enCurso.id_viaje}</Text></View>
          <Text style={s.enCursoTitulo}>
            {enCurso.estado === 'EN_RUTA' ? 'Próxima: ' : 'Estás en '}{partirDireccion(proxima?.direccion)[0]}
          </Text>
          <Text style={s.meta}>{enCurso.organizacion?.nombre}</Text>
          <View style={{ marginTop: 12 }}><Boton titulo="Volver al viaje" onPress={() => abrir(enCurso)} /></View>
        </View>
      ) : null}

      <Titulo style={{ marginTop: enCurso ? 22 : 12 }}>Viajes</Titulo>
      {error ? <Nota tipo="error">{error}</Nota> : null}

      {viajes === null && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}

      {viajes && !viajes.length ? (
        <View style={s.vacio}>
          <View style={s.cajas}>{[0, 1, 2].map((i) => <View key={i} style={s.caja} />)}</View>
          <Text style={s.vacioTitulo}>Todavía no tenés viajes</Text>
          <Text style={s.vacioTexto}>
            {empresas.length
              ? `Cuando ${empresas.length === 1 ? empresas[0] : 'una de tus empresas'} te asigne uno, te aparece acá para que lo confirmes.`
              : 'Cuando una empresa te sume con su código y te asigne un viaje, te aparece acá.'}
          </Text>
        </View>
      ) : null}

      {porConfirmar.length ? (
        <Seccion titulo="Para confirmar" nota={String(porConfirmar.length)}>
          {porConfirmar.map((v) => <TarjetaViaje key={v.id_viaje} viaje={v} completa onPress={() => abrir(v)} />)}
        </Seccion>
      ) : null}
      {hoy.length ? (
        <Seccion titulo="Hoy" nota={diaCorto(new Date())}>
          {hoy.map((v) => <TarjetaViaje key={v.id_viaje} viaje={v} onPress={() => abrir(v)} />)}
        </Seccion>
      ) : null}
      {proximos.length ? (
        <Seccion titulo="Próximos">
          {proximos.map((v) => <TarjetaViaje key={v.id_viaje} viaje={v} onPress={() => abrir(v)} />)}
        </Seccion>
      ) : null}
    </Pantalla>
  );
}

function Seccion({ titulo, nota, children }) {
  const s = useThemedStyles(createStyles);
  return (
    <View>
      <View style={s.seccion}>
        <Text style={s.seccionTitulo}>{titulo}</Text>
        {nota ? <Text style={s.meta}>{nota}</Text> : null}
      </View>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  fila:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id:            { fontFamily: fonts.mono, fontSize: 12, color: c.ink3 },
  meta:          { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 2 },
  enCurso:       { marginTop: 6, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: c.accent, backgroundColor: c.surface },
  enCursoTitulo: { fontFamily: fonts.uiBold, fontSize: 15, color: c.ink, marginTop: 10 },
  seccion:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 22, marginBottom: 10 },
  seccionTitulo: { fontFamily: fonts.display, fontSize: 14, color: c.ink },
  vacio:         { marginTop: 56 },
  cajas:         { flexDirection: 'row', gap: 4, marginBottom: 18 },
  caja:          { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.lineStrong },
  vacioTitulo:   { fontFamily: fonts.display, fontSize: 17, color: c.ink },
  vacioTexto:    { fontFamily: fonts.ui, fontSize: 14, lineHeight: 21, color: c.ink2, marginTop: 6, maxWidth: 300 },
});
