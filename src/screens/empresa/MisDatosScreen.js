import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { editarPerfil } from '../../services/empresa';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Campo, Boton, Nota } from '../../components/ui';

// Mis datos: nombre, apellido y teléfono (PUT /api/auth/perfil). El email es
// el de la cuenta y no se cambia desde acá.
export default function MisDatosScreen({ navigation }) {
  const { user, refrescarUsuario } = useAuth();
  const [f, setF] = useState({ nombre: user?.nombre ?? '', apellido: user?.apellido ?? '', telefono: user?.telefono ?? '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const cambiar = (k) => (t) => { setOk(false); setF((x) => ({ ...x, [k]: t })); };

  const guardar = async () => {
    setError('');
    setGuardando(true);
    try {
      await editarPerfil(f);
      await refrescarUsuario().catch(() => {});
      setOk(true);
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos guardar tus datos. Probá de nuevo.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Pantalla onVolver={() => navigation.goBack()}
      pie={<Boton titulo="Guardar" onPress={guardar} cargando={guardando} deshabilitado={!f.nombre.trim() || !f.apellido.trim()} />}>
      <Titulo>Mis datos</Titulo>
      <Campo label="Nombre" value={f.nombre} onChangeText={cambiar('nombre')} autoCapitalize="words" />
      <Campo label="Apellido" value={f.apellido} onChangeText={cambiar('apellido')} autoCapitalize="words" />
      <Campo label="Teléfono" opcional value={f.telefono} onChangeText={cambiar('telefono')} keyboardType="phone-pad" placeholder="+54 9 11 …" />
      <Campo label="Email" value={user?.email} editable={false} hint="Es el de tu cuenta: no se cambia desde acá." />
      {ok ? <Nota tipo="ok">Listo, guardamos tus datos.</Nota> : null}
      {error ? <Nota tipo="error">{error}</Nota> : null}
    </Pantalla>
  );
}
