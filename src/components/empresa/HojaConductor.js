import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { TIPOS_VEHICULO } from '../../services/vehiculos';
import { Avatar, Boton, Enlace, HojaInferior } from '../ui';
import { nombreConductor } from './TarjetaViajeEmpresa';

// ¿Puede hacer viajes de la empresa? Alcanza con un vehículo propio cargado:
// los viajes de PyME no tienen condiciones (pedido del 20-10-2026). El backend
// lo vuelve a validar al crear; esto solo explica la lista.
export function aptitud(conductor) {
  const vehiculos = conductor.vehiculos ?? [];
  if (!vehiculos.length) return { apto: false, motivo: 'No tiene vehículos cargados' };
  return { apto: true, vehiculo: vehiculos[0] };
}

export function resumenConductor(c) {
  const veh = c.vehiculos?.[0];
  if (!veh) return 'Sin vehículos cargados.';
  const tipo = TIPOS_VEHICULO.find((t) => t.id === veh.tipo_vehiculo)?.titulo;
  const extra = c.vehiculos.length > 1 ? ` y ${c.vehiculos.length - 1} más` : '';
  return `${veh.marca} ${veh.modelo}${extra}.${tipo ? ` ${tipo}.` : ''}`;
}

// Lista de conductores para elegir uno. El que no tiene vehículos cargados
// queda visible y apagado, con el motivo (prototipo, paso «Conductor»).
export function ListaConductores({ conductores, elegido, excluir, onElegir }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 8 }}>
      {conductores.filter((c) => c.id_conductor !== excluir).map((c) => {
        const { apto, motivo } = aptitud(c);
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
export default function HojaConductor({ visible, titulo, bajada, conductores, excluir, cargando, onElegir, onInvitar, onCerrar }) {
  const [elegido, setElegido] = useState(null);
  useEffect(() => { if (!visible) setElegido(null); }, [visible]);
  const s = useThemedStyles(createStyles);
  const quien = conductores?.find((c) => c.id_conductor === elegido);
  return (
    <HojaInferior visible={visible} titulo={titulo} bajada={bajada} onCerrar={onCerrar}>
      <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ paddingBottom: 2 }}>
        {conductores?.length
          ? <ListaConductores conductores={conductores} elegido={elegido} excluir={excluir} onElegir={(c) => setElegido(c.id_conductor)} />
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
