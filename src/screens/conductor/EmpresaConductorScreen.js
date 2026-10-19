import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { desvincularme } from '../../services/viajesConductor';
import { mesAlta } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Bajada, Boton, Nota, HojaInferior } from '../../components/ui';
import { iniciales } from './DetalleViajeScreen';

// Una empresa con la que trabaja el conductor. Desvincularse cancela todos
// sus viajes con esa empresa, incluso uno en curso (ISSUES.md #1): se avisa claro.
export default function EmpresaConductorScreen({ navigation, route }) {
  const { organizacion: o } = route.params;
  const s = useThemedStyles(createStyles);
  const { refrescarUsuario } = useAuth();
  const [hoja, setHoja] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

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
    <Pantalla onVolver={() => navigation.goBack()} pie={<Boton titulo="Desvincularme" variante="peligro" onPress={() => setHoja(true)} />}>
      <View style={s.avatar}><Text style={s.avatarTexto}>{iniciales(o.nombre)}</Text></View>
      <Titulo>{o.nombre}</Titulo>
      <Bajada>{o.fecha_alta ? `Trabajás con esta empresa desde ${mesAlta(o.fecha_alta)}.` : 'Trabajás con esta empresa.'} Ve solo los viajes que te asigna ella.</Bajada>
      {error ? <Nota tipo="error">{error}</Nota> : null}

      <HojaInferior
        visible={hoja}
        titulo={`¿Desvincularte de ${o.nombre}?`}
        bajada="Se cancelan todos tus viajes con esta empresa, también uno que esté en curso, y sus viajes repetidos. Para volver, te tienen que pasar un código nuevo."
        onCerrar={() => setHoja(false)}
      >
        <Boton titulo="Desvincularme" variante="peligro" cargando={cargando} onPress={desvincular} />
        <Boton titulo="Volver" variante="fantasma" onPress={() => setHoja(false)} />
      </HojaInferior>
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  avatar:      { width: 56, height: 56, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 18 },
  avatarTexto: { fontFamily: fonts.uiBold, fontSize: 18, color: c.ink2 },
});
