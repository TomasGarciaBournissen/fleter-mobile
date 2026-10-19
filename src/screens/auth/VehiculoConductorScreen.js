import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { registroConductor } from '../../services/auth';
import { crearVehiculoPropio, TIPOS_VEHICULO, CONDICIONES } from '../../services/vehiculos';
import { mensajeDeError } from '../../utils/errores';
import { formatearPatente, limpiarPatente, soloDigitos } from '../../utils/formularios';
import { Pantalla, Pasos, Titulo, Campo, Boton, Opcion, Chip, Nota, Etiqueta, Meta } from '../../components/ui';

// Paso 3 de 3: vehículo y condiciones. «Crear mi cuenta» registra al
// conductor y, si cargó el vehículo, lo da de alta. Sin vehículo no le
// pueden asignar viajes, pero puede cargarlo después desde el perfil.
export default function VehiculoConductorScreen({ navigation, route }) {
  const { personales, licencia } = route.params;
  const { setAltaEnCurso } = useAuth();
  const [v, setV] = useState({ tipo: 'utilitario', patente: '', marca: '', modelo: '', anio: '', color: '' });
  const [condiciones, setCondiciones] = useState([]);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(null); // 'con' | 'sin'
  // Si la cuenta ya se creó y falló el vehículo, reintentar solo el vehículo
  const [cuentaCreada, setCuentaCreada] = useState(false);

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

  const crear = async (conVehiculo) => {
    setError('');
    if (conVehiculo && !validar()) return;
    setCargando(conVehiculo ? 'con' : 'sin');
    let creada = cuentaCreada;
    try {
      if (!creada) {
        setAltaEnCurso(true); // que RootNavigator no salte al stack del conductor todavía
        await registroConductor({ ...personales, ...licencia });
        creada = true;
        setCuentaCreada(true);
      }
      if (conVehiculo) {
        await crearVehiculoPropio({ ...v, tipo_vehiculo: v.tipo, condiciones });
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'CodigoConductor', params: { vehiculo: conVehiculo ? { ...v, condiciones } : null } }],
      });
    } catch (err) {
      if (!creada) setAltaEnCurso(false);
      const msg = mensajeDeError(err);
      if (/patente/i.test(msg)) setErrores((e) => ({ ...e, patente: msg }));
      else if (creada) setError(`Tu cuenta ya está creada, pero no pudimos guardar el vehículo. ${msg}`);
      else setError(msg);
    } finally {
      setCargando(null);
    }
  };

  return (
    <Pantalla
      onVolver={cuentaCreada ? undefined : () => navigation.goBack()}
      pieConLinea
      pie={
        <>
          <Boton titulo="Crear mi cuenta" onPress={() => crear(true)} cargando={cargando === 'con'} deshabilitado={cargando === 'sin'} />
          <Boton titulo="Cargar el vehículo después" variante="fantasma" onPress={() => crear(false)} cargando={cargando === 'sin'} deshabilitado={cargando === 'con'} />
        </>
      }
    >
      <Pasos actual={3} total={3} etiqueta="tu vehículo" />
      <Titulo>¿Con qué vehículo trabajás?</Titulo>
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
      {error ? <Nota tipo="error">{error}</Nota> : null}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  fila:        { flexDirection: 'row', gap: 12 },
  mitad:       { flex: 1, minWidth: 0 },
  condiciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
