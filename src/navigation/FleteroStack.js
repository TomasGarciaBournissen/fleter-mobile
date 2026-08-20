import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../theme';

import DisponiblesScreen       from '../screens/fletero/DisponiblesScreen';
import AsignadosScreen         from '../screens/fletero/AsignadosScreen';
import DetalleViajeScreen      from '../screens/fletero/DetalleViajeScreen';
import ViajeActivoFleteroScreen from '../screens/fletero/ViajeActivoFleteroScreen';
import QREntregaScreen         from '../screens/fletero/QREntregaScreen';
import CobroScreen             from '../screens/fletero/CobroScreen';
import HistorialFleteroScreen  from '../screens/fletero/HistorialFleteroScreen';
import PerfilFleteroScreen     from '../screens/fletero/PerfilFleteroScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack interno para el flujo de viaje (parte de la tab Disponibles)
function DisponiblesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DisponiblesHome" component={DisponiblesScreen} />
      <Stack.Screen name="DetalleViaje"    component={DetalleViajeScreen} />
      <Stack.Screen name="ViajeActivo"     component={ViajeActivoFleteroScreen} />
      <Stack.Screen name="QREntrega"       component={QREntregaScreen} />
      <Stack.Screen name="Cobro"           component={CobroScreen} />
    </Stack.Navigator>
  );
}

// Stack interno para viajes asignados por una empresa
function AsignadosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AsignadosHome" component={AsignadosScreen} />
      <Stack.Screen name="ViajeActivo"    component={ViajeActivoFleteroScreen} />
      <Stack.Screen name="QREntrega"      component={QREntregaScreen} />
      <Stack.Screen name="Cobro"          component={CobroScreen} />
    </Stack.Navigator>
  );
}

export default function FleteroStack() {
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
        component={DisponiblesStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'car' : 'car-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Asignados"
        component={AsignadosStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Historial"
        component={HistorialFleteroScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilFleteroScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
