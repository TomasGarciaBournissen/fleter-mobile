import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canjearCodigo } from '../../services/organizaciones';
import { mensajeDeError } from '../../utils/errores';
import { limpiarCodigo } from '../../utils/formularios';
import { Pantalla, Titulo, Bajada, CampoCodigo, Meta, Nota, Boton } from '../../components/ui';

// Sumar otra empresa desde el perfil con su código de invitación.
export default function SumarEmpresaScreen({ navigation }) {
  const { refrescarUsuario } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [sumada, setSumada] = useState(null);

  const vincular = async () => {
    setError('');
    setCargando(true);
    try {
      const { organizacion } = await canjearCodigo(codigo);
      setSumada(organizacion);
      refrescarUsuario().catch(() => {});
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  };

  if (sumada) {
    return (
      <Pantalla pie={<Boton titulo="Volver al perfil" onPress={() => navigation.goBack()} />}>
        <Titulo style={{ marginTop: 28 }}>Ya trabajás con {sumada.nombre}</Titulo>
        <Bajada>Cuando te asignen un viaje te va a aparecer en Viajes para que lo confirmes.</Bajada>
      </Pantalla>
    );
  }

  return (
    <Pantalla
      onVolver={() => navigation.goBack()}
      pie={<Boton titulo="Vincularme" onPress={vincular} cargando={cargando} deshabilitado={limpiarCodigo(codigo).length < 10} />}
    >
      <Titulo>Sumar una empresa</Titulo>
      <Bajada>Ingresá el código que te pasó la empresa. Sirve una sola vez y vence a las 72 horas.</Bajada>
      <CampoCodigo value={codigo} onChange={(c) => { setCodigo(c); setError(''); }} autoFocus accessibilityLabel="Código de invitación de la empresa" />
      {error ? <Nota tipo="error">{error}</Nota> : <Meta style={{ marginTop: 8 }}>Podés pegarlo tal cual te llegó, con o sin guion.</Meta>}
    </Pantalla>
  );
}
