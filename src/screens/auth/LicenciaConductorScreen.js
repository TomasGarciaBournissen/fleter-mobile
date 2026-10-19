import React, { useState } from 'react';
import { Pantalla, Pasos, Titulo, Bajada, Campo, Boton, HojaCalendario } from '../../components/ui';
import { fechaCorta, soloDigitos } from '../../utils/formularios';

// Paso 2 de 3: número y vencimiento de la licencia (requeridos por
// /api/auth/registro-conductor). La fecha se elige en la hoja de calendario.
export default function LicenciaConductorScreen({ navigation, route }) {
  const { personales } = route.params;
  const [numero, setNumero] = useState(soloDigitos(personales.dni));
  const [vencimiento, setVencimiento] = useState(null);
  const [calendario, setCalendario] = useState(false);
  const [errores, setErrores] = useState({});
  const hoy = new Date();

  const seguir = () => {
    const e = {};
    if (numero.trim().length < 5) e.numero = 'Copiá el número tal como figura en la licencia.';
    if (!vencimiento) e.vencimiento = 'Elegí la fecha de vencimiento.';
    else if (vencimiento < hoy) e.vencimiento = 'La licencia está vencida. Renovala para poder hacer viajes.';
    setErrores(e);
    if (Object.keys(e).length) return;
    navigation.navigate('VehiculoConductor', {
      personales,
      licencia: { nro_licencia: numero.trim(), licencia_vencimiento: vencimiento.toISOString() },
    });
  };

  return (
    <Pantalla onVolver={() => navigation.goBack()} pieConLinea pie={<Boton titulo="Seguir con el vehículo" onPress={seguir} />}>
      <Pasos actual={2} total={3} etiqueta="tu licencia" />
      <Titulo>Tu licencia de conducir</Titulo>
      <Bajada>Copiá los datos tal como figuran en la licencia.</Bajada>
      <Campo
        style={{ marginTop: 22 }}
        label="Número de licencia"
        mono
        value={numero}
        onChangeText={(t) => { setNumero(t); setErrores((e) => ({ ...e, numero: '' })); }}
        autoCapitalize="characters"
        hint="En la mayoría de las licencias es tu DNI."
        error={errores.numero}
      />
      <Campo
        label="Vencimiento"
        mono
        icono="calendar-blank-outline"
        value={fechaCorta(vencimiento)}
        placeholder="Elegí la fecha"
        onPress={() => setCalendario(true)}
        error={errores.vencimiento}
      />
      <HojaCalendario
        visible={calendario}
        titulo="Vencimiento de la licencia"
        valor={vencimiento}
        minimo={hoy}
        onCerrar={() => setCalendario(false)}
        onElegir={(d) => { setVencimiento(d); setCalendario(false); setErrores((e) => ({ ...e, vencimiento: '' })); }}
      />
    </Pantalla>
  );
}
