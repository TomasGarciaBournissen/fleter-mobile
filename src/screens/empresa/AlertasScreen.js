import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { fonts } from '../../theme';
import { hora } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { listarConductores } from '../../services/empresa';
import { reasignarViaje, asignarRechazadoA, finalizarViaje } from '../../services/viajesEmpresa';
import { Pantalla, Titulo, Seccion, Lista, Vacio, Nota } from '../../components/ui';
import HojaConductor from '../../components/empresa/HojaConductor';

// Ícono y familia de color de cada aviso (rojo pide acción, ámbar avisa,
// verde salió bien, gris es informativo)
const TIPOS = {
  rechazado:  ['alert-circle-outline', 'error'],
  por_vencer: ['clock-outline', 'aviso'],
  cierre:     ['flag-checkered', 'aviso'],
  desvio:     ['navigation-variant-outline', 'aviso'],
  detenido:   ['timer-sand', 'aviso'],
  tarde:      ['clock-outline', 'neutra'],
  salida_gps: ['crosshairs-gps', 'neutra'],
  confirmado: ['check', 'neutra'],
  entregado:  ['check', 'ok'],
  vencido:    ['clock-alert-outline', 'error'],
  cancelado:  ['close-circle-outline', 'error'],
};

// Alertas: arriba lo que pide una acción de la empresa (con la acción a un
// toque; cuando se resuelve, sale solo). Abajo lo que pasó hoy, con un punto
// en lo que todavía no viste.
export default function AlertasScreen({ navigation }) {
  const { pendientes, hoy, marcarVistas, idOrg, recargar, resolverRechazo } = useEmpresa();
  const [conductores, setConductores] = useState(null);
  const [hoja, setHoja] = useState(null); // { alerta }
  const [accion, setAccion] = useState(null);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    recargar();
    return () => marcarVistas(); // al salir de la pestaña, lo de hoy queda visto
  }, [recargar, marcarVistas]));

  const abrirHoja = async (alerta) => {
    setError('');
    setHoja({ alerta });
    if (!conductores) listarConductores(idOrg).then(setConductores).catch((e) => setError(mensajeDeError(e)));
  };

  const asignar = async (conductor) => {
    const { alerta } = hoja;
    setAccion('asignar');
    try {
      if (alerta.tipo === 'rechazado') {
        const nuevo = await asignarRechazadoA(idOrg, alerta.viaje, conductor.id_conductor);
        resolverRechazo(alerta.viaje.id_viaje);
        setHoja(null);
        await recargar();
        navigation.navigate('Viaje', { id: nuevo.id_viaje });
      } else {
        await reasignarViaje(idOrg, alerta.viaje.id_viaje, conductor.id_conductor);
        setHoja(null);
        await recargar();
      }
    } catch (e) {
      setHoja(null);
      setError(mensajeDeError(e, 'No pudimos asignarlo. Probá de nuevo.'));
    } finally {
      setAccion(null);
    }
  };

  const finalizar = async (alerta) => {
    setAccion(alerta.id);
    try {
      await finalizarViaje(idOrg, alerta.viaje.id_viaje);
      await recargar();
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos finalizarlo. Probá de nuevo.'));
    } finally {
      setAccion(null);
    }
  };

  const acciones = (a) => {
    const ver = { titulo: 'Ver viaje', onPress: () => navigation.navigate('Viaje', { id: a.viaje.id_viaje }) };
    if (a.tipo === 'rechazado') return [{ titulo: 'Asignar a otro', primaria: true, onPress: () => abrirHoja(a) }, ver];
    if (a.tipo === 'por_vencer') {
      const tel = a.viaje.conductor?.telefono;
      return [
        tel ? { titulo: `Llamar a ${a.viaje.conductor.nombre}`, onPress: () => Linking.openURL(`tel:${tel}`) } : null,
        { titulo: 'Reasignar', onPress: () => abrirHoja(a) },
      ].filter(Boolean);
    }
    if (a.tipo === 'cierre') return [{ titulo: 'Finalizar el viaje', primaria: true, cargando: accion === a.id, onPress: () => finalizar(a) }, ver];
    return [];
  };

  const nada = !pendientes.length && !hoy.length;
  const alerta = hoja?.alerta;

  return (
    <Pantalla edges={['top']}>
      <Titulo style={{ marginTop: 12 }}>Alertas</Titulo>
      {error ? <Nota tipo="error">{error}</Nota> : null}

      {nada ? (
        <Vacio centrado icono="bell-outline" titulo="Todo en orden" texto="Acá te avisamos si un conductor rechaza un viaje, si uno está por vencer o si alguien se desvía." />
      ) : null}

      {pendientes.length ? (
        <Seccion titulo="Para resolver" nota={String(pendientes.length)}>
          <Lista>{pendientes.map((a) => <Aviso key={a.id} alerta={a} acciones={acciones(a)} />)}</Lista>
        </Seccion>
      ) : null}

      {hoy.length ? (
        <Seccion titulo="Hoy">
          <Lista>{hoy.map((a) => <Aviso key={a.id} alerta={a} onPress={a.id_viaje ? () => navigation.navigate('Viaje', { id: a.id_viaje }) : undefined} />)}</Lista>
        </Seccion>
      ) : null}

      <HojaConductor
        visible={!!hoja}
        titulo={alerta?.tipo === 'rechazado' ? '¿A quién se lo asignás?' : `Reasignar VJ-${alerta?.viaje.id_viaje ?? ''}`}
        bajada={alerta?.tipo === 'rechazado'
          ? 'Se crea un viaje nuevo con el mismo recorrido y horario. El conductor lo tiene que confirmar.'
          : `${alerta?.viaje.conductor?.nombre ?? 'El conductor'} deja de tenerlo y el nuevo lo tiene que confirmar.`}
        conductores={conductores}
        condiciones={alerta?.viaje.condiciones_requeridas}
        excluir={alerta?.viaje.conductor?.id_conductor}
        cargando={accion === 'asignar'}
        onElegir={asignar}
        onInvitar={() => { setHoja(null); navigation.navigate('Invitar', { tipo: 'CHOFER' }); }}
        onCerrar={() => setHoja(null)}
      />
    </Pantalla>
  );
}

