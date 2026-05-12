import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DisponiblesScreen from '../screens/fletero/DisponiblesScreen';
import DetalleViajeScreen from '../screens/fletero/DetalleViajeScreen';
import OfertaScreen from '../screens/fletero/OfertaScreen';
import ViajeActivoFleteroScreen from '../screens/fletero/ViajeActivoFleteroScreen';
import QREntregaScreen from '../screens/fletero/QREntregaScreen';
import CobroScreen from '../screens/fletero/CobroScreen';

const Stack = createNativeStackNavigator();

export default function FleteroStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Disponibles" component={DisponiblesScreen} />
      <Stack.Screen name="DetalleViaje" component={DetalleViajeScreen} />
      <Stack.Screen name="Oferta" component={OfertaScreen} />
      <Stack.Screen name="ViajeActivo" component={ViajeActivoFleteroScreen} />
      <Stack.Screen name="QREntrega" component={QREntregaScreen} />
      <Stack.Screen name="Cobro" component={CobroScreen} />
    </Stack.Navigator>
  );
}
