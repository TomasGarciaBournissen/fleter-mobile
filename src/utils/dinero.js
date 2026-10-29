// Precios en formato es-AR: $12.500, sin decimales. Solo del lado de la
// empresa: el conductor nunca ve el precio del viaje (CLAUDE.md).
export function pesos(v) {
  if (v == null || v === '' || Number.isNaN(Number(v))) return 'A confirmar';
  return `$${Math.round(Number(v)).toLocaleString('es-AR')}`;
}
