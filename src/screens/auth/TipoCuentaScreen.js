import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Pantalla, Titulo, Opcion, Nota, Boton } from '../../components/ui';

// El rol de la cuenta no cambia después del registro (API.md), por eso
// el aviso de las dos cuentas y un botón que dice qué cuenta se crea.
export default function TipoCuentaScreen({ navigation }) {
  const [tipo, setTipo] = useState('EMPRESA');
  const { setRolEnAlta } = useAuth();
  // Al volver a esta pantalla el tema vuelve al de la entrada
  useFocusEffect(useCallback(() => { setRolEnAlta(null); }, [setRolEnAlta]));

  return (
    <Pantalla
      onVolver={() => navigation.goBack()}
      pie={
        <Boton
          titulo={tipo === 'EMPRESA' ? 'Crear cuenta de empresa' : 'Crear cuenta de conductor'}
          onPress={() => {
            setRolEnAlta(tipo === 'EMPRESA' ? 'CLIENTE' : 'CONDUCTOR');
            navigation.navigate(tipo === 'EMPRESA' ? 'RegistroEmpresa' : 'RegistroConductor');
          }}
        />
      }
    >
      <Titulo>¿Cómo vas a usar Fleter?</Titulo>
      <View style={{ gap: 12, marginTop: 24 }} accessibilityRole="radiogroup">
        <Opcion
          icono="office-building-outline"
          titulo="Trabajo en una empresa"
          descripcion="Cargo los viajes, se los asigno a nuestros conductores y los sigo en vivo."
          seleccionada={tipo === 'EMPRESA'}
          onPress={() => setTipo('EMPRESA')}
        />
        <Opcion
          icono="steering"
          titulo="Soy conductor"
          descripcion="Recibo los viajes de las empresas con las que trabajo y los hago con la app. Es gratis."
          seleccionada={tipo === 'CONDUCTOR'}
          onPress={() => setTipo('CONDUCTOR')}
        />
      </View>
      <Nota>Si hacés las dos cosas, vas a necesitar dos cuentas con emails distintos.</Nota>
    </Pantalla>
  );
}