function Aviso({ alerta: a, acciones = [], onPress }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const [icono, familia] = TIPOS[a.tipo] ?? ['information-outline', 'neutra'];
  const [bg, fg] = {
    error: [colors.errorSoft, colors.errorInk], aviso: [colors.warningSoft, colors.warningInk],
    ok: [colors.successSoft, colors.successInk], neutra: [colors.surface2, colors.ink2],
  }[familia];
  // Con acciones adentro no puede ser un botón (botones anidados): una vista
  const Caja = onPress ? Pressable : View;
  return (
    <Caja onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={onPress ? ({ pressed }) => [s.aviso, pressed && { backgroundColor: colors.surface2 }] : s.aviso}>
      {a.nueva ? <View style={s.punto} accessibilityLabel="Nueva" /> : null}
      <View style={[s.icono, { backgroundColor: bg }]}><MaterialCommunityIcons name={icono} size={18} color={fg} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.linea1}>
          <Text style={s.titulo}>{a.titulo}</Text>
          {a.fecha ? <Text style={s.hora}>{hora(a.fecha)}</Text> : null}
        </View>
        <Text style={s.texto}>{a.texto}</Text>
        {acciones.length ? (
          <View style={s.acciones}>
            {acciones.map((ac) => (
              <Pressable key={ac.titulo} onPress={ac.onPress} disabled={ac.cargando} accessibilityRole="button"
                style={({ pressed }) => [s.boton, ac.primaria && s.botonPri, pressed && { opacity: 0.8 }]}>
                <Text style={[s.botonTexto, ac.primaria && { color: colors.onAccent }]}>{ac.cargando ? 'Un momento…' : ac.titulo}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Caja>
  );
}

const createStyles = (c) => StyleSheet.create({
  aviso:      { flexDirection: 'row', gap: 12, paddingVertical: 13, paddingHorizontal: 14, alignItems: 'flex-start' },
  punto:      { position: 'absolute', left: 5, top: 28, width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
  icono:      { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  linea1:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  titulo:     { flex: 1, fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  hora:       { fontFamily: fonts.mono, fontSize: 12, color: c.ink3 },
  texto:      { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18, color: c.ink2, marginTop: 2 },
  acciones:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  boton:      { height: 36, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface, justifyContent: 'center' },
  botonPri:   { backgroundColor: c.accent, borderColor: c.accent },
  botonTexto: { fontFamily: fonts.uiBold, fontSize: 13, color: c.ink },
});
