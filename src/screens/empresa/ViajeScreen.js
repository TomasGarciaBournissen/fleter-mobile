import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { useSocket } from '../../context/SocketContext';
import { fonts } from '../../theme';
import {
  obtenerViaje, cancelarViaje, reasignarViaje, asignarRechazadoA, finalizarViaje, obtenerRemito, vivoDeEjemplo,
} from '../../services/viajesEmpresa';
import { listarConductores } from '../../services/empresa';
import { EN_CURSO, FINALES, motivoFinalEmpresa } from '../../utils/estados';
import { cuandoLargo, hora, km, duracionHoras } from '../../utils/fechas';
import { pesos } from '../../utils/dinero';
import { formatearPatente } from '../../utils/formularios';
import { mensajeDeError } from '../../utils/errores';
import { finVentanaInicio, inicioVentana } from '../../utils/ventana';
import useEnVivo from '../../hooks/useEnVivo';
import { Pantalla, Boton, Nota, Campo, HojaInferior, Avatar, Seccion } from '../../components/ui';
import ChipEstado from '../../components/viaje/ChipEstado';
import MapaRecorrido from '../../components/viaje/MapaRecorrido';
import DatosViaje, { textoCondiciones, distanciaDe, tiempoDe } from '../../components/viaje/DatosViaje';
import HojaConductor from '../../components/empresa/HojaConductor';
import { tituloParada, paradaActual, MIN_TARDE, MIN_DEMORA } from '../../components/empresa/TablaParadas';
import { nombreConductor } from '../../components/empresa/TarjetaViajeEmpresa';

const EVENTOS = ['viaje:editado', 'viaje:confirmado', 'viaje:rechazado', 'viaje:iniciado', 'viaje:estado_cambiado', 'viaje:finalizado', 'viaje:cancelado', 'viaje:vencido', 'viaje:cierre_habilitado', 'parada:salida_detectada'];
const minutosEntre = (a, b) => Math.round((new Date(a) - new Date(b)) / 60000);

