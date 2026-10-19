import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { registroConductor } from '../../services/auth';
import { crearVehiculoPropio } from '../../services/vehiculos';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Pasos, Titulo, Boton, Nota } from '../../components/ui';
import CamposVehiculo, { useFormVehiculo } from '../../components/FormVehiculo';

// Paso 3 de 3: vehículo y condiciones. «Crear mi cuenta» registra al
// conductor y, si cargó el vehículo, lo da de alta. Sin vehículo no le
// pueden asignar viajes, pero puede cargarlo después desde el perfil.
export default function VehiculoConductorScreen({ navigation, route }) {
  const { personales, licencia } = route.params;
  const { setAltaEnCurso } = useAuth();
  const form = useFormVehiculo();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(null); // 'con' | 'sin'
  // Si la cuenta ya se creó y falló el vehículo, reintentar solo el vehículo
  const [cuentaCreada, setCuentaCreada] = useState(false);

  const crear = async (conVehiculo) => {
    setError('');
    if (conVehiculo && !form.validar()) return;
    setCargando(conVehiculo ? 'con' : 'sin');
    let creada = cuentaCreada;
    try {
      if (!creada) {
        setAltaEnCurso(true); // que RootNavigator no salte al stack del conductor todavía
        await registroConductor({ ...personales, ...licencia });
        creada = true;
        setCuentaCreada(true);
      }
      if (conVehiculo) await crearVehiculoPropio(form.datos());
      navigation.reset({
        index: 0,
        routes: [{ name: 'CodigoConductor', params: { vehiculo: conVehiculo ? form.datos() : null } }],
      });
    } catch (err) {
      if (!creada) setAltaEnCurso(false);
      const msg = mensajeDeError(err);
      if (/patente/i.test(msg)) form.setErrores((e) => ({ ...e, patente: msg }));
      else if (creada) setError(`Tu cuenta ya está creada, pero no pudimos guardar el vehículo. ${msg}`);
      else setError(msg);
    } finally {
      setCargando(null);
    }
  };

  return (
    <Pantalla
      onVolver={cuentaCreada ? undefined : () => navigation.goBack()}
      pieConLinea
      pie={
        <>
          <Boton titulo="Crear mi cuenta" onPress={() => crear(true)} cargando={cargando === 'con'} deshabilitado={cargando === 'sin'} />
          <Boton titulo="Cargar el vehículo después" variante="fantasma" onPress={() => crear(false)} cargando={cargando === 'sin'} deshabilitado={cargando === 'con'} />
        </>
      }
    >
      <Pasos actual={3} total={3} etiqueta="tu vehículo" />
      <Titulo>¿Con qué vehículo trabajás?</Titulo>
      <CamposVehiculo form={form} />
      {error ? <Nota tipo="error">{error}</Nota> : null}
    </Pantalla>
  );
}
