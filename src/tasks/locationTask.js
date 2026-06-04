import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

export const LOCATION_TASK = 'conductor-ubicacion';

let _emitFn = null;

export function setLocationEmitter(fn) { _emitFn = fn; }
export function clearLocationEmitter() { _emitFn = null; }

// Must be called at module level before app renders
TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
  if (error || !data || !_emitFn) return;
  const { locations } = data;
  const loc = locations?.[locations.length - 1];
  if (loc) _emitFn(loc.coords.latitude, loc.coords.longitude);
});

export async function startLocationTracking() {
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 15000,
    distanceInterval: 0,
    foregroundService: {
      notificationTitle: 'Movix — Viaje activo',
      notificationBody: 'GPS activo para el viaje en curso',
      notificationColor: '#F4711A',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
  });
}

export async function stopLocationTracking() {
  clearLocationEmitter();
  try {
    const running = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  } catch {}
}
