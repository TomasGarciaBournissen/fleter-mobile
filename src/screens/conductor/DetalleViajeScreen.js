import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { obtenerViaje, misVehiculos, confirmarViaje, rechazarViaje } from '../../services/viajesConductor';
import { TIPOS_VEHICULO } from '../../services/vehiculos';
import { EN_CURSO, FINALES, motivoFinal } from '../../utils/estados';
import { cuandoLargo, hora } from '../../utils/fechas';
import { formatearPatente } from '../../utils/formularios';
import { mensajeDeError } from '../../utils/errores';
import { inicioVentana, finVentanaInicio } from '../../utils/ventana';
import useEnVivo from '../../hooks/useEnVivo';
import { Pantalla, Boton, Nota, HojaInferior } from '../../components/ui';
import ChipEstado from '../../components/viaje/ChipEstado';
import Recorrido from '../../components/viaje/Recorrido';
import DatosViaje, { datosBasicos } from '../../components/viaje/DatosViaje';
import MapaRecorrido from '../../components/viaje/MapaRecorrido';

const EVENTOS = ['viaje:editado', 'viaje:desasignado', 'viaje:cancelado', 'viaje:vencido'];

export const iniciales = (nombre = '') => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
const resumenVehiculo = (veh) => {
  const tipo = TIPOS_VEHICULO.find((t) => t.id === veh.tipo_vehiculo)?.titulo ?? veh.tipo_vehiculo;
  return `${tipo}${veh.color ? `, ${veh.color.toLowerCase()}` : ''}.`;
};

