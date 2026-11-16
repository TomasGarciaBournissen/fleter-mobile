import React from 'react';
import { View } from 'react-native';
import { Opcion } from '../ui';
import { PERMISOS } from '../../utils/permisos';

// Casillas de permisos de un miembro (al invitarlo o desde Equipo).
// GESTIONAR_VIAJES incluye ver: al marcarlo se marca «Ver viajes», y al
// desmarcar «Ver viajes» se va también «Cargar y cambiar viajes».
export default function ElegirPermisos({ valor, onCambiar }) {
  const set = new Set(valor);
  const alternar = (id) => {
    const nuevo = new Set(set);
    if (nuevo.has(id)) {
      nuevo.delete(id);
      if (id === 'VER_VIAJES') nuevo.delete('GESTIONAR_VIAJES');
    } else {
      nuevo.add(id);
      if (id === 'GESTIONAR_VIAJES') nuevo.add('VER_VIAJES');
    }
    onCambiar(PERMISOS.map((p) => p.id).filter((p) => nuevo.has(p)));
  };
  return (
    <View style={{ gap: 8 }}>
      {PERMISOS.map((p) => (
        <Opcion key={p.id} multiple compacta icono={p.icono} titulo={p.titulo} descripcion={p.descripcion}
          seleccionada={set.has(p.id)} onPress={() => alternar(p.id)} />
      ))}
    </View>
  );
}
