import React, { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { listarConductores, listarInvitaciones, revocarInvitacion } from '../../services/empresa';
import { EN_CURSO } from '../../utils/estados';
import { diaCorto, hora } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Lista, Fila, Avatar, Seccion, Vacio, Nota, Boton } from '../../components/ui';
import ChipEstado from '../../components/viaje/ChipEstado';
import { resumenConductor } from '../../components/empresa/HojaConductor';
import { nombreConductor } from '../../components/empresa/TarjetaViajeEmpresa';

// Conductores vinculados, cada uno con su vehículo y si está en un viaje
// ahora. Abajo, los códigos de conductor sin usar (se pueden revocar).
export default function ConductoresScreen({ navigation }) {
  const { colors } = useTheme();
  const { idOrg, viajes } = useEmpresa();
  const [conductores, setConductores] = useState(null);
  const [invitaciones, setInvitaciones] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [c, inv] = await Promise.all([listarConductores(idOrg), listarInvitaciones(idOrg).catch(() => [])]);
      setConductores(c);
      setInvitaciones(inv.filter((i) => i.tipo === 'CHOFER'));
      setError('');
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos cargar los conductores.'));
    }
  }, [idOrg]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const revocar = async (inv) => {
    try {
      await revocarInvitacion(idOrg, inv.id_invitacion);
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  const viajeAhora = (c) => (viajes ?? []).find((v) => EN_CURSO.includes(v.estado) && v.conductor?.id_conductor === c.id_conductor);

  return (
    <Pantalla onVolver={() => navigation.goBack()} pie={<Boton titulo="Invitar conductor" onPress={() => navigation.navigate('Invitar', { tipo: 'CHOFER' })} />}>
      <Titulo>Conductores</Titulo>
      {error ? <Nota tipo="error">{error}</Nota> : null}
      {conductores === null && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}
      {conductores && !conductores.length ? (
        <Vacio icono="van-utility" titulo="Todavía no hay conductores" texto="Generá un código y pasáselo: lo carga en su app y queda vinculado a la empresa." />
      ) : null}
      {conductores?.length ? (
        <Lista style={{ marginTop: 14 }}>
          {conductores.map((c) => {
            const ahora = viajeAhora(c);
            return (
              <Fila key={c.id_conductor} izquierda={<Avatar nombre={nombreConductor(c)} />} titulo={nombreConductor(c)} sub={resumenConductor(c)}
                derecha={ahora ? <ChipEstado estado={ahora.estado} /> : null} chevron={!ahora}
                onPress={() => navigation.navigate('Conductor', { conductor: c })} />
            );
          })}
        </Lista>
      ) : null}

      {invitaciones.length ? (
        <Seccion titulo="Invitaciones pendientes">
          <Lista>
            {invitaciones.map((inv) => (
              <Fila key={inv.id_invitacion} titulo="Código de conductor" sub={`Vence ${diaCorto(inv.fecha_vencimiento)}, ${hora(inv.fecha_vencimiento)}`}
                accion="Revocar" accionPeligro onAccion={() => revocar(inv)} />
            ))}
          </Lista>
        </Seccion>
      ) : null}
    </Pantalla>
  );
}
