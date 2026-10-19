import React, { useState } from 'react';
import { crearVehiculoPropio } from '../../services/vehiculos';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Boton, Nota } from '../../components/ui';
import CamposVehiculo, { useFormVehiculo } from '../../components/FormVehiculo';

// Agregar un vehículo propio desde el perfil (mismo formulario que el alta).
export default function NuevoVehiculoScreen({ navigation }) {
  const form = useFormVehiculo();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    setError('');
    if (!form.validar()) return;
    setCargando(true);
    try {
      await crearVehiculoPropio(form.datos());
      navigation.goBack();
    } catch (err) {
      const msg = mensajeDeError(err);
      if (/patente/i.test(msg)) form.setErrores((e) => ({ ...e, patente: msg }));
      else setError(msg);
      setCargando(false);
    }
  };

  return (
    <Pantalla onVolver={() => navigation.goBack()} pieConLinea pie={<Boton titulo="Guardar vehículo" onPress={guardar} cargando={cargando} />}>
      <Titulo>Agregar vehículo</Titulo>
      <CamposVehiculo form={form} />
      {error ? <Nota tipo="error">{error}</Nota> : null}
    </Pantalla>
  );
}
