import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RecuperarContrasenaScreen from '../screens/auth/RecuperarContrasenaScreen';
import TipoCuentaScreen from '../screens/auth/TipoCuentaScreen';
import RegistroEmpresaScreen from '../screens/auth/RegistroEmpresaScreen';
import RegistroConductorScreen from '../screens/auth/RegistroConductorScreen';
import LicenciaConductorScreen from '../screens/auth/LicenciaConductorScreen';
import VehiculoConductorScreen from '../screens/auth/VehiculoConductorScreen';
import CodigoConductorScreen from '../screens/auth/CodigoConductorScreen';
import ConductorListoScreen from '../screens/auth/ConductorListoScreen';

const Stack = createNativeStackNavigator();

// Entrada y alta. Las pantallas del marketplace quedan archivadas en
// screens/auth/_marketplace.
export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RecuperarContrasena" component={RecuperarContrasenaScreen} />
      <Stack.Screen name="TipoCuenta" component={TipoCuentaScreen} />
      <Stack.Screen name="RegistroEmpresa" component={RegistroEmpresaScreen} />
      <Stack.Screen name="RegistroConductor" component={RegistroConductorScreen} />
      <Stack.Screen name="LicenciaConductor" component={LicenciaConductorScreen} />
      <Stack.Screen name="VehiculoConductor" component={VehiculoConductorScreen} />
      <Stack.Screen name="CodigoConductor" component={CodigoConductorScreen} />
      <Stack.Screen name="ConductorListo" component={ConductorListoScreen} />
    </Stack.Navigator>
  );
}
