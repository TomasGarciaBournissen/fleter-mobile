import api from './api';
import { DEV_MODE } from '../config';
import { limpiarPatente } from '../utils/formularios';

// Tipos de vehículo que muestra la app (option cards de UXUI.md).
// `tipo_vehiculo` es texto libre en el backend; estos son los valores que manda el mobile.
export const TIPOS_VEHICULO = [
  { id: 'utilitario',    titulo: 'Utilitario',    capacidad: 'Hasta 1.000 kg',  icono: 'van-utility' },
  { id: 'camion_chico',  titulo: 'Camión chico',  capacidad: 'Hasta 3.500 kg',  icono: 'truck-outline' },
  { id: 'camion_grande', titulo: 'Camión grande', capacidad: 'Hasta 12.000 kg', icono: 'truck-trailer' },
];

export const CONDICIONES = [
  { id: 'FRAGIL',       titulo: 'Frágil' },
  { id: 'REFRIGERADO',  titulo: 'Refrigerado' },
  { id: 'CARGA_PESADA', titulo: 'Carga pesada' },
  { id: 'PELIGROSO',    titulo: 'Peligroso' },
  { id: 'VOLUMINOSO',   titulo: 'Voluminoso' },
];

export async function crearVehiculoPropio({ patente, marca, modelo, anio, color, tipo_vehiculo, condiciones }) {
  if (DEV_MODE) return { id_vehiculo: 1 };
  const { data } = await api.post('/api/conductores/mis-vehiculos', {
    patente: limpiarPatente(patente),
    marca: marca.trim(),
    modelo: modelo.trim(),
    anio: Number(anio),
    color: color.trim(),
    tipo_vehiculo,
    condiciones,
  });
  return data;
}
