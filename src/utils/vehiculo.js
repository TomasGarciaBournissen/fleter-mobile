import api from '../services/api';

const MOCK_VEHICULO = {
  patente: 'REVIEW1',
  marca: 'Ford',
  modelo: 'Transit',
  anio: 2022,
  color: 'Blanco',
  tipo_vehiculo: 'furgon',
  condiciones: ['FRAGIL', 'REFRIGERADO', 'CARGA_PESADA', 'PELIGROSO', 'VOLUMINOSO'],
};

let cachedIdVehiculo = null;

export async function getOrCreateVehiculo() {
  if (cachedIdVehiculo) return cachedIdVehiculo;

  const { data: vehiculos } = await api.get('/api/conductores/mis-vehiculos');
  if (vehiculos.length > 0) {
    cachedIdVehiculo = vehiculos[0].id_vehiculo;
    return cachedIdVehiculo;
  }

  const { data: nuevo } = await api.post('/api/conductores/mis-vehiculos', MOCK_VEHICULO);
  cachedIdVehiculo = nuevo.id_vehiculo;
  return cachedIdVehiculo;
}
