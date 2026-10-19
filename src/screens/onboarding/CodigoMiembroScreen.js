import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canjearCodigo } from '../../services/organizaciones';
import { mensajeDeError } from '../../utils/errores';
import { limpiarCodigo } from '../../utils/formularios';
import { Pantalla, Titulo, Bajada, CampoCodigo, Meta, Nota, Boton } from '../../components/ui';

// Sumarse como MIEMBRO con el código que generó un responsable.
// Al canjearlo se refresca el perfil y RootNavigator lleva al inicio.
export default function CodigoMiembroScreen({ navigation }) {
  const { refrescarUsuario } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const sumarme = async () => {
    setError('');
    setCargando(true);
    try {
      await canjearCodigo(codigo);
      await refrescarUsuario();
    } catch (err) {
      setError(mensajeDeError(err));
      setCargando(false);
    }
  };

  return (
    <Pantalla
      onVolver={() => navigation.goBack()}
      pie={<Boton titulo="Sumarme a la empresa" onPress={sumarme} cargando={cargando} deshabilitado={limpiarCodigo(codigo).length < 10} />}
    >
      <Titulo>Ingresá el código</Titulo>
      <Bajada>Te lo pasa un responsable de tu empresa. Sirve una sola vez y vence a las 72 horas.</Bajada>
      <CampoCodigo value={codigo} onChange={(c) => { setCodigo(c); setError(''); }} autoFocus />
      {error ? <Nota tipo="error">{error}</Nota> : <Meta style={{ marginTop: 8 }}>Podés pegarlo tal cual te llegó, con o sin guion.</Meta>}
    </Pantalla>
  );
}
