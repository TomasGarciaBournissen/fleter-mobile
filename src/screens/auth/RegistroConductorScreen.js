import React from 'react';
import { Pantalla, Pasos, Titulo, Boton } from '../../components/ui';
import CamposPersonales from './CamposPersonales';
import useDatosPersonales from './useDatosPersonales';

// Paso 1 de 3 del alta de conductor. La cuenta se crea recién en el paso 3
// (vehículo), así que acá solo se valida y se pasa al paso siguiente.
export default function RegistroConductorScreen({ navigation }) {
  const form = useDatosPersonales();

  const seguir = () => {
    if (!form.validar()) return;
    navigation.navigate('LicenciaConductor', { personales: form.body() });
  };

  return (
    <Pantalla onVolver={() => navigation.goBack()} pieConLinea pie={<Boton titulo="Seguir con la licencia" onPress={seguir} />}>
      <Pasos actual={1} total={3} etiqueta="tus datos" />
      <Titulo>Creá tu cuenta de conductor</Titulo>
      <CamposPersonales form={form} hintTelefono="Para que la empresa te pueda llamar durante un viaje." />
    </Pantalla>
  );
}