// Detalle de un viaje para la empresa. Cambia según el estado:
// en curso → en vivo (mapa, llegada estimada, desvíos), con cancelar y, si el
// conductor no cerró, finalizar · programado → editar, reasignar y cancelar ·
// rechazado → asignarlo a otro conductor · terminado → estimado vs. real,
// puntualidad por parada y remito.
export default function ViajeScreen({ navigation, route }) {
  const { id } = route.params;
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { idOrg, recargar: recargarEmpresa, resolverRechazo } = useEmpresa();
  const { socket } = useSocket() ?? {};
  const [v, setV] = useState(null);
  const [error, setError] = useState('');
  const [hoja, setHoja] = useState(null); // 'cancelar' | 'conductor'
  const [motivo, setMotivo] = useState('');
  const [accion, setAccion] = useState(null);
  const [conductores, setConductores] = useState(null);
  const [vivo, setVivo] = useState({ posicion: null, minutos: null, desvio: null, ruta: null });

  const cargar = useCallback(async () => {
    try {
      const viaje = await obtenerViaje(idOrg, id);
      setV(viaje);
      const ej = vivoDeEjemplo(viaje);
      if (ej) setVivo((x) => ({ ...x, posicion: x.posicion ?? ej.posicion, minutos: x.minutos ?? ej.minutos, desvio: x.desvio ?? ej.desvio ?? null }));
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos cargar el viaje.'));
    }
  }, [idOrg, id]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  useEnVivo(EVENTOS, cargar, { filtro: (d) => Number(d?.id_viaje) === Number(id) });

  // Seguimiento en vivo: solo llega por socket a la sala de la empresa
  useEffect(() => {
    if (!socket) return undefined;
    const esEste = (d) => Number(d?.id_viaje) === Number(id);
    const h = {
      'mapa:actualizar': (d) => esEste(d) && setVivo((x) => ({ ...x, posicion: { latitude: Number(d.lat), longitude: Number(d.lng) } })),
      'eta:actualizar': (d) => esEste(d) && setVivo((x) => ({ ...x, minutos: d.minutos_restantes })),
      'alerta:desvio': (d) => esEste(d) && setVivo((x) => ({ ...x, desvio: { fecha: new Date().toISOString(), metros: d.distancia_metros } })),
      'ruta:recalculada': (d) => esEste(d) && setVivo((x) => ({ ...x, ruta: d.nueva_ruta ?? x.ruta })),
    };
    Object.entries(h).forEach(([e, f]) => socket.on(e, f));
    return () => Object.entries(h).forEach(([e, f]) => socket.off(e, f));
  }, [socket, id]);

  const hacer = async (nombre, fn, { cerrar = true } = {}) => {
    setError('');
    setAccion(nombre);
    try {
      await fn();
      if (cerrar) setHoja(null);
      await Promise.all([cargar(), recargarEmpresa()]);
    } catch (e) {
      setHoja(null);
      setError(mensajeDeError(e));
    } finally {
      setAccion(null);
    }
  };

  const abrirConductores = () => {
    setHoja('conductor');
    if (!conductores) listarConductores(idOrg).then(setConductores).catch((e) => setError(mensajeDeError(e)));
  };

  const elegirConductor = async (c) => {
    if (v.estado === 'RECHAZADO') {
      setAccion('asignar');
      try {
        const nuevo = await asignarRechazadoA(idOrg, v, c.id_conductor);
        resolverRechazo(v.id_viaje);
        setHoja(null);
        await recargarEmpresa();
        navigation.replace('Viaje', { id: nuevo.id_viaje });
      } catch (e) {
        setHoja(null);
        setError(mensajeDeError(e, 'No pudimos asignarlo. Probá de nuevo.'));
      } finally {
        setAccion(null);
      }
      return;
    }
    hacer('asignar', () => reasignarViaje(idOrg, v.id_viaje, c.id_conductor));
  };

  const verRemito = () => hacer('remito', async () => {
    const { remito_url: url } = v.remito_url ? { remito_url: v.remito_url } : await obtenerRemito(idOrg, v.id_viaje);
    if (url) await Linking.openURL(url);
  }, { cerrar: false });

  if (!v) {
    return (
      <Pantalla onVolver={() => navigation.goBack()}>
        {error ? <Nota tipo="error">{error}</Nota> : <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}
      </Pantalla>
    );
  }

  const enCurso = EN_CURSO.includes(v.estado);
  const programado = ['ASIGNADO', 'CONFIRMADO'].includes(v.estado);
  const final = FINALES.includes(v.estado);
  const nombre = v.conductor?.nombre ?? 'El conductor';
  const actual = paradaActual(v);
  const llegada = vivo.minutos != null ? new Date(Date.now() + vivo.minutos * 60000) : null;

  const pie = enCurso ? (
    <>
      {v.cierre?.cierre_manual_habilitado ? <Boton titulo="Finalizar el viaje" cargando={accion === 'finalizar'} onPress={() => hacer('finalizar', () => finalizarViaje(idOrg, v.id_viaje))} /> : null}
      <Boton titulo="Cancelar el viaje" variante="fantasma" onPress={() => setHoja('cancelar')} />
    </>
  ) : programado ? (
    <>
      <View style={s.dosBotones}>
        <View style={{ flex: 1 }}><Boton titulo="Editar" variante="borde" onPress={() => navigation.navigate('NuevoViaje', { editar: v })} /></View>
        <View style={{ flex: 1 }}><Boton titulo="Reasignar" variante="borde" onPress={abrirConductores} /></View>
      </View>
      <Boton titulo="Cancelar el viaje" variante="fantasma" onPress={() => setHoja('cancelar')} />
    </>
  ) : v.estado === 'RECHAZADO' && new Date(v.fecha_programada) > new Date() ? (
    <>
      <Boton titulo="Asignar a otro conductor" onPress={abrirConductores} />
      <Boton titulo="Cargarlo de nuevo cambiando datos" variante="fantasma" onPress={() => navigation.navigate('NuevoViaje', { copiar: v })} />
    </>
  ) : v.estado === 'FINALIZADO' ? (
    <Boton titulo="Ver remito" variante="borde" cargando={accion === 'remito'} onPress={verRemito}
      icono={<MaterialCommunityIcons name="file-document-outline" size={20} color={colors.ink} />} />
  ) : final ? (
    <Boton titulo="Cargarlo de nuevo" variante="borde" onPress={() => navigation.navigate('NuevoViaje', { copiar: v })} />
  ) : null;

  return (
    <Pantalla onVolver={() => navigation.goBack()} derecha={<Text style={s.id}>VJ-{v.id_viaje}</Text>} pie={pie} pieConLinea={!!pie}>
      {enCurso ? (
        <>
          <View>
            <MapaRecorrido paradas={v.paradas} rutaPlaneada={vivo.ruta ?? v.ruta_planeada} posicion={vivo.posicion} alto={240} />
            <View style={s.chipMapa}><ChipEstado estado={v.estado} /></View>
          </View>
          {vivo.desvio ? (
            <Nota tipo="aviso">{nombre} se desvió de la ruta a las {hora(vivo.desvio.fecha)}{vivo.desvio.metros ? ` (${Math.round(vivo.desvio.metros)} m)` : ''}. El sistema la recalculó.</Nota>
          ) : null}
          {v.cierre?.cierre_manual_habilitado ? (
            <Nota tipo="aviso">{nombre} llegó a la última parada y no tocó «Salir». Ya lo podés finalizar vos{v.cierre.cierre_automatico_en ? `; si no, se cierra solo a las ${hora(v.cierre.cierre_automatico_en)}` : ''}.</Nota>
          ) : null}
          <Text style={s.llega}>
            {v.estado === 'EN_RUTA' && actual
              ? `Llega a ${tituloParada(actual)[0]}${llegada ? ` a las ${hora(llegada)}` : ''}`
              : actual ? `Está en ${tituloParada(actual)[0]}` : 'En curso'}
          </Text>
        </>
      ) : (
        <>
          <ChipEstado estado={v.estado} />
          <Text style={s.cuando}>{cuandoLargo(v.fecha_programada)}</Text>
        </>
      )}

      <Conductor v={v} />

      {v.estado === 'RECHAZADO' ? (
        <Nota tipo="error">{nombreConductor(v.conductor)} lo rechazó{v.fecha_rechazo ? ` a las ${hora(v.fecha_rechazo)}` : ''}. {new Date(v.fecha_programada) > new Date() ? 'Asignáselo a otro conductor.' : 'Ya pasó la hora del viaje.'}</Nota>
      ) : null}
      {(v.estado === 'VENCIDO' || v.estado === 'CANCELADO') ? (
        <Nota tipo="error">{motivoFinalEmpresa(v)}{v.motivo_cancelacion ? ` Motivo: ${v.motivo_cancelacion}` : ''}</Nota>
      ) : null}
      {v.estado === 'ASIGNADO' ? (
        <Nota tipo="aviso">{nombre} todavía no lo confirmó. Tiene hasta las {hora(finVentanaInicio(v))}; si no, vence.</Nota>
      ) : null}
      {v.estado === 'CONFIRMADO' ? (
        <Nota>Lo puede iniciar de {hora(inicioVentana(v))} a {hora(finVentanaInicio(v))}, estando en el origen.</Nota>
      ) : null}

      {v.estado === 'FINALIZADO' ? <EstimadoVsReal v={v} /> : null}
      {!enCurso && !final ? <MapaRecorrido paradas={v.paradas} rutaPlaneada={v.ruta_planeada} style={{ marginTop: 16 }} /> : null}

      <Seccion titulo="Recorrido">
        <RecorridoEmpresa v={v} llegada={llegada} />
      </Seccion>

      {v.estado !== 'FINALIZADO' ? (
        <DatosViaje items={[
          { label: 'Condiciones', valor: textoCondiciones(v.condiciones_requeridas) },
          { label: 'Distancia', valor: km(distanciaDe(v)) },
          { label: 'Tiempo', valor: tiempoDe(v) },
          { label: 'Precio estimado', valor: pesos(v.precio_estimado) },
        ]} />
      ) : null}
      {v.descripcion ? <Nota>Nota para el conductor: {v.descripcion}</Nota> : null}
      {error ? <Nota tipo="error">{error}</Nota> : null}

      <HojaInferior
        visible={hoja === 'cancelar'}
        titulo={`¿Cancelar VJ-${v.id_viaje}?`}
        bajada={enCurso
          ? `${nombre} está en camino con la carga. Si lo cancelás, el viaje se corta donde está: queda guardado lo hecho hasta ahora y recibe el aviso al instante.`
          : `${nombre} recibe el aviso al instante. No se puede deshacer.`}
        onCerrar={() => setHoja(null)}
      >
        <Campo label="Motivo" opcional value={motivo} onChangeText={setMotivo} placeholder="Lo ve el conductor" style={{ marginTop: 0 }} />
        <View style={{ marginTop: 8, gap: 10 }}>
          <Boton titulo={enCurso ? 'Cancelar el viaje en curso' : 'Cancelar el viaje'} variante="peligro" cargando={accion === 'cancelar'}
            onPress={() => hacer('cancelar', () => cancelarViaje(idOrg, v.id_viaje, motivo))} />
          <Boton titulo="Volver" variante="fantasma" onPress={() => setHoja(null)} />
        </View>
      </HojaInferior>

      <HojaConductor
        visible={hoja === 'conductor'}
        titulo={v.estado === 'RECHAZADO' ? '¿A quién se lo asignás?' : `Reasignar VJ-${v.id_viaje}`}
        bajada={v.estado === 'RECHAZADO'
          ? 'Se crea un viaje nuevo con el mismo recorrido y horario. El conductor lo tiene que confirmar.'
          : `${nombre} deja de tenerlo y el nuevo lo tiene que confirmar.`}
        conductores={conductores}
        condiciones={v.condiciones_requeridas}
        excluir={v.conductor?.id_conductor}
        cargando={accion === 'asignar'}
        onElegir={elegirConductor}
        onInvitar={() => { setHoja(null); navigation.navigate('Invitar', { tipo: 'CHOFER' }); }}
        onCerrar={() => setHoja(null)}
      />
    </Pantalla>
  );
}

// Conductor y vehículo, con llamar (usa el teléfono que da el backend)
function Conductor({ v }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const tel = v.conductor?.telefono;
  const veh = v.vehiculo;
  return (
    <View style={s.conductor}>
      <Avatar nombre={nombreConductor(v.conductor)} />
      <View style={{ flex: 1 }}>
        <Text style={s.nombre}>{nombreConductor(v.conductor)}</Text>
        <Text style={s.meta}>
          {veh ? <>{veh.marca} {veh.modelo} <Text style={s.patente}>{formatearPatente(veh.patente)}</Text></> : v.estado === 'ASIGNADO' ? 'Elige el vehículo al confirmar' : 'Sin vehículo'}
        </Text>
      </View>
      {tel ? (
        <Pressable onPress={() => Linking.openURL(`tel:${tel}`)} accessibilityRole="button" accessibilityLabel={`Llamar a ${v.conductor.nombre}`}
          style={({ pressed }) => [s.iconoBoton, pressed && { backgroundColor: colors.surface3 }]}>
          <MaterialCommunityIcons name="phone-outline" size={18} color={colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );
}

// Estimado vs. real con precio (la empresa sí lo ve) y cómo se cerró
function EstimadoVsReal({ v }) {
  const s = useThemedStyles(createStyles);
  const e = v.estimado ?? {};
  const r = v.real ?? {};
  const filas = [
    ['Manejo', duracionHoras(e.manejo_horas), duracionHoras(r.manejo_horas)],
    ['Carga y descarga', duracionHoras(e.peon_horas), r.peon_completo === false ? `${duracionHoras(r.peon_horas)}*` : duracionHoras(r.peon_horas)],
    ['Distancia', km(e.distancia_km), km(r.distancia_km)],
    ['Precio', pesos(v.precio_estimado), pesos(v.precio_real)],
  ];
  const cierre = v.cierre?.cerrado_por;
  return (
    <>
      <View style={s.tabla}>
        <View style={s.tablaFila}><Text style={[s.tablaCab, { flex: 1 }]} /><Text style={[s.tablaCab, s.tablaCol]}>Estimado</Text><Text style={[s.tablaCab, s.tablaCol]}>Real</Text></View>
        {filas.map(([label, est, real], i) => (
          <View key={label} style={[s.tablaFila, s.tablaBorde]}>
            <Text style={[s.tablaLabel, i === 3 && s.negrita]}>{label}</Text>
            <Text style={[s.tablaValor, s.tablaCol]}>{est}</Text>
            <Text style={[s.tablaValor, s.tablaCol, i === 3 && s.negrita]}>{real}</Text>
          </View>
        ))}
      </View>
      {r.peon_completo === false ? <Nota>* Falta la última descarga: el conductor no tocó «Salir» y no se midió.</Nota> : null}
      {cierre === 'ORGANIZACION' ? <Nota>Lo finalizaron desde la empresa.</Nota> : null}
      {cierre === 'AUTOMATICO' ? <Nota tipo={v.cierre?.incompleto ? 'aviso' : 'neutra'}>Se cerró solo a fin del día{v.cierre?.incompleto ? ', con paradas sin visitar' : ''}.</Nota> : null}
    </>
  );
}

// Recorrido con lo que pasó en cada parada: horas reales, puntualidad y salida tarde
function RecorridoEmpresa({ v, llegada }) {
  const s = useThemedStyles(createStyles);
  const ps = v.paradas ?? [];
  const actual = paradaActual(v);
  const enCurso = EN_CURSO.includes(v.estado);
  return (
    <View>
      {ps.map((p, i) => {
        const ultima = i === ps.length - 1;
        const [titulo, localidad] = tituloParada(p);
        const hecha = !!p.salida_real;
        const aqui = enCurso && actual?.id_parada === p.id_parada;
        const tardeSalida = p.salida_real && p.salida_estimada ? minutosEntre(p.salida_real, p.salida_estimada) : 0;
        let sub = localidad;
        let aviso = false;
        if (p.no_visitada) { sub = 'No la visitó'; aviso = true; }
        else if (i === 0 && hecha && tardeSalida >= MIN_TARDE) { sub = `Salió ${hora(p.salida_real)}, ${tardeSalida} min tarde`; aviso = true; }
        else if (p.llegada_real && p.diferencia_min != null) {
          if (p.diferencia_min >= MIN_DEMORA) { sub = `${p.diferencia_min} min tarde`; aviso = p.diferencia_min >= MIN_TARDE; } else sub = 'A tiempo';
        }
        if (aqui && p.llegada_real && !p.salida_real) sub = `Está acá desde las ${hora(p.llegada_real)}`;
        const horaTexto = p.salida_real ? `${hora(p.llegada_real)}–${hora(p.salida_real)}`
          : p.llegada_real ? hora(p.llegada_real)
          : aqui && llegada ? `~${hora(llegada)}`
          : p.llegada_estimada ? (i === 0 ? hora(p.llegada_estimada) : `~${hora(p.llegada_estimada)}`) : '';
        return (
          <View key={p.id_parada ?? i} style={[s.ruta, !ultima && { paddingBottom: 12 }]}>
            {!ultima ? <View style={[s.rutaLinea, hecha && s.rutaLineaHecha]} /> : null}
            <View style={[s.rutaMarca, i === 0 ? s.origen : ultima ? s.destino : null, hecha && s.hecha]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.rutaTitulo, aqui && s.rutaAqui]}>{titulo}</Text>
              {sub ? <Text style={[s.meta, aviso && s.aviso]}>{sub}</Text> : null}
            </View>
            {horaTexto ? <Text style={s.rutaHora}>{horaTexto}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  id:            { fontFamily: fonts.mono, fontSize: 12, color: c.ink3, marginRight: -10 },
  cuando:        { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, color: c.ink, marginTop: 8 },
  chipMapa:      { position: 'absolute', left: 10, top: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 999, padding: 3 },
  llega:         { fontFamily: fonts.display, fontSize: 20, lineHeight: 25, letterSpacing: -0.4, color: c.ink, marginTop: 14 },
  conductor:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line },
  nombre:        { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  meta:          { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 1 },
  aviso:         { color: c.warningInk, fontFamily: fonts.uiSemiBold },
  patente:       { fontFamily: fonts.monoMedium, letterSpacing: 1.1 },
  iconoBoton:    { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
  dosBotones:    { flexDirection: 'row', gap: 10 },
  tabla:         { marginTop: 14, borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface },
  tablaFila:     { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingVertical: 10, paddingHorizontal: 14 },
  tablaBorde:    { borderTopWidth: 1, borderTopColor: c.line },
  tablaCab:      { fontFamily: fonts.uiSemiBold, fontSize: 11.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.ink3 },
  tablaCol:      { width: 84, textAlign: 'right' },
  tablaLabel:    { flex: 1, fontFamily: fonts.ui, fontSize: 13, color: c.ink },
  tablaValor:    { fontFamily: fonts.mono, fontSize: 13, color: c.ink },
  negrita:       { fontFamily: fonts.uiBold },
  ruta:          { flexDirection: 'row', gap: 10 },
  rutaLinea:     { position: 'absolute', left: 6, top: 14, bottom: 0, width: 1.5, backgroundColor: c.lineStrong },
  rutaLineaHecha:{ backgroundColor: c.success },
  rutaMarca:     { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginHorizontal: 2, backgroundColor: c.ink3 },
  origen:        { backgroundColor: c.accent },
  destino:       { backgroundColor: c.ink, borderRadius: 2 },
  hecha:         { backgroundColor: c.success },
  rutaTitulo:    { fontFamily: fonts.uiBold, fontSize: 13, color: c.ink },
  rutaAqui:      { color: c.accentInk },
  rutaHora:      { fontFamily: fonts.mono, fontSize: 12, color: c.ink3 },
});
