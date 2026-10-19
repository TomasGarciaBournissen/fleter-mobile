import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SinEmpresaScreen from '../screens/onboarding/SinEmpresaScreen';
import CrearEmpresaScreen from '../screens/onboarding/CrearEmpresaScreen';
import CodigoMiembroScreen from '../screens/onboarding/CodigoMiembroScreen';
import EmpresaRegistradaScreen from '../screens/onboarding/EmpresaRegistradaScreen';

const Stack = createNativeStackNavigator();

// Cuenta de empresa sin empresa (organizacion: null): registrarla o sumarse.
export default function OnboardingEmpresaStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SinEmpresa" component={SinEmpresaScreen} />
      <Stack.Screen name="CrearEmpresa" component={CrearEmpresaScreen} />
      <Stack.Screen name="CodigoMiembro" component={CodigoMiembroScreen} />
      <Stack.Screen name="EmpresaRegistrada" component={EmpresaRegistradaScreen} />
    </Stack.Navigator>
  );
}
