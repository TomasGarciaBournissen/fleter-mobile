import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Pantalla, Pasos, Titulo, Bajada, Opcion, Boton } from '../../components/ui';

// Lo ve una cuenta de empresa sin empresa (`organizacion: null` en /me)
// cada vez que entra, hasta que registra la suya o se suma con un código.
export default function SinEmpresaScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [opcion, setOpcion] = useState('REGISTRAR');

  return (
    <Pantalla
      pie={
        <>
          <Boton
            titulo={opcion === 'REGISTRAR' ? 'Registrar mi empresa' : 'Ingresar el código'}
            onPress={() => navigation.navigate(opcion === 'REGISTRAR' ? 'CrearEmpresa' : 'CodigoMiembro')}
          />
          <Boton titulo="Salir de la cuenta" variante="fantasma" onPress={logout} />
        </>
      }
    >
      <View style={{ marginTop: 12 }}><Pasos actual={2} total={2} etiqueta="tu empresa" /></View>
      <Titulo>{user?.nombre ? `Hola, ${user.nombre}. ` : ''}¿Tu empresa ya usa Fleter?</Titulo>
      <Bajada>Los viajes, los conductores y los lugares se guardan en la cuenta de la empresa.</Bajada>
      <View style={{ gap: 12, marginTop: 24 }} accessibilityRole="radiogroup">
        <Opcion
          icono="plus"
          titulo="No, la registro yo"
          descripcion="Cargás los datos de la empresa y quedás como responsable. Después invitás a tu equipo y a tus conductores."
          seleccionada={opcion === 'REGISTRAR'}
          onPress={() => setOpcion('REGISTRAR')}
        />
        <Opcion
          icono="key-variant"
          titulo="Sí, tengo un código"
          descripcion="Alguien de tu empresa ya la registró y te pasó un código de invitación."
          seleccionada={opcion === 'CODIGO'}
          onPress={() => setOpcion('CODIGO')}
        />
      </View>
    </Pantalla>
  );
}
