import React, { useCallback, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { obtenerSerie, cancelarSerie } from '../../services/viajesEmpresa';
import { textoFrecuencia, desdeIso } from '../../utils/series';
import { diaCorto } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Seccion, Nota, Boton, Pastilla, HojaInferior } from '../../components/ui';
import Recorrido from '../../components/viaje/Recorrido';
import DatosViaje, { textoCondiciones } from '../../components/viaje/DatosViaje';
import TarjetaViajeEmpresa, { nombreConductor } from '../../components/empresa/TarjetaViajeEmpresa';
import { ESTADO_SERIE, porHacer } from './SeriesScreen';

// Detalle de un viaje repetido: la regla, el recorrido y todos los viajes que
// generó, con su estado actual (cada uno se edita, reasigna o cancela por
// separado). Cancelar la serie no toca los viajes ya creados.
export default function SerieScreen({ navigation, route }) {
  const { id, creada } = route.params;
  const { colors } = useTheme();
  const { idOrg, recargar } = useEmpresa();
  const [serie, setSerie] = useState(null);
  const [hoja, setHoja] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(() => obtenerSerie(idOrg, id).then(setSerie).catch((e) => setError(mensajeDeError(e, 'No pudimos cargar el viaje repetido.'))), [idOrg, id]);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const cancelar = async () => {
    setCargando(true);
    try {
      await cancelarSerie(idOrg, id);
      setHoja(false);
      await Promise.all([cargar(), recargar()]);
    } catch (e) {
      setHoja(false);
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  };

  if (!serie) {
    return (
      <Pantalla onVolver={() => navigation.goBack()}>
        {error ? <Nota tipo="error">{error}</Nota> : <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}
      </Pantalla>
    );
  }

  const [label, tipo] = ESTADO_SERIE[serie.estado] ?? [serie.estado, 'neutra'];
  // Las paradas de la serie vienen con lat/lng: se adaptan a la forma de las del viaje
  const paradas = (serie.paradas ?? []).map((p, i) => ({ id_parada: i, direccion: p.lugar?.nombre ? `${p.lugar.nombre}, ${p.direccion}` : p.direccion }));
  const viajes = [...(serie.viajes ?? [])].sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));
  const pie = serie.estado === 'ACTIVA' ? <Boton titulo="Cancelar el viaje repetido" variante="fantasma" onPress={() => setHoja(true)} /> : null;

  return (
    <Pantalla onVolver={() => navigation.goBack()} pie={pie} pieConLinea={!!pie}>
      <Pastilla texto={label} tipo={tipo} />
      <Titulo style={{ marginTop: 10 }}>{textoFrecuencia(serie)}</Titulo>
      {creada ? (
        <Nota tipo="ok">
          Listo: se {creada.viajes === 1 ? 'creó 1 viaje' : `crearon ${creada.viajes} viajes`} y {serie.conductor?.nombre} recibió el aviso.
          {creada.salteadas ? ` ${creada.salteadas === 1 ? 'Uno no se creó' : `${creada.salteadas} no se crearon`} porque ya no llegaba${creada.salteadas === 1 ? '' : 'n'} con anticipación.` : ''}
          {creada.ajustadas ? ` ${creada.ajustadas === 1 ? 'Uno pasó' : `${creada.ajustadas} pasaron`} al último día del mes.` : ''}
        </Nota>
      ) : null}

      <Recorrido paradas={paradas} conHoras={false} style={{ marginTop: 16 }} />
      <DatosViaje items={[
        { label: 'Desde', valor: diaCorto(desdeIso(serie.fecha_desde)) },
        { label: 'Hasta', valor: diaCorto(desdeIso(serie.fecha_hasta)) },
        { label: 'Condiciones', valor: textoCondiciones(serie.condiciones_requeridas) },
        { label: 'Conductor', valor: nombreConductor(serie.conductor) },
      ]} />
      {serie.descripcion ? <Nota>Nota para el conductor: {serie.descripcion}</Nota> : null}
      {serie.estado === 'BORRADA' ? <Nota>Se borró al desvincular al conductor; sus viajes por hacer se cancelaron.</Nota> : null}
      {error ? <Nota tipo="error">{error}</Nota> : null}

      <Seccion titulo="Viajes" nota={`${porHacer(serie)} de ${viajes.length} por hacer`}>
        <View style={{ gap: 10 }}>
          {viajes.map((v) => <TarjetaViajeEmpresa key={v.id_viaje} viaje={v} onPress={() => navigation.navigate('Viaje', { id: v.id_viaje })} />)}
        </View>
      </Seccion>

      <HojaInferior visible={hoja} titulo="¿Cancelar el viaje repetido?" onCerrar={() => setHoja(false)}
        bajada="No se crean más viajes con esta regla. Los que ya están cargados siguen igual: si no hacen falta, cancelalos uno por uno.">
        <Boton titulo="Cancelar el viaje repetido" variante="peligro" cargando={cargando} onPress={cancelar} />
        <Boton titulo="Volver" variante="fantasma" onPress={() => setHoja(false)} />
      </HojaInferior>
    </Pantalla>
  );
}
