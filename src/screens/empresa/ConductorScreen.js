import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { fonts } from '../../theme';
import { desvincularConductor, previaDesvinculacion } from '../../services/empresa';
import { listarSeries } from '../../services/viajesEmpresa';
import { TIPOS_VEHICULO } from '../../services/vehiculos';
import { EN_CURSO, FINALES } from '../../utils/estados';
import { mesAlta } from '../../utils/fechas';
import { formatearPatente } from '../../utils/formularios';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Lista, Fila, Avatar, Seccion, Nota, Boton, HojaInferior } from '../../components/ui';
import { textoCondiciones } from '../../components/viaje/DatosViaje';
import TarjetaViajeEmpresa, { nombreConductor } from '../../components/empresa/TarjetaViajeEmpresa';

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const MAX_VIAJES = 5;

// Un conductor de la empresa: cómo contactarlo, sus vehículos y sus viajes
// por hacer. Antes de desvincular se pide la vista previa al backend
// (GET /choferes/:id/desvinculacion): qué viajes se cancelan y qué series se
// borran. Con un viaje en curso no se puede (409): la hoja lo dice y lleva al
// viaje. Un backend sin vista previa (producción hasta que se pase) cancela
// también el viaje en curso: ahí se avisa con lo que la app ya sabe.
export default function ConductorScreen({ navigation, route }) {
  const { conductor: c } = route.params;
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { idOrg, viajes, recargar, puede } = useEmpresa();
  const [series, setSeries] = useState([]);
  const [hoja, setHoja] = useState(false);
  const [previa, setPrevia] = useState(undefined); // undefined = cargando, null = sin vista previa
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    listarSeries(idOrg, { estado: 'ACTIVA' }).then((l) => setSeries(l.filter((x) => x.conductor?.id_conductor === c.id_conductor))).catch(() => {});
  }, [idOrg, c.id_conductor]));

  const suyos = (viajes ?? []).filter((v) => v.conductor?.id_conductor === c.id_conductor && !FINALES.includes(v.estado))
    .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));
  const enCurso = suyos.find((v) => EN_CURSO.includes(v.estado));

  const abrirHoja = () => {
    setHoja(true);
    setPrevia(undefined);
    previaDesvinculacion(idOrg, c.id_conductor).then(setPrevia).catch(() => setPrevia(null));
  };

  const desvincular = async () => {
    setCargando(true);
    try {
      await desvincularConductor(idOrg, c.id_conductor);
      await recargar();
      setHoja(false);
      navigation.goBack();
    } catch (e) {
      setHoja(false);
      setError(mensajeDeError(e, 'No pudimos desvincularlo. Probá de nuevo.'));
    } finally {
      setCargando(false);
    }
  };

  const bloqueo = previa?.en_curso ?? null; // id del viaje en curso: no se puede desvincular
  const aCancelar = previa ? previa.viajes_a_cancelar?.length ?? 0 : suyos.length;
  const aBorrar = previa ? previa.series_a_borrar?.length ?? 0 : series.length;
  const efectos = [
    aCancelar ? `se cancelan sus ${plural(aCancelar, 'viaje', 'viajes')} por hacer${!previa && enCurso ? ', incluido el que está haciendo ahora' : ''}` : null,
    aBorrar ? `se borran sus ${plural(aBorrar, 'viaje repetido', 'viajes repetidos')}` : null,
  ].filter(Boolean);

  return (
    <Pantalla onVolver={() => navigation.goBack()} pie={puede('CHOFERES') ? <Boton titulo="Desvincular de la empresa" variante="peligro" onPress={abrirHoja} /> : null}>
      <View style={s.cabeza}>
        <Avatar nombre={nombreConductor(c)} style={s.avatarGrande} />
        <View style={{ flex: 1 }}>
          <Titulo chico>{nombreConductor(c)}</Titulo>
          {c.fecha_alta ? <Text style={s.meta}>Con la empresa desde {mesAlta(c.fecha_alta)}</Text> : null}
        </View>
      </View>

      {c.telefono ? (
        <Pressable onPress={() => Linking.openURL(`tel:${c.telefono}`)} accessibilityRole="button" style={({ pressed }) => [s.llamar, pressed && { backgroundColor: colors.surface3 }]}>
          <MaterialCommunityIcons name="phone-outline" size={18} color={colors.ink} />
          <Text style={s.llamarTexto}>Llamar a {c.nombre}</Text>
          <Text style={s.tel}>{c.telefono}</Text>
        </Pressable>
      ) : null}

      <Seccion titulo="Vehículos">
        <Lista>
          {(c.vehiculos ?? []).map((veh) => {
            const tipo = TIPOS_VEHICULO.find((t) => t.id === veh.tipo_vehiculo);
            return (
              <Fila key={veh.id_vehiculo} izquierda={<Avatar icono={tipo?.icono ?? 'truck-outline'} />}
                titulo={<Text style={s.vehTitulo}>{veh.marca} {veh.modelo} <Text style={s.patente}>{formatearPatente(veh.patente)}</Text></Text>}
                sub={`${tipo?.titulo ?? veh.tipo_vehiculo ?? 'Vehículo'}. ${textoCondiciones(veh.condiciones)}.`} />
            );
          })}
          {!c.vehiculos?.length ? <Fila titulo="Sin vehículos cargados" sub="No se le pueden asignar viajes hasta que cargue uno en su app." /> : null}
        </Lista>
      </Seccion>

      <Seccion titulo="Viajes por hacer" nota={suyos.length ? String(suyos.length) : null}>
        {suyos.length
          ? <View style={{ gap: 10 }}>{suyos.slice(0, MAX_VIAJES).map((v) => <TarjetaViajeEmpresa key={v.id_viaje} viaje={v} onPress={() => navigation.navigate('Viaje', { id: v.id_viaje })} />)}</View>
          : <Text style={s.meta}>No tiene viajes asignados ahora.</Text>}
        {suyos.length > MAX_VIAJES ? <Text style={[s.meta, { marginTop: 10 }]}>Y {suyos.length - MAX_VIAJES} más: los ves todos en Viajes.</Text> : null}
      </Seccion>

      {error ? <Nota tipo="error">{error}</Nota> : null}

      <HojaInferior
        visible={hoja}
        titulo={previa === undefined ? `Desvincular a ${c.nombre}` : bloqueo ? `${c.nombre} está haciendo un viaje` : `¿Desvincular a ${c.nombre}?`}
        bajada={previa === undefined ? 'Revisando qué viajes se cancelan…'
          : bloqueo ? `Está haciendo VJ-${bloqueo} ahora. Lo podés desvincular cuando lo termine o si cancelás ese viaje.`
            : efectos.length
              ? `Deja de trabajar con la empresa y ${efectos.join(' y ')}. Le llega el aviso al instante. Puede volver más adelante con un código nuevo.`
              : 'Deja de trabajar con la empresa. No tiene viajes por hacer. Puede volver más adelante con un código nuevo.'}
        onCerrar={() => setHoja(false)}
      >
        {previa === null && enCurso ? <Nota tipo="aviso" style={{ marginTop: 0 }}>{c.nombre} está haciendo VJ-{enCurso.id_viaje} ahora: se corta donde está.</Nota> : null}
        {bloqueo ? (
          <Boton titulo={`Ver VJ-${bloqueo}`} onPress={() => { setHoja(false); navigation.navigate('Viaje', { id: bloqueo }); }} />
        ) : (
          <Boton titulo="Desvincular" variante="peligro" cargando={cargando || previa === undefined} onPress={desvincular} />
        )}
        <Boton titulo="Volver" variante="fantasma" onPress={() => setHoja(false)} />
      </HojaInferior>
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  cabeza:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarGrande:{ width: 48, height: 48, borderRadius: 10 },
  meta:        { fontFamily: fonts.ui, fontSize: 13, color: c.ink3, marginTop: 2 },
  llamar:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, height: 48, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface },
  llamarTexto: { flex: 1, fontFamily: fonts.uiSemiBold, fontSize: 15, color: c.ink },
  tel:         { fontFamily: fonts.mono, fontSize: 13, color: c.ink3 },
  vehTitulo:   { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  patente:     { fontFamily: fonts.monoMedium, letterSpacing: 1.1 },
});
