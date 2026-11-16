import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { cambiarPermisos, transferirEmpresa, eliminarMiembro } from '../../services/empresa';
import { efectivos } from '../../utils/permisos';
import { diaCorto } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Bajada, Seccion, Nota, Boton, HojaInferior } from '../../components/ui';
import ElegirPermisos from '../../components/empresa/ElegirPermisos';

const nombreDe = (m) => [m.nombre, m.apellido].filter(Boolean).join(' ');
const mismos = (a, b) => [...efectivos(a)].sort().join() === [...efectivos(b)].sort().join();

// Una persona del equipo, vista por el dueño: qué puede hacer (permisos),
// pasarle la empresa o sacarla. Solo la abre el dueño (EquipoScreen).
export default function MiembroScreen({ navigation, route }) {
  const { miembro: m } = route.params;
  const { refrescarUsuario } = useAuth();
  const { idOrg } = useEmpresa();
  const inicial = [...efectivos(m.permisos_efectivos ?? m.permisos)];
  const [permisos, setPermisos] = useState(inicial);
  const [hoja, setHoja] = useState(null); // 'transferir' | 'sacar'
  const [accion, setAccion] = useState(null);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const nombre = nombreDe(m);

  const hacer = async (que, fn) => {
    setAccion(que);
    setError('');
    try {
      await fn();
      return true;
    } catch (e) {
      setHoja(null);
      setError(mensajeDeError(e));
      return false;
    } finally {
      setAccion(null);
    }
  };

  const guardar = async () => {
    if (await hacer('guardar', () => cambiarPermisos(idOrg, m.id_usuario, permisos))) setGuardado(true);
  };
  const transferir = async () => {
    if (await hacer('transferir', () => transferirEmpresa(idOrg, m.id_usuario))) {
      setHoja(null);
      await refrescarUsuario().catch(() => {});
      navigation.goBack();
    }
  };
  const sacar = async () => {
    if (await hacer('sacar', () => eliminarMiembro(idOrg, m.id_usuario))) {
      setHoja(null);
      navigation.goBack();
    }
  };

  const cambio = !mismos(permisos, inicial) && !guardado;

  return (
    <Pantalla onVolver={() => navigation.goBack()}
      pie={<Boton titulo="Guardar los permisos" onPress={guardar} cargando={accion === 'guardar'} deshabilitado={!cambio} />}>
      <Titulo>{nombre}</Titulo>
      <Bajada>{[m.email, m.fecha_alta ? `En el equipo desde el ${diaCorto(m.fecha_alta)}.` : null].filter(Boolean).join('\n')}</Bajada>
      {error ? <Nota tipo="error">{error}</Nota> : null}
      {guardado && !cambio ? <Nota tipo="ok">Listo: {m.nombre} ya ve los cambios en su app.</Nota> : null}

      <Seccion titulo="Qué puede hacer">
        <ElegirPermisos valor={permisos} onCambiar={(p) => { setPermisos(p); setGuardado(false); }} />
        {!permisos.length ? <Nota>Sin permisos solo ve el nombre de la empresa, quién es el dueño y el equipo.</Nota> : null}
      </Seccion>

      <Seccion titulo="Más opciones">
        <View style={{ gap: 10 }}>
          <Boton titulo={`Pasarle la empresa a ${m.nombre}`} variante="borde" onPress={() => setHoja('transferir')} />
          <Boton titulo="Sacar del equipo" variante="fantasma" onPress={() => setHoja('sacar')} />
        </View>
      </Seccion>

      <HojaInferior visible={hoja === 'transferir'} titulo={`¿Pasarle la empresa a ${m.nombre}?`} onCerrar={() => setHoja(null)}
        bajada={`La empresa pasa a ser de ${m.nombre}: invita y saca personas, elige los permisos y edita los datos de la empresa. Vos seguís en el equipo con todos los permisos, pero ya no podés cambiar nada de eso. Solo ${m.nombre} te la puede devolver.`}>
        <Boton titulo="Pasarle la empresa" variante="peligro" cargando={accion === 'transferir'} onPress={transferir} />
        <Boton titulo="Volver" variante="fantasma" onPress={() => setHoja(null)} />
      </HojaInferior>

      <HojaInferior visible={hoja === 'sacar'} titulo={`¿Sacar a ${m.nombre} del equipo?`} onCerrar={() => setHoja(null)}
        bajada="Deja de ver la empresa al instante. Para volver, le tenés que pasar un código nuevo.">
        <Boton titulo="Sacar del equipo" variante="peligro" cargando={accion === 'sacar'} onPress={sacar} />
        <Boton titulo="Volver" variante="fantasma" onPress={() => setHoja(null)} />
      </HojaInferior>
    </Pantalla>
  );
}
