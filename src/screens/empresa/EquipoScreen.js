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
import { textoPermisos } from '../../utils/permisos';
import { Pantalla, Titulo, Bajada, Lista, Fila, Avatar, Pastilla, Seccion, Nota, Boton, HojaInferior } from '../../components/ui';

const ROLES = { RESPONSABLE: 'Responsable', MIEMBRO: 'Miembro' };
const nombreDe = (m) => [m.nombre, m.apellido].filter(Boolean).join(' ');

// Equipo de la empresa. Con el sistema de permisos hay un único dueño: invita,
// saca personas y elige qué puede hacer cada una (MiembroScreen). El dueño no se
// puede ir sin pasarle la empresa a otro. Con un backend sin permisos
// (`sistemaNuevo` false) queda el modelo viejo: responsables y miembros.
export default function EquipoScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { user, refrescarUsuario, logout } = useAuth();
  const { idOrg, esResponsable, sistemaNuevo } = useEmpresa();
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
      <Bajada>{sistemaNuevo
        ? 'El dueño invita y saca personas, y elige qué puede hacer cada una.'
        : 'Todos cargan y siguen viajes. Solo un responsable edita la empresa e invita a otras personas.'}</Bajada>
      {error ? <Nota tipo="error">{error}</Nota> : null}
      {miembros === null && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}
      {miembros ? (
        <Lista style={{ marginTop: 16 }}>
          {miembros.map((x) => {
            // Dueño: abre la ficha de cada uno; los demás solo se abren a sí mismos (irse)
            const abrir = sistemaNuevo
              ? (esResponsable && !yo(x) ? () => navigation.navigate('Miembro', { miembro: x }) : yo(x) ? () => setElegido(x) : undefined)
              : (esResponsable || yo(x) ? () => setElegido(x) : undefined);
            const pastilla = sistemaNuevo ? (x.es_dueno ? 'Dueño' : null) : ROLES[x.rol];
            return (
              <Fila key={x.id_usuario} izquierda={<Avatar nombre={nombreDe(x)} />}
                titulo={<View style={s.nombreFila}><Text style={s.nombre}>{nombreDe(x)}{yo(x) ? ' (vos)' : ''}</Text>{pastilla ? <Pastilla texto={pastilla} tipo="neutra" /> : null}</View>}
                sub={sistemaNuevo ? (x.es_dueno ? x.email ?? 'Todos los permisos' : textoPermisos(x)) : x.email}
                chevron={!!abrir} onPress={abrir} />
            );
          })}
        </Lista>
      ) : null}

      {esResponsable && invitaciones.length ? (
        <Seccion titulo="Invitaciones pendientes">
          <Lista>
            {invitaciones.map((inv) => (
              <Fila key={inv.id_invitacion} titulo="Código de equipo"
                sub={`${inv.permisos ? `${textoPermisos({ permisos: inv.permisos })}. ` : ''}Vence ${diaCorto(inv.fecha_vencimiento)}, ${hora(inv.fecha_vencimiento)}`}
                accion="Revocar" accionPeligro onAccion={() => hacer('revocar', () => revocarInvitacion(idOrg, inv.id_invitacion))} />
            ))}
          </Lista>
        </Seccion>
      ) : null}

      <HojaInferior visible={!!m} titulo={m ? `${nombreDe(m)}${yo(m) ? ' (vos)' : ''}` : ''} bajada={m ? `${sistemaNuevo ? (m.es_dueno ? 'Dueño' : 'En el equipo') : ROLES[m.rol]} desde el ${diaCorto(m.fecha_alta)}.` : ''} onCerrar={() => setElegido(null)}>
        {m && esResponsable && !sistemaNuevo ? (
          <Boton titulo={m.rol === 'RESPONSABLE' ? 'Pasar a miembro' : 'Hacer responsable'} variante="borde" cargando={accion === 'rol'}
            onPress={() => hacer('rol', () => cambiarRol(idOrg, m.id_usuario, m.rol === 'RESPONSABLE' ? 'MIEMBRO' : 'RESPONSABLE'))} />
        ) : null}
        {m && esResponsable && !yo(m) && !sistemaNuevo ? (
          <Boton titulo="Sacar del equipo" variante="peligro" cargando={accion === 'eliminar'} onPress={() => hacer('eliminar', () => eliminarMiembro(idOrg, m.id_usuario))} />
        ) : null}
        {m && yo(m) && sistemaNuevo && m.es_dueno ? (
          <Nota style={{ marginTop: 0 }}>Sos el dueño: para irte, primero pasale la empresa a otra persona del equipo desde su ficha.</Nota>
        ) : null}
        {m && yo(m) && !(sistemaNuevo && m.es_dueno) ? <Boton titulo="Irme de la empresa" variante="peligro" onPress={() => setElegido('salir')} /> : null}
        <Boton titulo="Volver" variante="fantasma" onPress={() => setElegido(null)} />
      </HojaInferior>

      <HojaInferior visible={elegido === 'salir'} titulo="¿Irte de la empresa?" onCerrar={() => setElegido(null)}
        bajada={`Dejás de ver sus viajes. Para volver, ${sistemaNuevo ? 'el dueño' : 'alguien responsable'} te tiene que pasar un código nuevo.`}>
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
