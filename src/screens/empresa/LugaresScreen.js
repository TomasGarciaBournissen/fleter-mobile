import React, { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { listarLugares } from '../../services/empresa';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Bajada, Lista, Fila, Avatar, Vacio, Nota, Boton } from '../../components/ui';

// Lugares guardados de la empresa: direcciones frecuentes con nombre, que se
// eligen a un toque al cargar un viaje. El conductor nunca ve el nombre.
export default function LugaresScreen({ navigation }) {
  const { colors } = useTheme();
  const { idOrg } = useEmpresa();
  const [lugares, setLugares] = useState(null);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    listarLugares(idOrg).then((l) => { setLugares(l); setError(''); }).catch((e) => setError(mensajeDeError(e, 'No pudimos cargar los lugares.')));
  }, [idOrg]));

  return (
    <Pantalla onVolver={() => navigation.goBack()} pie={<Boton titulo="Agregar un lugar" onPress={() => navigation.navigate('Lugar', {})} />}>
      <Titulo>Lugares guardados</Titulo>
      <Bajada>Depósitos, sucursales y clientes de siempre. Al cargar un viaje los elegís sin escribir la dirección.</Bajada>
      {error ? <Nota tipo="error">{error}</Nota> : null}
      {lugares === null && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}
      {lugares && !lugares.length ? <Vacio icono="star-outline" titulo="Todavía no guardaste lugares" texto="Guardá el depósito o un cliente frecuente para no cargar la dirección cada vez." /> : null}
      {lugares?.length ? (
        <Lista style={{ marginTop: 16 }}>
          {lugares.map((l) => (
            <Fila key={l.id_lugar} izquierda={<Avatar icono="star-outline" />} titulo={l.nombre} sub={l.direccion} chevron onPress={() => navigation.navigate('Lugar', { lugar: l })} />
          ))}
        </Lista>
      ) : null}
      {lugares?.length ? <Nota>Cambiar o borrar un lugar no toca los viajes que ya lo usan: esos guardan su dirección.</Nota> : null}
    </Pantalla>
  );
}
