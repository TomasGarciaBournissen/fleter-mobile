import React, { useCallback, useState } from 'react';
import { View, Text, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { useSocket } from '../../context/SocketContext';
import { fonts } from '../../theme';
import { EN_CURSO } from '../../utils/estados';
import { diaCorto } from '../../utils/fechas';
import { pesos } from '../../utils/dinero';
import { vivoDeEjemplo } from '../../services/viajesEmpresa';
import { Pantalla, Titulo, Meta, Seccion, Vacio, Boton } from '../../components/ui';
import TarjetaViajeEmpresa from '../../components/empresa/TarjetaViajeEmpresa';

const esHoy = (iso) => new Date(iso).toDateString() === new Date().toDateString();
const NO_SUMAN = ['RECHAZADO', 'VENCIDO', 'CANCELADO'];

// Inicio de la empresa: el día de un vistazo. Los viajes en curso con su tabla
// de paradas (estimado y real), y después los que quedan hoy. Las alertas no
// van acá: tienen su pestaña, con contador en la barra.
export default function InicioScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { organizacion, viajes, recargar } = useEmpresa();
  const { socket } = useSocket() ?? {};
  const [refrescando, setRefrescando] = useState(false);
  const [etas, setEtas] = useState({});

  useFocusEffect(useCallback(() => { recargar(); }, [recargar]));

  // Llegada estimada a la próxima parada: la manda el backend cada 30 s
  useFocusEffect(useCallback(() => {
    if (!socket) return undefined;
    const h = (d) => setEtas((prev) => ({ ...prev, [d.id_viaje]: d.minutos_restantes }));
    socket.on('eta:actualizar', h);
    return () => socket.off('eta:actualizar', h);
  }, [socket]));

  const refrescar = async () => { setRefrescando(true); await recargar(); setRefrescando(false); };
  const abrir = (v) => navigation.navigate('Viaje', { id: v.id_viaje });

  const deHoy = (viajes ?? []).filter((v) => esHoy(v.fecha_programada));
  const ordenar = (lista) => [...lista].sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));
  const enCurso = ordenar((viajes ?? []).filter((v) => EN_CURSO.includes(v.estado)));
  const proximos = ordenar(deHoy.filter((v) => ['ASIGNADO', 'CONFIRMADO'].includes(v.estado)));
  const terminados = deHoy.filter((v) => v.estado === 'FINALIZADO');
  // Suma de los precios que ya devolvió el backend para cada viaje del día
  const estimadoDia = deHoy.filter((v) => !NO_SUMAN.includes(v.estado)).reduce((t, v) => t + Number(v.precio_estimado ?? 0), 0);
  const hoyTexto = diaCorto(new Date());

  return (
    <Pantalla edges={['top']} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.accent} />}>
      <Meta style={{ marginTop: 6 }}>{organizacion?.nombre}</Meta>
      <Titulo chico style={{ marginTop: 2 }}>Hoy, {hoyTexto}</Titulo>

      {viajes === null ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : (
        <>
          <View style={s.kpis}>
            <Kpi valor={String(deHoy.filter((v) => !NO_SUMAN.includes(v.estado)).length)} label="viajes hoy" />
            <Kpi valor={String(enCurso.length)} label="en curso" />
            <Kpi valor={pesos(estimadoDia)} label="estimado del día" ancho />
          </View>

          {enCurso.length ? (
            <Seccion titulo="En curso">
              <View style={s.grupo}>
                {enCurso.map((v) => (
                  <TarjetaViajeEmpresa key={v.id_viaje} viaje={v} conTabla eta={etas[v.id_viaje] ?? vivoDeEjemplo(v)?.minutos} onPress={() => abrir(v)} />
                ))}
              </View>
            </Seccion>
          ) : null}

          {proximos.length ? (
            <Seccion titulo="Próximos de hoy" nota={`${proximos.length} ${proximos.length === 1 ? 'viaje' : 'viajes'}`}>
              <View style={s.grupo}>{proximos.map((v) => <TarjetaViajeEmpresa key={v.id_viaje} viaje={v} onPress={() => abrir(v)} />)}</View>
            </Seccion>
          ) : null}

          {terminados.length ? (
            <Seccion titulo="Terminados hoy">
              <View style={s.grupo}>{terminados.map((v) => <TarjetaViajeEmpresa key={v.id_viaje} viaje={v} onPress={() => abrir(v)} />)}</View>
            </Seccion>
          ) : null}

          {!enCurso.length && !proximos.length && !terminados.length ? (
            <Vacio icono="calendar-blank-outline" titulo="Hoy no hay viajes" texto="Cargá uno y asignáselo a un conductor: lo vas a poder seguir acá en vivo.">
              <View style={{ marginTop: 18, alignSelf: 'stretch' }}><Boton titulo="Cargar un viaje" onPress={() => navigation.navigate('NuevoViaje')} /></View>
            </Vacio>
          ) : null}
        </>
      )}
    </Pantalla>
  );
}

function Kpi({ valor, label, ancho }) {
  const s = useThemedStyles(createStyles);
  return (
    <View style={[s.kpi, ancho && { flex: 1.9 }]}>
      <Text style={s.kpiValor} numberOfLines={1} adjustsFontSizeToFit>{valor}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  kpis:     { flexDirection: 'row', gap: 8, marginTop: 14 },
  kpi:      { flex: 1, borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface, paddingVertical: 10, paddingHorizontal: 12 },
  kpiValor: { fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.4, color: c.ink },
  kpiLabel: { fontFamily: fonts.ui, fontSize: 12, color: c.ink3 },
  grupo:    { gap: 10 },
});
