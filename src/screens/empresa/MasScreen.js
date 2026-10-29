import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useThemedStyles } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { fonts } from '../../theme';
import { listarConductores, listarLugares, listarMiembros } from '../../services/empresa';
import { listarSeries } from '../../services/viajesEmpresa';
import { EN_CURSO } from '../../utils/estados';
import { Pantalla, Titulo, Lista, Fila, Avatar, Boton, Seccion } from '../../components/ui';
import SelectorApariencia from '../../components/SelectorApariencia';

const ESTADOS_ORG = { TRIAL: 'Período de prueba', ACTIVA: 'Cuenta activa', SUSPENDIDA: 'Cuenta suspendida' };
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Más: todo lo que no es el día a día. Conductores encabeza la lista
// (invitar a uno también queda a mano desde Nuevo viaje).
export default function MasScreen({ navigation }) {
  const s = useThemedStyles(createStyles);
  const { user, logout } = useAuth();
  const { idOrg, organizacion, esResponsable, viajes } = useEmpresa();
  const [cuentas, setCuentas] = useState({});

  useFocusEffect(useCallback(() => {
    Promise.allSettled([listarConductores(idOrg), listarLugares(idOrg), listarSeries(idOrg, { estado: 'ACTIVA' }), listarMiembros(idOrg)])
      .then(([c, l, se, m]) => setCuentas({
        conductores: c.value, lugares: l.value, series: se.value, miembros: m.value,
      }));
  }, [idOrg]));

  const enRuta = new Set((viajes ?? []).filter((v) => EN_CURSO.includes(v.estado)).map((v) => v.conductor?.id_conductor));
  const { conductores, lugares, series, miembros } = cuentas;
  const otros = (miembros ?? []).filter((m) => m.id_usuario !== user?.id_usuario).length;

  return (
    <Pantalla edges={['top']}>
      <Titulo style={{ marginTop: 12 }}>Más</Titulo>
      <View style={s.empresa}>
        <Avatar nombre={organizacion?.nombre} />
        <View style={{ flex: 1 }}>
          <Text style={s.nombre}>{organizacion?.nombre}</Text>
          <Text style={s.meta}>{ESTADOS_ORG[organizacion?.estado] ?? ''}. Sos {esResponsable ? 'responsable' : 'miembro'}.</Text>
        </View>
      </View>

      <Lista style={{ marginTop: 16 }}>
        <Fila izquierda={<Avatar icono="van-utility" />} titulo="Conductores" chevron onPress={() => navigation.navigate('Conductores')}
          sub={conductores ? `${plural(conductores.length, 'conductor', 'conductores')}${conductores.some((c) => enRuta.has(c.id_conductor)) ? `, ${conductores.filter((c) => enRuta.has(c.id_conductor)).length} en ruta` : ''}` : ' '} />
        <Fila izquierda={<Avatar icono="star-outline" />} titulo="Lugares guardados" chevron onPress={() => navigation.navigate('Lugares')}
          sub={lugares ? plural(lugares.length, 'lugar', 'lugares') : ' '} />
        <Fila izquierda={<Avatar icono="repeat" />} titulo="Viajes repetidos" chevron onPress={() => navigation.navigate('Series')}
          sub={series ? (series.length ? plural(series.length, 'activo', 'activos') : 'Ninguno activo') : ' '} />
        <Fila izquierda={<Avatar icono="account-multiple-outline" />} titulo="Equipo" chevron onPress={() => navigation.navigate('Equipo')}
          sub={miembros ? (otros ? `${user?.nombre} y ${plural(otros, 'persona más', 'personas más')}` : 'Solo vos, por ahora') : ' '} />
        <Fila izquierda={<Avatar icono="office-building-outline" />} titulo="Datos de la empresa" sub="CUIT, razón social, dirección" chevron onPress={() => navigation.navigate('DatosEmpresa')} />
        <Fila izquierda={<Avatar nombre={[user?.nombre, user?.apellido].filter(Boolean).join(' ')} />} titulo="Mis datos" sub={user?.email} chevron onPress={() => navigation.navigate('MisDatos')} />
      </Lista>

      <Seccion titulo="Apariencia"><SelectorApariencia /></Seccion>

      <View style={{ marginTop: 28 }}><Boton titulo="Cerrar sesión" variante="borde" onPress={logout} /></View>
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  empresa: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  nombre:  { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  meta:    { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 1 },
});
