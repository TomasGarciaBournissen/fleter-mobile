import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Pantalla, Titulo, Meta, Pastilla, ProximosPasos, Boton, IsotipoAnimado } from '../../components/ui';

const PASOS = [
  { titulo: 'Invitá a tus conductores', descripcion: 'Les pasás un código y se vinculan desde su app.' },
  { titulo: 'Guardá tus lugares', descripcion: 'Depósito, clientes frecuentes: después los elegís con un toque.' },
  { titulo: 'Cargá el primer viaje', descripcion: 'Con conductor asignado y precio estimado.' },
];

// Cierre del alta de la empresa: el momento que se recuerda. Las cajas del
// isotipo se estiban y cae la de seguimiento. Al salir se refresca el perfil
// (ya con `organizacion`) y RootNavigator pasa al stack de la empresa.
export default function EmpresaRegistradaScreen({ route }) {
  const { refrescarUsuario } = useAuth();
  const { organizacion } = route.params ?? {};
  const [cargando, setCargando] = useState(null);

  // TODO fase 3: «Invitar conductores» abre Conductores → Invitar. Hasta
  // que exista esa pantalla, las dos acciones llevan al inicio.
  const salir = (cual) => async () => {
    setCargando(cual);
    try { await refrescarUsuario(); } catch { setCargando(null); }
  };

  return (
    <Pantalla
      pie={
        <>
          <Boton titulo="Invitar conductores" onPress={salir('invitar')} cargando={cargando === 'invitar'} />
          <Boton titulo="Ir al inicio" variante="fantasma" onPress={salir('inicio')} cargando={cargando === 'inicio'} />
        </>
      }
    >
      <View style={{ marginTop: 30, marginBottom: 22 }}>
        <IsotipoAnimado size={84} />
      </View>
      <Titulo>{organizacion?.nombre ?? 'Tu empresa'} ya está en Fleter</Titulo>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
        {organizacion?.estado === 'TRIAL' ? <Pastilla texto="Período de prueba" /> : null}
        <Meta>Sos responsable</Meta>
      </View>
      <ProximosPasos pasos={PASOS} />
    </Pantalla>
  );
}
