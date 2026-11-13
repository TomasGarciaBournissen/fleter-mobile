import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { fonts } from '../../theme';
import { listarConductores, listarLugares } from '../../services/empresa';
import { estimarViaje, crearViaje, crearSerie, editarViaje } from '../../services/viajesEmpresa';
import { FRECUENCIAS, LETRAS_DIAS, DIAS_MAXIMOS_SERIE, diaSemanaIso, fechaIso, textoFrecuencia, contarViajes } from '../../utils/series';
import { diaCorto, cuandoLargo, hora, km, duracionHoras } from '../../utils/fechas';
import { pesos } from '../../utils/dinero';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Bajada, Meta, Etiqueta, Pasos, Boton, Campo, Opcion, Nota, Enlace, HojaCalendario, HojaHora } from '../../components/ui';
import DatosViaje from '../../components/viaje/DatosViaje';
import { partirDireccion } from '../../components/viaje/Recorrido';
import HojaParada from '../../components/empresa/HojaParada';
import { ListaConductores } from '../../components/empresa/HojaConductor';
import { nombreConductor } from '../../components/empresa/TarjetaViajeEmpresa';

const MAX_PARADAS = 10; // MAX_PARADAS_POR_VIAJE del backend
const PASOS = ['recorrido', 'cuándo', 'para qué', 'conductor'];
const MAX_MOTIVO = 120;     // límites del backend (pedido del 20-10-2026)
const MAX_INDICACIONES = 500;

// Anticipación mínima: `ANTICIPACION_MINIMA_MINUTOS` del backend (60 en staging y
// producción). Es solo para no ofrecer horarios que va a rechazar: el que decide
// es el backend, y si cambia el valor su mensaje de error se muestra tal cual.
const ANTICIPACION_MIN = 60;

