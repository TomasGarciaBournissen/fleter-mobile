import React, { useState } from 'react';
import { View } from 'react-native';
import { useEmpresa } from '../../context/EmpresaContext';
import { guardarLugar, borrarLugar } from '../../services/empresa';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Campo, Boton, Nota, HojaInferior } from '../../components/ui';
import HojaParada from '../../components/empresa/HojaParada';

// Crear o editar un lugar guardado: nombre (único en la empresa) y dirección
// elegida con la búsqueda. Borrarlo es lógico: los viajes que lo usaron no cambian.
export default function LugarScreen({ navigation, route }) {
  const lugar = route.params?.lugar ?? null;
  const { idOrg } = useEmpresa();
  const [nombre, setNombre] = useState(lugar?.nombre ?? '');
  const [ubicacion, setUbicacion] = useState(lugar ? { direccion: lugar.direccion, lat: Number(lugar.lat), lng: Number(lugar.lng) } : null);
  const [hoja, setHoja] = useState(null); // 'direccion' | 'borrar'
  const [accion, setAccion] = useState(null);
  const [error, setError] = useState('');

  const guardar = async () => {
    setError('');
    setAccion('guardar');
    try {
      await guardarLugar(idOrg, lugar?.id_lugar, { nombre, ...ubicacion });
      navigation.goBack();
    } catch (e) {
      const msg = mensajeDeError(e, 'No pudimos guardar el lugar. Probá de nuevo.');
      setError(/ya existe un lugar/i.test(msg) ? 'Ya tenés un lugar con ese nombre. Usá otro.' : msg);
    } finally {
      setAccion(null);
    }
  };

  const borrar = async () => {
    setAccion('borrar');
    try {
      await borrarLugar(idOrg, lugar.id_lugar);
      setHoja(null);
      navigation.goBack();
    } catch (e) {
      setHoja(null);
      setError(mensajeDeError(e));
    } finally {
      setAccion(null);
    }
  };

  const pie = (
    <>
      <Boton titulo={lugar ? 'Guardar los cambios' : 'Guardar el lugar'} onPress={guardar} cargando={accion === 'guardar'} deshabilitado={!nombre.trim() || !ubicacion} />
      {lugar ? <Boton titulo="Borrar el lugar" variante="fantasma" onPress={() => setHoja('borrar')} /> : null}
    </>
  );

  return (
    <Pantalla onVolver={() => navigation.goBack()} pie={pie} pieConLinea>
      <Titulo>{lugar ? 'Editar lugar' : 'Nuevo lugar'}</Titulo>
      <Campo label="Nombre" value={nombre} onChangeText={setNombre} maxLength={80} placeholder="Por ejemplo: Depósito Pilar" hint="Lo ve solo tu empresa. Al conductor le llega la dirección." />
      <Campo label="Dirección" icono="map-marker-outline" value={ubicacion?.direccion} placeholder="Buscar la dirección" onPress={() => setHoja('direccion')} />
      {error ? <Nota tipo="error">{error}</Nota> : null}

      <HojaParada visible={hoja === 'direccion'} titulo="Dirección del lugar" onElegir={(u) => { setUbicacion(u); setHoja(null); }} onCerrar={() => setHoja(null)} />
      <HojaInferior visible={hoja === 'borrar'} titulo={`¿Borrar ${lugar?.nombre ?? 'el lugar'}?`}
        bajada="Deja de aparecer al cargar viajes. Los viajes y los viajes repetidos que ya lo usan no cambian." onCerrar={() => setHoja(null)}>
        <View style={{ gap: 10 }}>
          <Boton titulo="Borrar" variante="peligro" cargando={accion === 'borrar'} onPress={borrar} />
          <Boton titulo="Volver" variante="fantasma" onPress={() => setHoja(null)} />
        </View>
      </HojaInferior>
    </Pantalla>
  );
}
