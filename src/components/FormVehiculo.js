import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TIPOS_VEHICULO, CONDICIONES } from '../services/vehiculos';
import { formatearPatente, limpiarPatente, soloDigitos } from '../utils/formularios';
import { Campo, Opcion, Chip, Etiqueta, Meta } from './ui';

// Estado y validación del vehículo (tipo, patente, marca, modelo, año, color,
// condiciones). Lo usan el alta del conductor y «Agregar vehículo» del perfil.
export function useFormVehiculo() {
  const [v, setV] = useState({ tipo: 'utilitario', patente: '', marca: '', modelo: '', anio: '', color: '' });
  const [condiciones, setCondiciones] = useState([]);
  const [errores, setErrores] = useState({});

  const cambiar = (k) => (t) => {
    setV((x) => ({ ...x, [k]: k === 'patente' ? formatearPatente(t) : t }));
    setErrores((e) => ({ ...e, [k]: '' }));
  };
  const alternar = (id) => setCondiciones((cs) => (cs.includes(id) ? cs.filter((c) => c !== id) : [...cs, id]));

  const validar = () => {
    const e = {};
    const p = limpiarPatente(v.patente);
    if (p.length < 6 || p.length > 8) e.patente = 'La patente tiene entre 6 y 8 caracteres.';
    if (!v.marca.trim()) e.marca = 'Falta la marca.';
    if (!v.modelo.trim()) e.modelo = 'Falta el modelo.';
    const anio = Number(soloDigitos(v.anio));
    if (anio < 1990 || anio > new Date().getFullYear()) e.anio = `Entre 1990 y ${new Date().getFullYear()}.`;
    if (!v.color.trim()) e.color = 'Falta el color.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // Body para crearVehiculoPropio y resumen para mostrar
  const datos = () => ({ ...v, tipo_vehiculo: v.tipo, condiciones });

  return { v, setV, condiciones, alternar, errores, setErrores, cambiar, validar, datos };
}

export default function CamposVehiculo({ form }) {
  const { v, setV, condiciones, alternar, errores, cambiar } = form;
  return (
    <>
      <View style={{ gap: 8, marginTop: 18 }} accessibilityRole="radiogroup">
        {TIPOS_VEHICULO.map((t) => (
          <Opcion key={t.id} compacta icono={t.icono} titulo={t.titulo} descripcion={t.capacidad}
            seleccionada={v.tipo === t.id} onPress={() => setV((x) => ({ ...x, tipo: t.id }))} />
        ))}
      </View>
      <Campo label="Patente" mono value={v.patente} onChangeText={cambiar('patente')} autoCapitalize="characters"
        autoCorrect={false} placeholder="Ej.: AE 421 KL" error={errores.patente} />
      <View style={s.fila}>
        <Campo style={s.mitad} label="Marca" value={v.marca} onChangeText={cambiar('marca')} error={errores.marca} />
        <Campo style={s.mitad} label="Modelo" value={v.modelo} onChangeText={cambiar('modelo')} error={errores.modelo} />
      </View>
      <View style={s.fila}>
        <Campo style={s.mitad} label="Año" mono value={v.anio} onChangeText={cambiar('anio')} keyboardType="number-pad" maxLength={4} error={errores.anio} />
        <Campo style={s.mitad} label="Color" value={v.color} onChangeText={cambiar('color')} error={errores.color} />
      </View>
      <Etiqueta>Qué puede llevar</Etiqueta>
      <View style={s.condiciones}>
        {CONDICIONES.map((c) => <Chip key={c.id} titulo={c.titulo} activo={condiciones.includes(c.id)} onPress={() => alternar(c.id)} />)}
      </View>
      <Meta style={{ marginTop: 8 }}>Solo te van a asignar viajes que tu vehículo pueda llevar.</Meta>
    </>
  );
}

const s = StyleSheet.create({
  fila:        { flexDirection: 'row', gap: 12 },
  mitad:       { flex: 1, minWidth: 0 },
  condiciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
