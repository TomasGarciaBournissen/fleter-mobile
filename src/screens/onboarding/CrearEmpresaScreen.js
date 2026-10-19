import React, { useState } from 'react';
import { crearOrganizacion } from '../../services/organizaciones';
import { mensajeDeError } from '../../utils/errores';
import { formatearCuit, soloDigitos } from '../../utils/formularios';
import { Pantalla, Titulo, Bajada, Campo, Boton, Nota } from '../../components/ui';

// POST /api/organizaciones: quien la crea queda como RESPONSABLE y la empresa
// arranca en período de prueba (estado TRIAL). El CUIT vuelve normalizado.
export default function CrearEmpresaScreen({ navigation }) {
  const [f, setF] = useState({ nombre: '', cuit: '', razon_social: '', direccion: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambiar = (k) => (t) => {
    setF((x) => ({ ...x, [k]: k === 'cuit' ? formatearCuit(t) : t }));
    setErrores((e) => ({ ...e, [k]: '' }));
  };

  const registrar = async () => {
    setError('');
    const e = {};
    if (!f.nombre.trim()) e.nombre = 'Escribí el nombre de la empresa.';
    if (soloDigitos(f.cuit).length !== 11) e.cuit = 'El CUIT tiene 11 números.';
    setErrores(e);
    if (Object.keys(e).length) return;
    setCargando(true);
    try {
      const org = await crearOrganizacion(f);
      // El perfil se refresca al salir de la pantalla de cierre, no antes:
      // si no, RootNavigator saltaría directo al inicio sin mostrarla.
      navigation.reset({ index: 0, routes: [{ name: 'EmpresaRegistrada', params: { organizacion: org } }] });
    } catch (err) {
      const msg = mensajeDeError(err);
      if (/CUIT/.test(msg)) setErrores((x) => ({ ...x, cuit: msg }));
      else setError(msg);
      setCargando(false);
    }
  };

  return (
    <Pantalla onVolver={() => navigation.goBack()} pieConLinea pie={<Boton titulo="Registrar empresa" onPress={registrar} cargando={cargando} />}>
      <Titulo>Datos de tu empresa</Titulo>
      <Bajada>Van a aparecer en los remitos de cada viaje.</Bajada>
      <Campo style={{ marginTop: 22 }} label="Nombre" value={f.nombre} onChangeText={cambiar('nombre')}
        hint="Como la conocen tus conductores." error={errores.nombre} autoCapitalize="words" />
      <Campo label="CUIT" mono value={f.cuit} onChangeText={cambiar('cuit')} keyboardType="number-pad"
        placeholder="11 números, con o sin guiones" error={errores.cuit} />
      <Campo label="Razón social" opcional value={f.razon_social} onChangeText={cambiar('razon_social')} autoCapitalize="words" />
      <Campo label="Dirección" opcional icono="map-marker-outline" value={f.direccion} onChangeText={cambiar('direccion')}
        placeholder="Calle, número y localidad" />
      {error ? <Nota tipo="error">{error}</Nota> : null}
    </Pantalla>
  );
}
