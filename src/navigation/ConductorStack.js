import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../theme';
import ViajesScreen from '../screens/conductor/ViajesScreen';
import HistorialScreen from '../screens/conductor/HistorialScreen';
import PerfilScreen from '../screens/conductor/PerfilScreen';
import DetalleViajeScreen from '../screens/conductor/DetalleViajeScreen';
import ViajeActivoScreen from '../screens/conductor/ViajeActivoScreen';
import ViajeTerminadoScreen from '../screens/conductor/ViajeTerminadoScreen';
import EmpresaConductorScreen from '../screens/conductor/EmpresaConductorScreen';
import SumarEmpresaScreen from '../screens/conductor/SumarEmpresaScreen';
import NuevoVehiculoScreen from '../screens/conductor/NuevoVehiculoScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONOS = { Viajes: 'format-list-bulleted', Historial: 'clock-outline', Perfil: 'account-outline' };

// Pestañas del conductor: Viajes · Historial · Perfil. Ítem activo: ícono
// naranja y label en tinta 700 (UXUI.md).
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
          <Text style={{ fontFamily: focused ? fonts.uiBold : fonts.uiSemiBold, fontSize: 11, color }}>{route.name}</Text>
        ),
        tabBarIcon: ({ focused, color }) => (
          <MaterialCommunityIcons name={ICONOS[route.name]} size={22} color={focused ? colors.accent : color} />
        ),
      })}
    >
      <Tab.Screen name="Viajes" component={ViajesScreen} />
      <Tab.Screen name="Historial" component={HistorialScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

// Las pantallas de un viaje van sobre las pestañas (sin barra abajo):
// la acción principal del viaje ocupa ese lugar.
export default function ConductorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Pestanas" component={Pestanas} />
      <Stack.Screen name="DetalleViaje" component={DetalleViajeScreen} />
      <Stack.Screen name="ViajeActivo" component={ViajeActivoScreen} />
      <Stack.Screen name="ViajeTerminado" component={ViajeTerminadoScreen} />
      <Stack.Screen name="EmpresaConductor" component={EmpresaConductorScreen} />
      <Stack.Screen name="SumarEmpresa" component={SumarEmpresaScreen} />
      <Stack.Screen name="NuevoVehiculo" component={NuevoVehiculoScreen} />
    </Stack.Navigator>
  );
}
