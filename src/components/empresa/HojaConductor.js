import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { CONDICIONES } from '../../services/vehiculos';
import { Avatar, Boton, Enlace, HojaInferior } from '../ui';
import { textoCondiciones } from '../viaje/DatosViaje';
import { nombreConductor } from './TarjetaViajeEmpresa';

const titulos = (lista) => lista.map((id) => CONDICIONES.find((c) => c.id === id)?.titulo ?? id);

// ¿Alguno de sus vehículos lleva todo lo que pide el viaje? (el backend
// vuelve a validarlo al crear: esto solo ordena y explica la lista)
export function aptitud(conductor, condiciones = []) {
  const vehiculos = conductor.vehiculos ?? [];
  const apto = vehiculos.find((veh) => condiciones.every((c) => (veh.condiciones ?? []).includes(c)));
  if (!vehiculos.length) return { apto: false, motivo: 'No tiene vehículos cargados' };
  if (!apto) return { apto: false, motivo: `Ninguno de sus vehículos lleva ${textoCondiciones(condiciones).toLowerCase()}` };
  return { apto: true, vehiculo: apto };
}

export function resumenConductor(c) {
  const veh = c.vehiculos?.[0];
  if (!veh) return 'Sin vehículos cargados.';
  const conds = titulos([...new Set((c.vehiculos ?? []).flatMap((v) => v.condiciones ?? []))]);
  const extra = c.vehiculos.length > 1 ? ` y ${c.vehiculos.length - 1} más` : '';
  const lista = conds.map((t, i) => (i === 0 ? t : t.toLowerCase()));
  return `${veh.marca} ${veh.modelo}${extra}. ${lista.length ? `${lista.join(' y ')}.` : 'Sin condiciones.'}`;
}

// Lista de conductores para elegir uno. El que no tiene un vehículo compatible
// queda visible y apagado, con el motivo (prototipo, paso «Conductor»).
export function ListaConductores({ conductores, condiciones, elegido, excluir, onElegir }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 8 }}>
      {conductores.filter((c) => c.id_conductor !== excluir).map((c) => {
        const { apto, motivo } = aptitud(c, condiciones);
        const sel = elegido === c.id_conductor;
        return (
          <Pressable
            key={c.id_conductor}
            disabled={!apto}
            onPress={() => onElegir(c)}
            accessibilityRole="radio"
            accessibilityState={{ checked: sel, disabled: !apto }}
            style={[s.opcion, sel && s.opcionSel, !apto && s.opcionNo]}
          >
            <Avatar nombre={nombreConductor(c)} />
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>{nombreConductor(c)}</Text>
              {apto ? <Text style={s.meta}>{resumenConductor(c)}</Text> : <Text style={s.no}>{motivo}</Text>}
            </View>
            {apto ? (
              <View style={[s.tick, sel && s.tickSel]}>
                {sel ? <MaterialCommunityIcons name="check" size={14} color={colors.onAccent} /> : null}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// Hoja para reasignar o asignar a otro conductor (rechazados, por vencer)
export default function HojaConductor({ visible, titulo, bajada, conductores, condiciones, excluir, cargando, onElegir, onInvitar, onCerrar }) {
  const [elegido, setElegido] = useState(null);
  useEffect(() => { if (!visible) setElegido(null); }, [visible]);
  const s = useThemedStyles(createStyles);
  const quien = conductores?.find((c) => c.id_conductor === elegido);
  return (
    <HojaInferior visible={visible} titulo={titulo} bajada={bajada} onCerrar={onCerrar}>
      <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ paddingBottom: 2 }}>
        {conductores?.length
          ? <ListaConductores conductores={conductores} condiciones={condiciones} elegido={elegido} excluir={excluir} onElegir={(c) => setElegido(c.id_conductor)} />
          : <Text style={s.meta}>Todavía no tenés conductores vinculados.</Text>}
      </ScrollView>
      {onInvitar ? <Enlace onPress={onInvitar} style={{ marginVertical: 4 }}>Invitar a un conductor nuevo</Enlace> : null}
      <Boton
        titulo={quien ? `Asignárselo a ${quien.nombre}` : 'Elegí un conductor'}
        deshabilitado={!quien}
        cargando={cargando}
        onPress={() => onElegir(quien)}
      />
    </HojaInferior>
  );
}

const createStyles = (c) => StyleSheet.create({
  opcion:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  opcionSel: { borderWidth: 2, borderColor: c.accent, backgroundColor: c.accentSofter, padding: 11 },
  opcionNo:  { backgroundColor: c.surface2 },
  nombre:    { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  meta:      { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 1 },
  no:        { fontFamily: fonts.uiSemiBold, fontSize: 12, color: c.errorInk, marginTop: 1 },
  tick:      { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' },
  tickSel:   { backgroundColor: c.accent, borderColor: c.accent },
});
