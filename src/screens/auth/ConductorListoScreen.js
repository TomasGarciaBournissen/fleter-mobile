import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { DEV_MODE } from '../../config';
import { fonts } from '../../theme';
import { TIPOS_VEHICULO, CONDICIONES } from '../../services/vehiculos';
import { Pantalla, Titulo, Bajada, Nota, Boton, IsotipoAnimado } from '../../components/ui';

// Cierre del alta del conductor. Confirma con quién trabaja y con qué
// vehículo, que es lo que define qué viajes le llegan.
export default function ConductorListoScreen({ navigation, route }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { setAltaEnCurso, refrescarUsuario, mockLogin } = useAuth();
  const { organizacion, vehiculo } = route.params ?? {};
  const [cargando, setCargando] = useState(false);

  const tipo = vehiculo && TIPOS_VEHICULO.find((t) => t.id === vehiculo.tipo);
  const conds = vehiculo?.condiciones?.map((id) => CONDICIONES.find((c) => c.id === id)?.titulo.toLowerCase()).filter(Boolean) ?? [];
  const condTexto = conds.length ? conds.join(', ').replace(/, ([^,]*)$/, ' y $1') : 'sin condiciones especiales';
  const resumen = tipo ? `${tipo.titulo}. ${condTexto.charAt(0).toUpperCase()}${condTexto.slice(1)}.` : '';

  const terminar = async () => {
    setCargando(true);
    if (DEV_MODE) { mockLogin('CONDUCTOR'); setAltaEnCurso(false); return; }
    try { await refrescarUsuario(); } finally { setAltaEnCurso(false); }
  };

  return (
    <Pantalla
      pie={
        <>
          <Boton titulo="Ver mis viajes" onPress={terminar} cargando={cargando} />
          {organizacion ? (
            <Boton titulo="Sumar otra empresa" variante="fantasma" onPress={() => navigation.navigate('CodigoConductor', { vehiculo })} />
          ) : null}
        </>
      }
    >
      <View style={{ marginTop: 28, marginBottom: 22 }}>
        <IsotipoAnimado size={72} />
      </View>
      <Titulo>{organizacion ? `Ya trabajás con ${organizacion.nombre}` : 'Tu cuenta está lista'}</Titulo>
      <Bajada>
        {organizacion
          ? 'Cuando te asignen un viaje te va a aparecer en Viajes para que lo confirmes.'
          : 'Cuando una empresa te pase un código, lo cargás desde tu perfil y empezás a recibir sus viajes.'}
      </Bajada>
      {vehiculo ? (
        <View style={s.vehiculo}>
          <View style={s.glifo}><MaterialCommunityIcons name={tipo?.icono ?? 'van-utility'} size={18} color={colors.accentInk} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.titulo}>{vehiculo.marca} {vehiculo.modelo} <Text style={s.patente}>{vehiculo.patente}</Text></Text>
            <Text style={s.meta}>{resumen}</Text>
          </View>
        </View>
      ) : (
        <Nota tipo="aviso">Sin vehículo no te pueden asignar viajes. Cargalo desde tu perfil cuando puedas.</Nota>
      )}
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  vehiculo: { flexDirection: 'row', gap: 14, marginTop: 26, padding: 16, borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface },
  glifo:    { width: 26, height: 26, borderRadius: 6, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' },
  titulo:   { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  patente:  { fontFamily: fonts.monoMedium, letterSpacing: 1.1 },
  meta:     { fontFamily: fonts.ui, fontSize: 13, color: c.ink3, marginTop: 1 },
});
