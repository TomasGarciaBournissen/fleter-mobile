export function formatKm(km) {
  if (km == null) return '—';
  return `${Math.round(Number(km) * 10) / 10} km`;
}

export function formatHoras(horas) {
  if (horas == null) return '—';
  const totalMin = Math.round(Number(horas) * 60);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h === 0) return `${min} min`;
  if (min === 0) return `${h} h`;
  return `${h} h ${min} min`;
}

export function formatPrecio(precio) {
  if (precio == null) return '—';
  return Math.round(Number(precio)).toLocaleString('es-AR');
}
