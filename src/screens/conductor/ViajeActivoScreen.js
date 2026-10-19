import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Linking, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import {
  obtenerViaje, iniciarViaje, salirDeParada, confirmarLlegada, cancelarViaje,
} from '../../services/viajesConductor';
import { EN_CURSO, FINALES, motivoFinal } from '../../utils/estados';
import { hora, transcurrido } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { inicioVentana, finVentanaInicio } from '../../utils/ventana';
import useEnVivo from '../../hooks/useEnVivo';
import useGpsViaje from '../../hooks/useGpsViaje';
import { Pantalla, Boton, Nota, HojaInferior, Titulo } from '../../components/ui';
import ChipEstado from '../../components/viaje/ChipEstado';
import Recorrido, { partirDireccion } from '../../components/viaje/Recorrido';
import MapaRecorrido from '../../components/viaje/MapaRecorrido';

const EVENTOS = ['viaje:editado', 'viaje:desasignado', 'viaje:cancelado', 'viaje:vencido'];

// Abre Google Maps / Apple Maps con la dirección (el mobile no calcula rutas)
function comoLlegar(p) {
  const destino = p.latitud != null ? `${p.latitud},${p.longitud}` : encodeURIComponent(p.direccion);
  const url = Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${destino}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destino}`;
  Linking.openURL(url).catch(() => {});
}

// El viaje parada por parada. Una sola acción principal, grande y abajo.
//   CONFIRMADO   → ir al origen e «Iniciar viaje» (= llegar a la parada 1)
//   CARGANDO / DESCARGANDO → en una parada: «Salir de la parada» (en la última, termina)
//   EN_RUTA      → manejando a la siguiente: «Llegué a la parada»
// La ubicación se comparte con la empresa solo mientras el viaje está en curso.
export default function ViajeActivoScreen({ navigation, route }) {
  const { id } = route.params;
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const [v, setV] = useState(null);
  const [error, setError] = useState('');
  const [accion, setAccion] = useState(false);
  const [hojaCancelar, setHojaCancelar] = useState(false);
  const [, setTic] = useState(0);

  const enCurso = !!v && EN_CURSO.includes(v.estado);
  const gps = useGpsViaje(id, { compartir: enCurso });

  const cargar = useCallback(async () => {
    try {
      const viaje = await obtenerViaje(id);
      if (viaje.estado === 'FINALIZADO') { navigation.replace('ViajeTerminado', { id }); return; }
      setV(viaje);
    } catch (err) {
      setError(mensajeDeError(err, 'No pudimos cargar el viaje.'));
    }
  }, [id, navigation]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  useEnVivo(EVENTOS, cargar, { filtro: (d) => Number(d?.id_viaje) === Number(id) });

  // Reloj del tiempo en la parada
  useEffect(() => {
    if (!v || !['CARGANDO', 'DESCARGANDO'].includes(v.estado)) return undefined;
    const t = setInterval(() => setTic((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [v]);

  // Cada acción: pide al backend, muestra su error tal cual si falla y recarga
  const ejecutar = async (fn) => {
    setError('');
    setAccion(true);
    try {
      const r = await fn();
      if (r?.viaje_finalizado || r?.estado === 'FINALIZADO') { navigation.replace('ViajeTerminado', { id }); return; }
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err));
      if (err?.response?.status === 409) cargar();
    } finally {
      setAccion(false);
    }
  };

  if (!v) {
    return (
      <Pantalla onVolver={() => navigation.goBack()}>
        {error ? <Nota tipo="error">{error}</Nota> : <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}
      </Pantalla>
    );
  }

  const paradas = v.paradas ?? [];
  const total = paradas.length;
  const enParada = paradas.find((p) => p.llegada_real && !p.salida_real);
  const siguiente = paradas.find((p) => !p.llegada_real);
  const esUltima = enParada && paradas.indexOf(enParada) === total - 1;
  const volver = () => navigation.navigate('Pestanas', { screen: 'Viajes' });
  const id_ = <Text style={s.id}>VJ-{v.id_viaje}</Text>;
  const compartiendo = gps.compartiendo ? (
    <View style={s.gps}><View style={s.gpsPunto} /><Text style={s.gpsTexto}>Compartiendo ubicación</Text></View>
  ) : <View />;

  // ─── Terminó sin hacerse (lo cancelaron o venció mientras estaba abierta) ───
  if (FINALES.includes(v.estado)) {
    return (
      <Pantalla onVolver={volver} derecha={id_} pie={<Boton titulo="Volver a mis viajes" onPress={volver} />}>
        <ChipEstado estado={v.estado} />
        <Titulo style={{ marginTop: 10 }}>Este viaje ya no está activo</Titulo>
        <Nota tipo="error">{motivoFinal(v)}</Nota>
      </Pantalla>
    );
  }

  // ─── Permiso de ubicación: se explica antes del pedido del sistema ───
  if (gps.permiso && gps.permiso !== 'granted') {
    return (
      <Pantalla
        onVolver={() => navigation.goBack()}
        pie={
          <>
            <Boton titulo="Permitir ubicación" onPress={gps.pedirPermiso} />
            <Text style={s.metaCentro}>Fuera de un viaje, Fleter no usa tu ubicación.</Text>
          </>
        }
      >
        <View style={s.permisoIcono}><MaterialCommunityIcons name="crosshairs-gps" size={28} color={colors.ink2} /></View>
        <Titulo>Fleter necesita tu ubicación durante el viaje</Titulo>
        {[
          ['Para iniciar y confirmar paradas', 'La app verifica que estés en cada dirección.'],
          ['Para que la empresa siga el viaje', 'Ve tu posición solo mientras el viaje está en curso.'],
          ['Con la pantalla apagada', 'Elegí «Permitir siempre» para que no se corte en el bolsillo.'],
        ].map(([t, d], i) => (
          <View key={t} style={s.punto}>
            <View style={s.puntoNum}><Text style={s.puntoNumTexto}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}><Text style={s.puntoTitulo}>{t}</Text><Text style={s.puntoTexto}>{d}</Text></View>
          </View>
        ))}
        {gps.permiso === 'denied' ? <Nota tipo="aviso">Rechazaste el permiso. Activalo en Ajustes → Fleter → Ubicación.</Nota> : null}
      </Pantalla>
    );
  }

  // ─── Confirmado: ir al origen e iniciar ───
  if (v.estado === 'CONFIRMADO') {
    const origen = paradas[0];
    return (
      <Pantalla
        onVolver={() => navigation.goBack()}
        derecha={id_}
        pieConLinea
        pie={
          <>
            <Boton titulo="Iniciar viaje" cargando={accion} onPress={() => ejecutar(async () => iniciarViaje(id, await gps.posicionActual()))} />
            <Boton titulo="Cancelar viaje" variante="fantasma" onPress={() => setHojaCancelar(true)} />
          </>
        }
      >
        <MapaRecorrido paradas={[origen]} posicion={gps.posicion} />
        <Text style={[s.eyebrow, { color: colors.infoInk }]}>
          Confirmado{v.vehiculo ? ` con la ${v.vehiculo.modelo}` : ''}
        </Text>
        <Text style={s.titulo}>Andá al origen para iniciar</Text>
        <Text style={s.bajada}>{origen?.direccion}. Iniciá cuando estés en la puerta.</Text>
        <View style={s.relojes}>
          <Reloj label="Programado" valor={hora(v.fecha_programada)} />
          <Reloj label="Podés iniciar" valor={`${hora(inicioVentana(v))}–${hora(finVentanaInicio(v))}`} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Boton titulo="Cómo llegar" variante="borde" onPress={() => comoLlegar(origen)}
            icono={<MaterialCommunityIcons name="navigation-variant-outline" size={18} color={colors.ink} />} />
        </View>
        {error ? <Nota tipo="error">{error}</Nota> : null}

        <HojaInferior
          visible={hojaCancelar}
          titulo={`¿Cancelar VJ-${v.id_viaje}?`}
          bajada={`${v.organizacion?.nombre ?? 'La empresa'} va a ver que no lo hacés. Solo se puede cancelar antes de iniciarlo.`}
          onCerrar={() => setHojaCancelar(false)}
        >
          <Boton titulo="Cancelar el viaje" variante="peligro" cargando={accion}
            onPress={async () => { setHojaCancelar(false); await ejecutar(() => cancelarViaje(id)); }} />
          <Boton titulo="Volver" variante="fantasma" onPress={() => setHojaCancelar(false)} />
        </HojaInferior>
      </Pantalla>
    );
  }

  // ─── En una parada (cargando o descargando) ───
  if (enParada) {
    const [titulo] = partirDireccion(enParada.direccion);
    return (
      <Pantalla
        derecha={id_}
        onVolver={volver}
        pieConLinea
        pie={<Boton titulo={esUltima ? 'Salir y terminar el viaje' : 'Salir de la parada'} cargando={accion} onPress={() => ejecutar(() => salirDeParada(id))} />}
      >
        {compartiendo}
        <View style={s.fila}>
          <ChipEstado estado={v.estado} />
          {esUltima ? <Text style={s.metaFuerte}>Última parada</Text> : null}
        </View>
        <Text style={s.titulo}>Estás en {titulo}</Text>
        <Text style={s.bajada}>
          {esUltima
            ? 'Cuando termines de descargar, salí para terminar el viaje y generar el remito.'
            : v.estado === 'CARGANDO' ? 'Cuando termines de cargar, tocá «Salir de la parada».' : 'Cuando termines, tocá «Salir de la parada».'}
        </Text>
        <View style={s.relojes}>
          <Reloj label="Llegaste" valor={hora(enParada.llegada_real)} />
          <Reloj label="En la parada" valor={transcurrido(enParada.llegada_real)} />
        </View>
        <Text style={s.seccion}>Recorrido</Text>
        <Recorrido paradas={paradas} idActual={enParada.id_parada} />
        {error ? <Nota tipo="error">{error}</Nota> : null}
      </Pantalla>
    );
  }

  // ─── En ruta a la siguiente parada ───
  const n = paradas.indexOf(siguiente) + 1;
  return (
    <Pantalla
      derecha={id_}
      onVolver={volver}
      pieConLinea
      pie={
        <>
          <Boton titulo="Cómo llegar" variante="borde" onPress={() => comoLlegar(siguiente)}
            icono={<MaterialCommunityIcons name="navigation-variant-outline" size={18} color={colors.ink} />} />
          <Boton titulo="Llegué a la parada" cargando={accion}
            onPress={() => ejecutar(async () => confirmarLlegada(id, siguiente.id_parada, await gps.posicionActual()))} />
        </>
      }
    >
      {compartiendo}
      <MapaRecorrido paradas={paradas} rutaPlaneada={v.ruta_planeada} posicion={gps.posicion} alto={280} style={{ marginTop: 8 }} />
      <View style={[s.fila, { marginTop: 14 }]}>
        <ChipEstado estado={v.estado} />
        <Text style={s.metaFuerte}>Próxima parada, {n} de {total}</Text>
      </View>
      <Text style={s.titulo}>{siguiente?.direccion}</Text>
      {siguiente?.llegada_estimada ? <Text style={s.bajada}>Llegada estimada {hora(siguiente.llegada_estimada)}.</Text> : null}
      {error ? <Nota tipo="error">{error}</Nota> : null}
    </Pantalla>
  );
}

function Reloj({ label, valor }) {
  const s = useThemedStyles(createStyles);
  return (
    <View style={s.reloj}>
      <Text style={s.relojLabel}>{label}</Text>
      <Text style={s.relojValor}>{valor}</Text>
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  id:            { fontFamily: fonts.mono, fontSize: 12, color: c.ink3, marginRight: -10 },
  fila:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  gps:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  gpsPunto:      { width: 8, height: 8, borderRadius: 4, backgroundColor: c.success },
  gpsTexto:      { fontFamily: fonts.uiSemiBold, fontSize: 12, color: c.successInk },
  eyebrow:       { fontFamily: fonts.uiBold, fontSize: 12, marginTop: 14 },
  titulo:        { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, letterSpacing: -0.4, color: c.ink, marginTop: 8 },
  bajada:        { fontFamily: fonts.ui, fontSize: 14, lineHeight: 20, color: c.ink2, marginTop: 4 },
  metaFuerte:    { fontFamily: fonts.uiSemiBold, fontSize: 12, color: c.ink3 },
  metaCentro:    { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, textAlign: 'center' },
  relojes:       { flexDirection: 'row', gap: 10, marginTop: 14 },
  reloj:         { flex: 1, borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface, paddingVertical: 10, paddingHorizontal: 12 },
  relojLabel:    { fontFamily: fonts.uiSemiBold, fontSize: 11.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.ink3 },
  relojValor:    { fontFamily: fonts.monoMedium, fontSize: 18, color: c.ink, marginTop: 2 },
  seccion:       { fontFamily: fonts.display, fontSize: 14, color: c.ink, marginTop: 22, marginBottom: 10 },
  permisoIcono:  { width: 56, height: 56, borderRadius: 14, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 22 },
  punto:         { flexDirection: 'row', gap: 12, marginTop: 16 },
  puntoNum:      { width: 24, height: 24, borderRadius: 6, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
  puntoNumTexto: { fontFamily: fonts.mono, fontSize: 12, color: c.ink2 },
  puntoTitulo:   { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  puntoTexto:    { fontFamily: fonts.ui, fontSize: 14, lineHeight: 20, color: c.ink2 },
});