// Próxima franja de 15 min con margen
function franjaMinima() {
  const d = new Date(Date.now() + (ANTICIPACION_MIN + 15) * 60000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return d;
}
const aHHMM = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const conHora = (fecha, hhmm) => { const [h, m] = hhmm.split(':').map(Number); const d = new Date(fecha); d.setHours(h, m, 0, 0); return d; };
const mismoDia = (a, b) => a.toDateString() === b.toDateString();

// Parada del viaje (forma del backend) → parada del formulario
const desdeViaje = (p) => ({ direccion: p.direccion, lat: Number(p.latitud), lng: Number(p.longitud), id_lugar: p.lugar?.activo ? p.id_lugar : null, nombre: p.lugar?.activo ? p.lugar.nombre : null });

// Nuevo viaje en cuatro pasos cortos (recorrido, cuándo, para qué, conductor) y
// una revisión con el precio que devuelve el backend (`estimar-precio`, v2 con rango): nada se
// calcula en el teléfono. «Se repite» crea una serie de viajes.
// Con `route.params.editar` (un viaje ASIGNADO o CONFIRMADO) edita ese viaje:
// sin repetición ni conductor (eso es «Reasignar», desde el detalle). Con
// `route.params.copiar` arranca con los datos de otro viaje.
export default function NuevoViajeScreen({ navigation, route }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { idOrg, recargar } = useEmpresa();
  const editar = route.params?.editar ?? null;
  // `copiar`: cargar de nuevo un rechazado, vencido o cancelado con sus datos
  const base = editar ?? route.params?.copiar ?? null;

  const original = base ? new Date(base.fecha_programada) : null;
  const inicial = editar ? original : original && original > franjaMinima() ? original : franjaMinima();
  const [paso, setPaso] = useState(1);
  const [paradas, setParadas] = useState(base ? base.paradas.map(desdeViaje) : []);
  const [fecha, setFecha] = useState(inicial);
  const [horaSel, setHoraSel] = useState(aHHMM(inicial));
  const [frecuencia, setFrecuencia] = useState('UNA_VEZ');
  const [dias, setDias] = useState([diaSemanaIso(inicial)]);
  const [hasta, setHasta] = useState(() => { const d = new Date(inicial); d.setDate(d.getDate() + 14); return d; });
  const [motivo, setMotivo] = useState(base?.motivo ?? '');
  const [descripcion, setDescripcion] = useState(base?.descripcion ?? '');
  const [conductor, setConductor] = useState(null);

  const [hoja, setHoja] = useState(null); // { tipo: 'parada', indice } | 'fecha' | 'hora' | 'hasta'
  const [lugares, setLugares] = useState([]);
  const [conductores, setConductores] = useState(null);
  const [estimacion, setEstimacion] = useState(null);
  const [estimando, setEstimando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarLugares(idOrg).then(setLugares).catch(() => {});
    if (!editar) listarConductores(idOrg).then(setConductores).catch((e) => setError(mensajeDeError(e)));
  }, [idOrg, editar]);

  const repite = !editar && frecuencia !== 'UNA_VEZ';
  const fechaProgramada = conHora(fecha, horaSel);
  const regla = { frecuencia, dias_semana: dias, dia_semana: diaSemanaIso(fecha), dia_mes: fecha.getDate(), hora: horaSel };
  const cantidad = repite ? contarViajes({ ...regla, desde: fecha, hasta }) : 1;
  const totalPasos = editar ? 3 : 4;
  const revisando = paso > totalPasos;

  // ── Navegación entre pasos
  const volver = () => { setError(''); if (paso === 1) navigation.goBack(); else setPaso(paso - 1); };
  const seguir = async () => {
    setError('');
    if (paso === 2 && !repite && fechaProgramada < new Date(Date.now() + ANTICIPACION_MIN * 60000)) {
      setError('Elegí un horario con al menos una hora de anticipación.');
      return;
    }
    if (paso === 2 && repite && cantidad === 0) { setError('Con esos días no sale ningún viaje antes de la fecha de fin.'); return; }
    if (paso < totalPasos) { setPaso(paso + 1); return; }
    setPaso(paso + 1);
    setEstimacion(null);
    setEstimando(true);
    try {
      setEstimacion(await estimarViaje(idOrg, { paradas, fecha_programada: fechaProgramada.toISOString() }));
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos calcular el precio. Probá de nuevo en unos segundos.'));
    } finally {
      setEstimando(false);
    }
  };

  const confirmar = async () => {
    setError('');
    setCreando(true);
    try {
      if (editar) {
        await editarViaje(idOrg, editar.id_viaje, { paradas, fecha_programada: fechaProgramada.toISOString(), motivo: motivo.trim(), descripcion: descripcion.trim() });
        await recargar();
        navigation.goBack();
      } else if (repite) {
        const r = await crearSerie(idOrg, {
          id_conductor: conductor.id_conductor, frecuencia,
          ...(frecuencia === 'DIAS_SEMANA' ? { dias_semana: [...dias].sort() } : {}),
          ...(frecuencia === 'SEMANAL' ? { dia_semana: regla.dia_semana } : {}),
          ...(frecuencia === 'MENSUAL' ? { dia_mes: regla.dia_mes } : {}),
          hora: horaSel, fecha_desde: fechaIso(fecha), fecha_hasta: fechaIso(hasta),
          paradas, motivo, descripcion,
        });
        await recargar();
        navigation.replace('Serie', { id: r.serie.id_serie, creada: { viajes: r.viajes.length, salteadas: r.salteadas?.length ?? 0, ajustadas: r.ajustadas?.length ?? 0 } });
      } else {
        const v = await crearViaje(idOrg, { id_conductor: conductor.id_conductor, fecha_programada: fechaProgramada.toISOString(), paradas, motivo, descripcion });
        await recargar();
        navigation.replace('Viaje', { id: v.id_viaje });
      }
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos guardar el viaje. Probá de nuevo.'));
    } finally {
      setCreando(false);
    }
  };

  // ── Paradas
  const elegirParada = (p) => {
    const i = hoja.indice;
    setParadas((prev) => (i < prev.length ? prev.map((x, j) => (j === i ? p : x)) : [...prev, p]));
    setHoja(null);
  };
  const sacarParada = (i) => setParadas((prev) => prev.filter((_, j) => j !== i));

  const puedeSeguir = paso === 1 ? paradas.length >= 2
    : paso === 2 ? (frecuencia !== 'DIAS_SEMANA' || dias.length > 0)
    : paso === 3 ? !!motivo.trim() && !!descripcion.trim()
    : paso === 4 ? !!conductor
    : true;

  const tituloBoton = revisando
    ? editar ? 'Guardar los cambios'
      : repite ? `Asignar ${cantidad} viajes a ${conductor?.nombre}` : `Asignar el viaje a ${conductor?.nombre}`
    : ['Seguir con el horario', 'Seguir con el detalle', editar ? 'Revisar los cambios' : 'Seguir con el conductor', 'Revisar el viaje'][paso - 1];

  const pie = (
    <Boton
      titulo={tituloBoton}
      onPress={revisando ? confirmar : seguir}
      deshabilitado={revisando ? !estimacion : !puedeSeguir}
      cargando={creando}
    />
  );

  return (
    <Pantalla onVolver={volver} pie={pie} pieConLinea>
      {!revisando ? <Pasos actual={paso} total={totalPasos} etiqueta={PASOS[paso - 1]} /> : null}

      {paso === 1 ? (
        <>
          <Titulo>{editar ? `Editar VJ-${editar.id_viaje}` : '¿De dónde a dónde?'}</Titulo>
          <View style={s.paradas}>
            {paradas.map((p, i) => {
              const [titulo, sub] = p.nombre ? [p.nombre, p.direccion] : partirDireccion(p.direccion);
              const tipo = i === 0 ? 'origen' : i === paradas.length - 1 && paradas.length > 1 ? 'destino' : 'parada';
              return (
                <View key={`${p.direccion}-${i}`} style={[s.filaParada, i > 0 && s.borde]}>
                  <Pressable onPress={() => setHoja({ tipo: 'parada', indice: i })} accessibilityRole="button"
                    accessibilityLabel={`${tipo === 'origen' ? 'Origen' : tipo === 'destino' ? 'Destino' : `Parada ${i}`}: ${p.nombre ?? p.direccion}. Tocá para cambiarla`}
                    style={({ pressed }) => [s.parada, { flex: 1, paddingRight: 0 }, pressed && { backgroundColor: colors.surface2 }]}>
                    <View style={[s.marca, tipo === 'origen' ? s.origen : tipo === 'destino' ? s.destino : null]} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={s.tituloFila}>
                        <Text style={s.paradaTitulo}>{titulo}</Text>
                        {p.id_lugar ? <View style={s.tag}><Text style={s.tagTexto}>Guardado</Text></View> : null}
                      </View>
                      {sub ? <Text style={s.sub}>{sub}</Text> : null}
                    </View>
                  </Pressable>
                  <Pressable onPress={() => sacarParada(i)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Sacar ${p.nombre ?? p.direccion}`} style={s.sacar}>
                    <MaterialCommunityIcons name="close" size={18} color={colors.ink3} />
                  </Pressable>
                </View>
              );
            })}
            {paradas.length < MAX_PARADAS ? (
              <Pressable onPress={() => setHoja({ tipo: 'parada', indice: paradas.length })} accessibilityRole="button"
                style={({ pressed }) => [s.parada, paradas.length > 0 && s.borde, pressed && { backgroundColor: colors.surface2 }]}>
                <MaterialCommunityIcons name="plus" size={18} color={colors.accentInk} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.paradaTitulo, { color: colors.accentInk }]}>
                    {paradas.length === 0 ? 'Agregar el origen' : paradas.length === 1 ? 'Agregar el destino' : 'Agregar parada'}
                  </Text>
                  <Text style={s.sub}>{paradas.length === 0 ? 'Donde se carga y arranca el viaje' : `Hasta ${MAX_PARADAS} en total`}</Text>
                </View>
              </Pressable>
            ) : null}
          </View>
          <Meta style={{ marginTop: 8 }}>
            {paradas.length ? 'Tocá una parada para cambiarla. La primera es el origen: ahí el conductor inicia el viaje. La última es el destino.' : 'Podés usar los lugares guardados de la empresa o buscar una dirección.'}
          </Meta>
        </>
      ) : null}

      {paso === 2 ? (
        <>
          <Titulo>¿Cuándo sale?</Titulo>
          <View style={s.dos}>
            <Campo label="Fecha" icono="calendar-blank-outline" mono value={diaCorto(fecha)} onPress={() => setHoja('fecha')} style={{ flex: 1 }} />
            <Campo label="Hora" icono="clock-outline" mono value={horaSel} onPress={() => setHoja('hora')} style={{ flex: 1 }} />
          </View>
          {!editar ? (
            <>
              <Etiqueta style={{ marginTop: 18 }}>¿Se repite?</Etiqueta>
              <View style={{ gap: 8 }}>
                {FRECUENCIAS.map((f) => (
                  <Opcion key={f.id} compacta icono={f.id === 'UNA_VEZ' ? 'numeric-1-box-outline' : 'repeat'} titulo={f.titulo}
                    descripcion={f.id === 'SEMANAL' ? `Los ${textoFrecuencia({ frecuencia: 'SEMANAL', dia_semana: regla.dia_semana }).replace('Todos los ', '')}` : f.id === 'MENSUAL' ? `El ${regla.dia_mes} de cada mes` : undefined}
                    seleccionada={frecuencia === f.id} onPress={() => setFrecuencia(f.id)} />
                ))}
              </View>
              {frecuencia === 'DIAS_SEMANA' ? (
                <View style={s.dias}>
                  {LETRAS_DIAS.map((l, i) => {
                    const n = i + 1;
                    const on = dias.includes(n);
                    return (
                      <Pressable key={n} onPress={() => setDias((d) => (on ? d.filter((x) => x !== n) : [...d, n]))}
                        accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                        accessibilityLabel={['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'][i]}
                        style={[s.dia, on && s.diaOn]}>
                        <Text style={[s.diaTexto, on && { color: colors.onInk }]}>{l}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
              {repite ? (
                <Campo label="Hasta" icono="calendar-blank-outline" mono value={diaCorto(hasta)} onPress={() => setHoja('hasta')}
                  hint={`Como máximo ${DIAS_MAXIMOS_SERIE} días. ${cantidad === 1 ? 'Se crea 1 viaje' : `Se crean ${cantidad} viajes`}, cada uno se maneja por separado.`} />
              ) : null}
            </>
          ) : editar.estado === 'CONFIRMADO' ? (
            <Nota>Si cambiás el recorrido, el horario, el motivo o las indicaciones, {editar.conductor?.nombre ?? 'el conductor'} lo tiene que volver a confirmar.</Nota>
          ) : null}
        </>
      ) : null}

      {paso === 3 ? (
        <>
          <Titulo>¿Para qué es el viaje?</Titulo>
          <Bajada>El conductor ve las dos cosas en el viaje. Las dos son obligatorias.</Bajada>
          <Campo label="Motivo" value={motivo} onChangeText={setMotivo} maxLength={MAX_MOTIVO}
            placeholder="Por ejemplo: reposición de la sucursal Pilar" hint={`Para qué es, en pocas palabras. Hasta ${MAX_MOTIVO} caracteres.`} />
          <Campo label="Indicaciones para el conductor" value={descripcion} onChangeText={setDescripcion} maxLength={MAX_INDICACIONES}
            placeholder="Por ejemplo: portón azul, tocar timbre" hint="Qué tiene que saber para hacerlo: cómo entrar, a quién buscar, qué lleva." multiline />
        </>
      ) : null}

      {paso === 4 && !editar ? (
        <>
          <Titulo>¿Quién lo hace?</Titulo>
          <Bajada>Cualquiera de tus conductores con un vehículo cargado lo puede hacer.</Bajada>
          {conductores === null ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} /> : null}
          {conductores && !conductores.length ? (
            <Nota tipo="aviso">Todavía no tenés conductores. Invitá a uno con un código: cuando lo cargue en su app, aparece acá.</Nota>
          ) : null}
          {conductores?.length ? (
            <View style={{ marginTop: 16 }}>
              <ListaConductores conductores={conductores} elegido={conductor?.id_conductor} onElegir={setConductor} />
            </View>
          ) : null}
          <Meta style={{ marginTop: 12 }}>El conductor elige con qué vehículo lo hace cuando lo confirma.</Meta>
          <Enlace onPress={() => navigation.navigate('Invitar', { tipo: 'CHOFER' })} style={{ marginTop: 14 }}>Invitar a un conductor</Enlace>
        </>
      ) : null}

      {revisando ? (
        <>
          <Titulo>{editar ? 'Revisá los cambios' : 'Revisá el viaje'}</Titulo>
          {estimando ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} /> : null}
          {estimacion ? (
            <View style={s.precio}>
              <Text style={s.precioValor}>{pesos(estimacion.total)}</Text>
              <Text style={s.precioNota}>Precio estimado{repite ? ' por viaje' : ''}, entre {pesos(estimacion.bajo)} y {pesos(estimacion.alto)}. Se confirma al cerrar el viaje.</Text>
              <DatosViaje items={[
                { label: 'Distancia', valor: km(estimacion.estimado?.distancia_km) },
                { label: 'Tiempo', valor: duracionHoras(estimacion.estimado?.total_horas) },
                { label: 'Manejo', valor: duracionHoras(estimacion.estimado?.manejo_horas) },
                { label: 'Carga y descarga', valor: duracionHoras(estimacion.estimado?.peon_horas) },
              ]} />
            </View>
          ) : null}
          <View style={{ marginTop: 16 }}>
            {paradas.map((p, i) => {
              const tramo = estimacion?.tramos?.[i];
              const [titulo, sub] = p.nombre ? [p.nombre, p.direccion] : partirDireccion(p.direccion);
              const ultima = i === paradas.length - 1;
              return (
                <View key={i} style={[s.ruta, !ultima && { paddingBottom: 10 }]}>
                  {!ultima ? <View style={s.rutaLinea} /> : null}
                  <View style={[s.rutaMarca, i === 0 ? s.origen : ultima ? s.destino : null]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.rutaTitulo}>{titulo}</Text>
                    {sub ? <Text style={s.sub}>{sub}</Text> : null}
                  </View>
                  {tramo ? <Text style={s.rutaHora}>{i === 0 ? hora(tramo.llegada_estimada) : `~${hora(tramo.llegada_estimada)}`}</Text> : null}
                </View>
              );
            })}
          </View>
          <DatosViaje items={[
            { label: 'Cuándo', valor: repite ? textoFrecuencia(regla) : cuandoLargo(fechaProgramada) },
            repite ? { label: 'Hasta', valor: `${diaCorto(hasta)} (${cantidad} viajes)` } : { label: 'Paradas', valor: String(paradas.length) },
            { label: 'Motivo', valor: motivo.trim() },
            { label: 'Conductor', valor: editar ? nombreConductor(editar.conductor) : nombreConductor(conductor) },
          ]} />
          <Nota>Indicaciones para el conductor: {descripcion.trim()}</Nota>
          {repite && !error ? <Nota>{conductor?.nombre} recibe un solo aviso con los {cantidad} viajes y los confirma uno por uno. La serie no se renueva sola.</Nota> : null}
          {editar?.estado === 'CONFIRMADO' ? <Nota tipo="aviso">{editar.conductor?.nombre ?? 'El conductor'} lo va a tener que confirmar de nuevo.</Nota> : null}
        </>
      ) : null}

      {error ? <Nota tipo="error">{error}</Nota> : null}

      <HojaParada
        visible={hoja?.tipo === 'parada'}
        titulo={hoja?.indice === 0 ? 'Origen' : hoja?.indice < paradas.length ? 'Cambiar parada' : paradas.length === 1 ? 'Destino' : 'Agregar parada'}
        lugares={lugares}
        onElegir={elegirParada}
        onCerrar={() => setHoja(null)}
      />
      {hoja === 'fecha' ? (
        <HojaCalendario visible valor={fecha} minimo={new Date()} titulo="¿Qué día sale?" onCerrar={() => setHoja(null)}
          onElegir={(d) => {
            setFecha(d);
            setDias((prev) => (prev.length ? prev : [diaSemanaIso(d)]));
            if (hasta < d || (hasta - d) / 86400000 > DIAS_MAXIMOS_SERIE) { const h = new Date(d); h.setDate(h.getDate() + 14); setHasta(h); }
            setHoja(null);
          }} />
      ) : null}
      {hoja === 'hasta' ? (
        <HojaCalendario visible valor={hasta} minimo={fecha} titulo={`Hasta (máximo ${DIAS_MAXIMOS_SERIE} días)`} onCerrar={() => setHoja(null)}
          onElegir={(d) => {
            const max = new Date(fecha); max.setDate(max.getDate() + DIAS_MAXIMOS_SERIE);
            setHasta(d > max ? max : d);
            setHoja(null);
          }} />
      ) : null}
      <HojaHora visible={hoja === 'hora'} valor={horaSel} desde={mismoDia(fecha, new Date()) && !repite ? aHHMM(franjaMinima()) : undefined}
        onElegir={(h) => { setHoraSel(h); setHoja(null); }} onCerrar={() => setHoja(null)} />
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  paradas:      { marginTop: 16, borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface, overflow: 'hidden' },
  parada:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 56 },
  borde:        { borderTopWidth: 1, borderTopColor: c.line },
  marca:        { width: 10, height: 10, borderRadius: 5, backgroundColor: c.ink3, marginHorizontal: 4 },
  origen:       { backgroundColor: c.accent, borderRadius: 5 },
  destino:      { backgroundColor: c.ink, borderRadius: 2 },
  tituloFila:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  paradaTitulo: { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  sub:          { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 1 },
  tag:          { height: 20, paddingHorizontal: 7, borderRadius: 5, backgroundColor: c.surface2, justifyContent: 'center' },
  tagTexto:     { fontFamily: fonts.uiBold, fontSize: 11, color: c.ink2 },
  filaParada:   { flexDirection: 'row', alignItems: 'center' },
  sacar:        { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  dos:          { flexDirection: 'row', gap: 12 },
  dias:         { flexDirection: 'row', gap: 6, marginTop: 10 },
  dia:          { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
  diaOn:        { backgroundColor: c.ink, borderColor: c.ink },
  diaTexto:     { fontFamily: fonts.uiBold, fontSize: 13, color: c.ink2 },
  precio:       { marginTop: 16, borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface, padding: 16 },
  precioValor:  { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: -1, color: c.ink },
  precioNota:   { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 6 },
  ruta:         { flexDirection: 'row', gap: 10 },
  rutaLinea:    { position: 'absolute', left: 6, top: 14, bottom: 0, width: 1.5, backgroundColor: c.lineStrong },
  rutaMarca:    { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginHorizontal: 2, backgroundColor: c.ink3 },
  rutaTitulo:   { fontFamily: fonts.uiBold, fontSize: 13, color: c.ink },
  rutaHora:     { fontFamily: fonts.mono, fontSize: 12, color: c.ink3 },
});
