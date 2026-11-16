import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { desvincularme, previaDesvincularme } from '../../services/viajesConductor';
import { mesAlta } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Bajada, Boton, Nota, HojaInferior } from '../../components/ui';
import { iniciales } from './DetalleViajeScreen';

// Una empresa con la que trabaja el conductor. Antes de desvincularse se pide
// la vista previa (GET /api/choferes/mis-organizaciones/:id/desvinculacion):
// con un viaje en curso no se puede (409) y la hoja lleva a terminarlo; si no,
// dice cuántos viajes se cancelan. Un backend sin vista previa (producción hasta
// que se pase) cancela todo, también un viaje en curso: ahí queda el aviso viejo.
export default function EmpresaConductorScreen({ navigation, route }) {
  const { organizacion: o } = route.params;
  const s = useThemedStyles(createStyles);
  const { refrescarUsuario } = useAuth();
  const [hoja, setHoja] = useState(false);
  const [previa, setPrevia] = useState(undefined); // undefined = cargando, null = sin vista previa
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const abrirHoja = () => {
    setHoja(true);
    setPrevia(undefined);
    previaDesvincularme(o.id_organizacion).then(setPrevia).catch(() => setPrevia(null));
  };

  const desvincular = async () => {
    setCargando(true);
    try {
      await desvincularme(o.id_organizacion);
      setHoja(false);
      refrescarUsuario().catch(() => {});
      navigation.goBack();
    } catch (err) {
      setHoja(false);
      setError(mensajeDeError(err));
      setCargando(false);
    }
  };

  return (
    <Pantalla onVolver={() => navigation.goBack()} pie={<Boton titulo="Desvincularme" variante="peligro" onPress={abrirHoja} />}>
      <View style={s.avatar}><Text style={s.avatarTexto}>{iniciales(o.nombre)}</Text></View>
      <Titulo>{o.nombre}</Titulo>
      <Bajada>{o.fecha_alta ? `Trabajás con esta empresa desde ${mesAlta(o.fecha_alta)}.` : 'Trabajás con esta empresa.'} Ve solo los viajes que te asigna ella.</Bajada>
      {error ? <Nota tipo="error">{error}</Nota> : null}

      <HojaInferior
        visible={hoja}
        titulo={previa?.en_curso ? 'Tenés un viaje en curso' : `¿Desvincularte de ${o.nombre}?`}
        bajada={bajadaHoja(previa)}
        onCerrar={() => setHoja(false)}
      >
        {previa?.en_curso ? (
          <Boton titulo="Ir al viaje" onPress={() => { setHoja(false); navigation.navigate('ViajeActivo', { id: previa.en_curso }); }} />
        ) : (
          <Boton titulo="Desvincularme" variante="peligro" cargando={cargando || previa === undefined} onPress={desvincular} />
        )}
        <Boton titulo="Volver" variante="fantasma" onPress={() => setHoja(false)} />
      </HojaInferior>
    </Pantalla>
  );
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function bajadaHoja(previa) {
  if (previa === undefined) return 'Revisando tus viajes con esta empresa…';
  if (previa === null) return 'Se cancelan todos tus viajes con esta empresa, también uno que esté en curso, y sus viajes repetidos. Para volver, te tienen que pasar un código nuevo.';
  if (previa.en_curso) return `Estás haciendo VJ-${previa.en_curso} para esta empresa. Terminalo y después te podés desvincular.`;
  const n = previa.viajes_a_cancelar?.length ?? 0;
  const se = previa.series_a_borrar?.length ?? 0;
  const efectos = [n ? `se ${n === 1 ? 'cancela' : 'cancelan'} ${plural(n, 'viaje que tenías por hacer', 'viajes que tenías por hacer')}` : null,
    se ? `se ${se === 1 ? 'borra' : 'borran'} ${plural(se, 'viaje repetido', 'viajes repetidos')}` : null].filter(Boolean);
  const txt = efectos.join(' y ');
  const primero = txt ? `${txt[0].toUpperCase()}${txt.slice(1)}. ` : 'No tenés viajes por hacer con esta empresa. ';
  return `${primero}Para volver, te tienen que pasar un código nuevo.`;
}

const createStyles = (c) => StyleSheet.create({
  avatar:      { width: 56, height: 56, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 18 },
  avatarTexto: { fontFamily: fonts.uiBold, fontSize: 18, color: c.ink2 },
});
