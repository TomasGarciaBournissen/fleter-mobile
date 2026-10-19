import React, { useState } from 'react';
import { canjearCodigo } from '../../services/organizaciones';
import { mensajeDeError } from '../../utils/errores';
import { limpiarCodigo } from '../../utils/formularios';
import { Pantalla, Titulo, Bajada, CampoCodigo, Meta, Nota, Boton } from '../../components/ui';

// Opcional, con la cuenta ya creada: el canje necesita estar logueado.
export default function CodigoConductorScreen({ navigation, route }) {
  const vehiculo = route.params?.vehiculo ?? null;
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const vincular = async () => {
    setError('');
    setCargando(true);
    try {
      const { organizacion } = await canjearCodigo(codigo);
      navigation.reset({ index: 0, routes: [{ name: 'ConductorListo', params: { organizacion, vehiculo } }] });
    } catch (err) {
      setError(mensajeDeError(err));
      setCargando(false);
    }
  };

  return (
    <Pantalla
      pie={
        <>
          <Boton titulo="Vincularme" onPress={vincular} cargando={cargando} deshabilitado={limpiarCodigo(codigo).length < 10} />
          <Boton titulo="Lo hago después" variante="fantasma"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'ConductorListo', params: { organizacion: null, vehiculo } }] })} />
        </>
      }
    >
      <Titulo style={{ marginTop: 28 }}>Sumate a tu empresa</Titulo>
      <Bajada>Pedile el código a la empresa con la que trabajás. Con eso empezás a recibir sus viajes.</Bajada>
      <CampoCodigo value={codigo} onChange={(c) => { setCodigo(c); setError(''); }} accessibilityLabel="Código de invitación de la empresa" />
      {error ? <Nota tipo="error">{error}</Nota> : <Meta style={{ marginTop: 8 }}>Si trabajás con varias empresas, sumás las otras después desde tu perfil.</Meta>}
      <Nota tipo="info">Cada empresa ve solo los viajes que te asigna ella, nunca los de las otras.</Nota>
    </Pantalla>
  );
}
