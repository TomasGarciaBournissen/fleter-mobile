import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { obtenerOrganizacion, editarOrganizacion } from '../../services/empresa';
import { formatearCuit, soloDigitos } from '../../utils/formularios';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Bajada, Campo, Boton, Nota } from '../../components/ui';

// Datos de la empresa (los que salen en el remito). Los ve todo el equipo;
// solo un responsable los edita (el backend responde 403 a un miembro).
export default function DatosEmpresaScreen({ navigation }) {
  const { colors } = useTheme();
  const { refrescarUsuario } = useAuth();
  const { idOrg, esResponsable } = useEmpresa();
  const [f, setF] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    obtenerOrganizacion(idOrg)
      .then((o) => setF({ nombre: o.nombre ?? '', cuit: formatearCuit(o.cuit ?? ''), razon_social: o.razon_social ?? '', direccion: o.direccion ?? '' }))
      .catch((e) => setError(mensajeDeError(e, 'No pudimos cargar los datos de la empresa.')));
  }, [idOrg]);

  const cambiar = (k) => (t) => { setOk(false); setF((x) => ({ ...x, [k]: k === 'cuit' ? formatearCuit(t) : t })); };

  const guardar = async () => {
    setError('');
    setGuardando(true);
    try {
      await editarOrganizacion(idOrg, f);
      await refrescarUsuario().catch(() => {});
      setOk(true);
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos guardar los cambios. Probá de nuevo.'));
    } finally {
      setGuardando(false);
    }
  };

  const valido = f && f.nombre.trim() && soloDigitos(f.cuit).length === 11;

  return (
    <Pantalla onVolver={() => navigation.goBack()}
      pie={esResponsable && f ? <Boton titulo="Guardar los cambios" onPress={guardar} cargando={guardando} deshabilitado={!valido} /> : null}>
      <Titulo>Datos de la empresa</Titulo>
      <Bajada>Salen en el encabezado de cada remito.</Bajada>
      {!f && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}
      {f ? (
        <>
          <Campo label="Nombre" value={f.nombre} onChangeText={cambiar('nombre')} editable={esResponsable} />
          <Campo label="CUIT" mono value={f.cuit} onChangeText={cambiar('cuit')} keyboardType="number-pad" editable={esResponsable} />
          <Campo label="Razón social" opcional value={f.razon_social} onChangeText={cambiar('razon_social')} editable={esResponsable} />
          <Campo label="Dirección" opcional value={f.direccion} onChangeText={cambiar('direccion')} editable={esResponsable} />
          {!esResponsable ? <Nota>Solo un responsable de la empresa puede cambiar estos datos.</Nota> : null}
        </>
      ) : null}
      {ok ? <Nota tipo="ok">Listo, guardamos los cambios.</Nota> : null}
      {error ? <Nota tipo="error">{error}</Nota> : null}
    </Pantalla>
  );
}
