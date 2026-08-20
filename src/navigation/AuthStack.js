import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterClienteScreen from '../screens/auth/RegisterClienteScreen';
import RegisterFleteroScreen from '../screens/auth/RegisterFleteroScreen';
import RegisterGerenteScreen from '../screens/auth/RegisterGerenteScreen';
import CuentaPendienteScreen from '../screens/auth/CuentaPendienteScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterCliente" component={RegisterClienteScreen} />
      <Stack.Screen name="RegisterFletero" component={RegisterFleteroScreen} />
      <Stack.Screen name="RegisterGerente" component={RegisterGerenteScreen} />
      <Stack.Screen name="CuentaPendiente" component={CuentaPendienteScreen} />
    </Stack.Navigator>
  );
}
