import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import DisponiblesGerenteScreen from '../screens/gerente/DisponiblesGerenteScreen';
import DetalleViajeGerenteScreen from '../screens/gerente/DetalleViajeGerenteScreen';
import AsignarConductorScreen   from '../screens/gerente/AsignarConductorScreen';
import ViajeActivoGerenteScreen from '../screens/gerente/ViajeActivoGerenteScreen';
import EmpresaHomeScreen        from '../screens/gerente/EmpresaHomeScreen';
import FlotaScreen              from '../screens/gerente/FlotaScreen';
import ConductoresScreen        from '../screens/gerente/ConductoresScreen';
import HistorialEmpresaScreen   from '../screens/gerente/HistorialEmpresaScreen';
import PerfilGerenteScreen      from '../screens/gerente/PerfilGerenteScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack interno para el flujo de reservar/asignar un viaje (parte de la tab Disponibles)
function DisponiblesGerenteStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DisponiblesGerenteHome" component={DisponiblesGerenteScreen} />
      <Stack.Screen name="DetalleViajeGerente"     component={DetalleViajeGerenteScreen} />
      <Stack.Screen name="AsignarConductor"        component={AsignarConductorScreen} />
      <Stack.Screen name="ViajeActivoGerente"      component={ViajeActivoGerenteScreen} />
    </Stack.Navigator>
  );
}

// Stack interno para la gestión de la empresa (parte de la tab Empresa)
function EmpresaStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EmpresaHome"        component={EmpresaHomeScreen} />
      <Stack.Screen name="Flota"              component={FlotaScreen} />
      <Stack.Screen name="Conductores"        component={ConductoresScreen} />
      <Stack.Screen name="AsignarConductor"   component={AsignarConductorScreen} />
      <Stack.Screen name="ViajeActivoGerente" component={ViajeActivoGerenteScreen} />
    </Stack.Navigator>
  );
}

export default function GerenteStack() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface1,
          borderTopColor: colors.surface3,
          borderTopWidth: 1,
          height: 80,
          paddingTop: 6,
          paddingBottom: 24,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textHint,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Disponibles"
        component={DisponiblesGerenteStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'car' : 'car-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Empresa"
        component={EmpresaStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'business' : 'business-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Historial"
        component={HistorialEmpresaScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilGerenteScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
