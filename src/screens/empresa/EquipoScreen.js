import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { fonts } from '../../theme';
import { listarMiembros, cambiarRol, eliminarMiembro, salirDeEmpresa, listarInvitaciones, revocarInvitacion } from '../../services/empresa';
import { diaCorto, hora } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { DEV_MODE } from '../../config';
import { Pantalla, Titulo, Bajada, Lista, Fila, Avatar, Pastilla, Seccion, Nota, Boton, HojaInferior } from '../../components/ui';

const ROLES = { RESPONSABLE: 'Responsable', MIEMBRO: 'Miembro' };
const nombreDe = (m) => [m.nombre, m.apellido].filter(Boolean).join(' ');

// Equipo de la empresa. Todos cargan y siguen viajes; solo un responsable
// edita la empresa, invita personas y cambia roles. Siempre queda al menos un
// responsable (el backend responde 409 si no).
export default function EquipoScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { user, refrescarUsuario, logout } = useAuth();
  const { idOrg, esResponsable } = useEmpresa();
  const [miembros, setMiembros] = useState(null);
  const [invitaciones, setInvitaciones] = useState([]);
  const [elegido, setElegido] = useState(null); // miembro | 'salir'
  const [accion, setAccion] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [m, inv] = await Promise.all([listarMiembros(idOrg), listarInvitaciones(idOrg).catch(() => [])]);
      setMiembros(m);
      setInvitaciones(inv.filter((i) => i.tipo === 'MIEMBRO'));
      setError('');
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos cargar el equipo.'));
    }
  }, [idOrg]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const hacer = async (nombre, fn) => {
    setAccion(nombre);
    try {
      await fn();
      setElegido(null);
      await cargar();
    } catch (e) {
      setElegido(null);
      setError(mensajeDeError(e).replace(/promove a otro miembro antes/i, 'hacé responsable a otra persona antes.'));
    } finally {
      setAccion(null);
    }
  };

  // Irse deja la cuenta sin empresa: vuelve al alta de empresa
  const salir = () => hacer('salir', async () => {
    await salirDeEmpresa(idOrg);
    if (DEV_MODE) await logout(); else await refrescarUsuario();
  });

  const yo = (m) => m.id_usuario === user?.id_usuario;
  const m = elegido && elegido !== 'salir' ? elegido : null;

  return (
    <Pantalla onVolver={() => navigation.goBack()} pie={esResponsable ? <Boton titulo="Invitar a alguien de tu equipo" onPress={() => navigation.navigate('Invitar', { tipo: 'MIEMBRO' })} /> : null}>
      <Titulo>Equipo</Titulo>
      <Bajada>Todos cargan y siguen viajes. Solo un responsable edita la empresa e invita a otras personas.</Bajada>
      {error ? <Nota tipo="error">{error}</Nota> : null}
      {miembros === null && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}
      {miembros ? (
        <Lista style={{ marginTop: 16 }}>
          {miembros.map((x) => (
            <Fila key={x.id_usuario} izquierda={<Avatar nombre={nombreDe(x)} />}
              titulo={<View style={s.nombreFila}><Text style={s.nombre}>{nombreDe(x)}{yo(x) ? ' (vos)' : ''}</Text><Pastilla texto={ROLES[x.rol]} tipo="neutra" /></View>}
              sub={x.email} chevron={esResponsable || yo(x)}
              onPress={esResponsable || yo(x) ? () => setElegido(x) : undefined} />
          ))}
        </Lista>
      ) : null}

      {esResponsable && invitaciones.length ? (
        <Seccion titulo="Invitaciones pendientes">
          <Lista>
            {invitaciones.map((inv) => (
              <Fila key={inv.id_invitacion} titulo="Código de equipo" sub={`Vence ${diaCorto(inv.fecha_vencimiento)}, ${hora(inv.fecha_vencimiento)}`}
                accion="Revocar" accionPeligro onAccion={() => hacer('revocar', () => revocarInvitacion(idOrg, inv.id_invitacion))} />
            ))}
          </Lista>
        </Seccion>
      ) : null}

      <HojaInferior visible={!!m} titulo={m ? `${nombreDe(m)}${yo(m) ? ' (vos)' : ''}` : ''} bajada={m ? `${ROLES[m.rol]} desde el ${diaCorto(m.fecha_alta)}.` : ''} onCerrar={() => setElegido(null)}>
        {m && esResponsable ? (
          <Boton titulo={m.rol === 'RESPONSABLE' ? 'Pasar a miembro' : 'Hacer responsable'} variante="borde" cargando={accion === 'rol'}
            onPress={() => hacer('rol', () => cambiarRol(idOrg, m.id_usuario, m.rol === 'RESPONSABLE' ? 'MIEMBRO' : 'RESPONSABLE'))} />
        ) : null}
        {m && esResponsable && !yo(m) ? (
          <Boton titulo="Sacar del equipo" variante="peligro" cargando={accion === 'eliminar'} onPress={() => hacer('eliminar', () => eliminarMiembro(idOrg, m.id_usuario))} />
        ) : null}
        {m && yo(m) ? <Boton titulo="Irme de la empresa" variante="peligro" onPress={() => setElegido('salir')} /> : null}
        <Boton titulo="Volver" variante="fantasma" onPress={() => setElegido(null)} />
      </HojaInferior>

      <HojaInferior visible={elegido === 'salir'} titulo="¿Irte de la empresa?" onCerrar={() => setElegido(null)}
        bajada="Dejás de ver sus viajes. Para volver, alguien responsable te tiene que pasar un código nuevo.">
        <Boton titulo="Irme" variante="peligro" cargando={accion === 'salir'} onPress={salir} />
        <Boton titulo="Volver" variante="fantasma" onPress={() => setElegido(null)} />
      </HojaInferior>
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  nombreFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  nombre:     { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink, flexShrink: 1 },
});
