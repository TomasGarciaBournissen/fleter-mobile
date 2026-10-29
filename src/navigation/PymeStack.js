import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { EmpresaProvider, useEmpresa } from '../context/EmpresaContext';
import { fonts } from '../theme';
import InicioScreen from '../screens/empresa/InicioScreen';
import ViajesScreen from '../screens/empresa/ViajesScreen';
import AlertasScreen from '../screens/empresa/AlertasScreen';
import MasScreen from '../screens/empresa/MasScreen';
import NuevoViajeScreen from '../screens/empresa/NuevoViajeScreen';
import ViajeScreen from '../screens/empresa/ViajeScreen';
import ConductoresScreen from '../screens/empresa/ConductoresScreen';
import ConductorScreen from '../screens/empresa/ConductorScreen';
import InvitarScreen from '../screens/empresa/InvitarScreen';
import LugaresScreen from '../screens/empresa/LugaresScreen';
import LugarScreen from '../screens/empresa/LugarScreen';
import SeriesScreen from '../screens/empresa/SeriesScreen';
import SerieScreen from '../screens/empresa/SerieScreen';
import EquipoScreen from '../screens/empresa/EquipoScreen';
import DatosEmpresaScreen from '../screens/empresa/DatosEmpresaScreen';
import MisDatosScreen from '../screens/empresa/MisDatosScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONOS = { Inicio: 'home-outline', Viajes: 'format-list-bulleted', Alertas: 'bell-outline', Mas: 'dots-horizontal' };
const LABELS = { Inicio: 'Inicio', Viajes: 'Viajes', Nuevo: 'Nuevo', Alertas: 'Alertas', Mas: 'Más' };

// «Nuevo» no tiene pantalla propia: abre el alta de viaje sobre las pestañas
const SinPantalla = () => null;

function IconoTab({ nombre, focused, color }) {
  const { colors } = useTheme();
  const { pendientes } = useEmpresa();
  if (nombre === 'Nuevo') {
    return (
      <View style={[s.nuevo, { backgroundColor: colors.accent }]}>
        <MaterialCommunityIcons name="plus" size={22} color={colors.onAccent} />
      </View>
    );
  }
  const n = nombre === 'Alertas' ? pendientes.length : 0;
  return (
    <View>
      <MaterialCommunityIcons name={ICONOS[nombre]} size={22} color={focused ? colors.accent : color} />
      {n ? (
        <View style={[s.badge, { backgroundColor: colors.error, borderColor: colors.surface }]} accessibilityLabel={`${n} para resolver`}>
          <Text style={[s.badgeTexto, { color: colors.onAccentLarge }]}>{n > 9 ? '9+' : n}</Text>
        </View>
      ) : null}
    </View>
  );
}

// Pestañas de la empresa: Inicio · Viajes · Nuevo · Alertas · Más (prototipo de
// la fase 3). Conductores, lugares, viajes repetidos y equipo viven en Más.
function Pestanas() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: 4 },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.ink3,
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ fontFamily: focused ? fonts.uiBold : fonts.uiSemiBold, fontSize: 11, color }}>{LABELS[route.name]}</Text>
        ),
        tabBarIcon: ({ focused, color }) => <IconoTab nombre={route.name} focused={focused} color={color} />,
      })}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Viajes" component={ViajesScreen} />
      <Tab.Screen
        name="Nuevo"
        component={SinPantalla}
        options={{ tabBarAccessibilityLabel: 'Nuevo viaje' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('NuevoViaje'); },
        })}
      />
      <Tab.Screen name="Alertas" component={AlertasScreen} />
      <Tab.Screen name="Mas" component={MasScreen} />
    </Tab.Navigator>
  );
}

// Detalles y formularios van sobre las pestañas, sin barra abajo: la acción
// principal ocupa ese lugar.
export default function PymeStack() {
  return (
    <EmpresaProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Pestanas" component={Pestanas} />
        <Stack.Screen name="NuevoViaje" component={NuevoViajeScreen} />
        <Stack.Screen name="Viaje" component={ViajeScreen} />
        <Stack.Screen name="Conductores" component={ConductoresScreen} />
        <Stack.Screen name="Conductor" component={ConductorScreen} />
        <Stack.Screen name="Invitar" component={InvitarScreen} />
        <Stack.Screen name="Lugares" component={LugaresScreen} />
        <Stack.Screen name="Lugar" component={LugarScreen} />
        <Stack.Screen name="Series" component={SeriesScreen} />
        <Stack.Screen name="Serie" component={SerieScreen} />
        <Stack.Screen name="Equipo" component={EquipoScreen} />
        <Stack.Screen name="DatosEmpresa" component={DatosEmpresaScreen} />
        <Stack.Screen name="MisDatos" component={MisDatosScreen} />
      </Stack.Navigator>
    </EmpresaProvider>
  );
}

const s = StyleSheet.create({
  nuevo:      { width: 40, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badge:      { position: 'absolute', top: -6, right: -10, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  badgeTexto: { fontFamily: fonts.uiBold, fontSize: 10.5, lineHeight: 13 },
});
