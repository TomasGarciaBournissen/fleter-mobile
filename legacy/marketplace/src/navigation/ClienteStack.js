import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/cliente/HomeScreen';
import CrearViajeScreen from '../screens/cliente/CrearViajeScreen';
import ConfirmacionViajeScreen from '../screens/cliente/ConfirmacionViajeScreen';
import BuscandoFleteroScreen from '../screens/cliente/BuscandoFleteroScreen';
import ViajeActivoScreen from '../screens/cliente/ViajeActivoScreen';
import CalificacionScreen from '../screens/cliente/CalificacionScreen';
import HistorialScreen from '../screens/cliente/HistorialScreen';
import PerfilScreen from '../screens/cliente/PerfilScreen';

const Stack = createNativeStackNavigator();

export default function ClienteStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CrearViaje" component={CrearViajeScreen} />
      <Stack.Screen name="ConfirmacionViaje" component={ConfirmacionViajeScreen} />
      <Stack.Screen name="BuscandoFletero" component={BuscandoFleteroScreen} />
      <Stack.Screen name="ViajeActivo" component={ViajeActivoScreen} />
      <Stack.Screen name="Calificacion" component={CalificacionScreen} />
      <Stack.Screen name="Historial" component={HistorialScreen} />
      <Stack.Screen name="Perfil" component={PerfilScreen} />
    </Stack.Navigator>
  );
}