// Detalle de un viaje del conductor. Desde «Sin confirmar» se confirma
// eligiendo vehículo o se rechaza (la única acción con confirmación: es final).
export default function DetalleViajeScreen({ navigation, route }) {
  const { id } = route.params;
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const [v, setV] = useState(null);
  const [error, setError] = useState('');
  const [vehiculos, setVehiculos] = useState(null);
  const [elegido, setElegido] = useState(null);
  const [hoja, setHoja] = useState(null); // 'vehiculo' | 'rechazo'
  const [accion, setAccion] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const viaje = await obtenerViaje(id);
      if (EN_CURSO.includes(viaje.estado)) { navigation.replace('ViajeActivo', { id }); return; }
      setV(viaje);
    } catch (err) {
      setError(mensajeDeError(err, 'No pudimos cargar el viaje.'));
    }
  }, [id, navigation]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  useEnVivo(EVENTOS, cargar, { filtro: (d) => Number(d?.id_viaje) === Number(id) });

  // Confirmar: sirve cualquier vehículo propio (los viajes de PyME no tienen
  // condiciones). Con uno solo, sin hoja.
  const empezarConfirmacion = async () => {
    setError('');
    setAccion('confirmar');
    try {
      const lista = await misVehiculos();
      if (!lista.length) { setError('No tenés vehículos cargados. Agregá uno desde tu perfil para confirmar viajes.'); return; }
      if (lista.length === 1) { await confirmar(lista[0]); return; }
      setVehiculos(lista);
      setElegido(lista[0]);
      setHoja('vehiculo');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setAccion(null);
    }
  };

  const confirmar = async (veh) => {
    setAccion('confirmar');
    try {
      await confirmarViaje(id, veh.id_vehiculo);
      setHoja(null);
      await cargar();
    } catch (err) {
      setHoja(null);
      setError(mensajeDeError(err));
    } finally {
      setAccion(null);
    }
  };

  const rechazar = async () => {
    setAccion('rechazar');
    try {
      await rechazarViaje(id);
      setHoja(null);
      navigation.goBack();
    } catch (err) {
      setHoja(null);
      setError(mensajeDeError(err));
      setAccion(null);
    }
  };

  if (!v) {
    return (
      <Pantalla onVolver={() => navigation.goBack()}>
        {error ? <Nota tipo="error">{error}</Nota> : <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}
      </Pantalla>
    );
  }

  const final = FINALES.includes(v.estado);
  const autor = v.creador ? `Te lo asignó ${v.creador.nombre} ${v.creador.apellido ?? ''}`.trim() : '';
  const pie = v.estado === 'ASIGNADO' ? (
    <>
      <Boton titulo="Confirmar viaje" onPress={empezarConfirmacion} cargando={accion === 'confirmar' && !hoja} />
      <Boton titulo="Rechazar" variante="fantasma" onPress={() => setHoja('rechazo')} />
    </>
  ) : v.estado === 'CONFIRMADO' ? (
    <Boton titulo="Ir al viaje" onPress={() => navigation.navigate('ViajeActivo', { id })} />
  ) : null;

  return (
    <Pantalla onVolver={() => navigation.goBack()} derecha={<Text style={s.id}>VJ-{v.id_viaje}</Text>} pieConLinea={!!pie} pie={pie}>
      <ChipEstado estado={v.estado} />
      <Text style={s.cuando}>{cuandoLargo(v.fecha_programada)}</Text>
      <View style={s.empresa}>
        <View style={s.avatar}><Text style={s.avatarTexto}>{iniciales(v.organizacion?.nombre)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.empresaNombre}>{v.organizacion?.nombre}</Text>
          {autor ? <Text style={s.meta}>{autor}</Text> : null}
        </View>
      </View>

      <MapaRecorrido paradas={v.paradas} rutaPlaneada={v.ruta_planeada} style={{ marginTop: 16 }} />
      <Recorrido paradas={v.paradas} style={{ marginTop: 16 }} />
      <DatosViaje items={[
        ...datosBasicos(v),
        { label: 'Vehículo', valor: v.vehiculo ? `${v.vehiculo.marca} ${v.vehiculo.modelo}` : (v.estado === 'ASIGNADO' ? 'Lo elegís al confirmar' : '') },
      ]} />
      {v.descripcion ? <Nota>Indicaciones: {v.descripcion}</Nota> : null}

      {v.estado === 'ASIGNADO' || v.estado === 'CONFIRMADO' ? (
        <Nota>
          Lo podés iniciar de {hora(inicioVentana(v))} a {hora(finVentanaInicio(v))}, estando en el origen.
          {v.estado === 'ASIGNADO' ? ' Si no lo confirmás antes, vence.' : ''}
        </Nota>
      ) : null}
      {final && motivoFinal(v) ? <Nota tipo="error">{motivoFinal(v)}</Nota> : null}
      {error ? <Nota tipo="error">{error}</Nota> : null}

      <HojaInferior
        visible={hoja === 'vehiculo'}
        titulo="¿Con qué vehículo lo hacés?"
        bajada="Elegí con cuál vas. La empresa lo ve en el viaje y en el remito."
        onCerrar={() => setHoja(null)}
      >
        {vehiculos?.map((veh) => {
          const sel = elegido?.id_vehiculo === veh.id_vehiculo;
          return (
            <Pressable
              key={veh.id_vehiculo}
              onPress={() => setElegido(veh)}
              accessibilityRole="radio"
              accessibilityState={{ checked: sel }}
              style={[s.veh, sel && s.vehSel]}
            >
              <View style={s.vehGlifo}>
                <MaterialCommunityIcons name={TIPOS_VEHICULO.find((t) => t.id === veh.tipo_vehiculo)?.icono ?? 'truck-outline'} size={20} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.vehTitulo}>{veh.marca} {veh.modelo} <Text style={s.patente}>{formatearPatente(veh.patente)}</Text></Text>
                <Text style={s.meta}>{resumenVehiculo(veh)}</Text>
              </View>
              {sel ? <View style={s.tick}><MaterialCommunityIcons name="check" size={14} color={colors.onAccent} /></View> : null}
            </Pressable>
          );
        })}
        <Boton
          titulo={elegido ? `Confirmar con la ${elegido.modelo}` : 'Confirmar'}
          deshabilitado={!elegido}
          cargando={accion === 'confirmar'}
          onPress={() => confirmar(elegido)}
        />
      </HojaInferior>

      <HojaInferior
        visible={hoja === 'rechazo'}
        titulo={`¿Rechazar VJ-${v.id_viaje}?`}
        bajada={`${v.organizacion?.nombre ?? 'La empresa'} va a ver que no lo hacés y lo tiene que asignar a otro conductor. No se puede deshacer.`}
        onCerrar={() => setHoja(null)}
      >
        <Boton titulo="Rechazar el viaje" variante="peligro" cargando={accion === 'rechazar'} onPress={rechazar} />
        <Boton titulo="Volver" variante="fantasma" onPress={() => setHoja(null)} />
      </HojaInferior>
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  id:            { fontFamily: fonts.mono, fontSize: 12, color: c.ink3, marginRight: -10 },
  cuando:        { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, color: c.ink, marginTop: 8 },
  empresa:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  avatar:        { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarTexto:   { fontFamily: fonts.uiBold, fontSize: 13, color: c.ink2 },
  empresaNombre: { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  meta:          { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 1 },
  veh:           { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  vehSel:        { borderWidth: 2, borderColor: c.accent, backgroundColor: c.accentSofter, padding: 11 },
  vehGlifo:      { width: 36, height: 36, borderRadius: 8, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
  vehTitulo:     { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  patente:       { fontFamily: fonts.monoMedium, letterSpacing: 1.1 },
  tick:          { width: 22, height: 22, borderRadius: 11, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
});
