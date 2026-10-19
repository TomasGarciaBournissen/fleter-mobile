import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { misOrganizaciones, misVehiculos } from '../../services/viajesConductor';
import { TIPOS_VEHICULO, CONDICIONES } from '../../services/vehiculos';
import { mesAlta } from '../../utils/fechas';
import { formatearPatente } from '../../utils/formularios';
import { Pantalla, Titulo, Boton, Nota } from '../../components/ui';
import SelectorApariencia from '../../components/SelectorApariencia';
import { iniciales } from './DetalleViajeScreen';

// Perfil del conductor: sus empresas (sumar con código, entrar a una para
// desvincularse), sus vehículos y la apariencia.
export default function PerfilScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { user, logout } = useAuth();
  const [orgs, setOrgs] = useState(null);
  const [vehiculos, setVehiculos] = useState(null);

  useFocusEffect(useCallback(() => {
    misOrganizaciones().then(setOrgs).catch(() => setOrgs([]));
    misVehiculos().then(setVehiculos).catch(() => setVehiculos([]));
  }, []));

  const nombre = [user?.nombre, user?.apellido].filter(Boolean).join(' ');

  return (
    <Pantalla edges={['top']}>
      <Titulo style={{ marginTop: 12 }}>Perfil</Titulo>
      <View style={s.yo}>
        <View style={s.avatar}><Text style={s.avatarTexto}>{iniciales(nombre)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.nombre}>{nombre}</Text>
          <Text style={s.meta}>{user?.email}</Text>
        </View>
      </View>

      <Text style={s.seccion}>Mis empresas</Text>
      <View style={s.lista}>
        {(orgs ?? []).map((o, i) => (
          <Fila key={o.id_organizacion} primera={i === 0} onPress={() => navigation.navigate('EmpresaConductor', { organizacion: o })}
            izquierda={<View style={s.avatar}><Text style={s.avatarTexto}>{iniciales(o.nombre)}</Text></View>}
            titulo={o.nombre} sub={o.fecha_alta ? `Desde ${mesAlta(o.fecha_alta)}` : ''} chevron />
        ))}
        <Fila primera={!orgs?.length} onPress={() => navigation.navigate('SumarEmpresa')}
          izquierda={<View style={[s.avatar, s.avatarSumar]}><MaterialCommunityIcons name="plus" size={18} color={colors.ink2} /></View>}
          titulo="Sumar una empresa" tituloAccion sub="Con el código que te pasan" />
      </View>

      <Text style={s.seccion}>Mis vehículos</Text>
      <View style={s.lista}>
        {(vehiculos ?? []).map((veh, i) => {
          const tipo = TIPOS_VEHICULO.find((t) => t.id === veh.tipo_vehiculo);
          const conds = (veh.condiciones ?? []).map((c) => CONDICIONES.find((x) => x.id === (c.condicion ?? c))?.titulo).filter(Boolean);
          return (
            <Fila key={veh.id_vehiculo} primera={i === 0}
              izquierda={<View style={s.avatar}><MaterialCommunityIcons name={tipo?.icono ?? 'truck-outline'} size={18} color={colors.ink} /></View>}
              titulo={<>{veh.marca} {veh.modelo} <Text style={s.patente}>{formatearPatente(veh.patente)}</Text></>}
              sub={`${tipo?.titulo ?? veh.tipo_vehiculo}. ${conds.length ? conds.join(', ') : 'Sin condiciones'}.`} />
          );
        })}
        <Fila primera={!vehiculos?.length} onPress={() => navigation.navigate('NuevoVehiculo')}
          izquierda={<View style={[s.avatar, s.avatarSumar]}><MaterialCommunityIcons name="plus" size={18} color={colors.ink2} /></View>}
          titulo="Agregar vehículo" tituloAccion />
      </View>
      {vehiculos && !vehiculos.length ? <Nota tipo="aviso">Sin vehículo no te pueden asignar viajes.</Nota> : null}

      <Text style={s.seccion}>Apariencia</Text>
      <SelectorApariencia />

      <View style={{ marginTop: 28 }}><Boton titulo="Cerrar sesión" variante="borde" onPress={logout} /></View>
    </Pantalla>
  );
}

function Fila({ izquierda, titulo, sub, onPress, primera, chevron, tituloAccion }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [s.fila, !primera && s.filaBorde, pressed && { backgroundColor: colors.surface2 }]}>
      {izquierda}
      <View style={{ flex: 1 }}>
        <Text style={[s.filaTitulo, tituloAccion && { color: colors.accentInk }]}>{titulo}</Text>
        {sub ? <Text style={s.meta}>{sub}</Text> : null}
      </View>
      {chevron ? <MaterialCommunityIcons name="chevron-right" size={20} color={colors.ink3} /> : null}
    </Pressable>
  );
}

const createStyles = (c) => StyleSheet.create({
  yo:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  avatar:      { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarSumar: { borderStyle: 'dashed', borderColor: c.lineStrong },
  avatarTexto: { fontFamily: fonts.uiBold, fontSize: 13, color: c.ink2 },
  nombre:      { fontFamily: fonts.uiBold, fontSize: 15, color: c.ink },
  meta:        { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 1 },
  seccion:     { fontFamily: fonts.display, fontSize: 14, color: c.ink, marginTop: 24, marginBottom: 10 },
  lista:       { borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface, overflow: 'hidden' },
  fila:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 56 },
  filaBorde:   { borderTopWidth: 1, borderTopColor: c.line },
  filaTitulo:  { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  patente:     { fontFamily: fonts.monoMedium, letterSpacing: 1.1 },
});
