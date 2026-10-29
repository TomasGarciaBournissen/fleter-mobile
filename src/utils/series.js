// Viajes repetidos (series del backend, API.md «Series de viajes»).
// Días de la semana como los numera el backend: 1 = lunes … 7 = domingo.
// La hora de una serie es hora de Argentina; el teléfono se asume en esa zona.

export const FRECUENCIAS = [
  { id: 'UNA_VEZ',     titulo: 'Una sola vez' },
  { id: 'DIARIA',      titulo: 'Todos los días' },
  { id: 'DIAS_SEMANA', titulo: 'Algunos días de la semana' },
  { id: 'SEMANAL',     titulo: 'Una vez por semana' },
  { id: 'MENSUAL',     titulo: 'Una vez por mes' },
];

export const LETRAS_DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const DIAS_CORTOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

// Ventana máxima de una serie (fecha_hasta ≤ fecha_desde + 30 días)
export const DIAS_MAXIMOS_SERIE = 30;

export const diaSemanaIso = (d) => ((d.getDay() + 6) % 7) + 1;

// 'YYYY-MM-DD' en la fecha local del teléfono
export function fechaIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const desdeIso = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };

function enumerar(lista) {
  if (lista.length <= 1) return lista.join('');
  return `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`;
}

// «Todos los días a las 06:30» · «Lun, mié y vie a las 07:00» · «Todos los lunes a las 07:00»
export function textoFrecuencia(s) {
  const hora = s.hora ? ` a las ${s.hora.slice(0, 5)}` : '';
  switch (s.frecuencia) {
    case 'DIARIA': return `Todos los días${hora}`;
    case 'DIAS_SEMANA': {
      const t = enumerar([...(s.dias_semana ?? [])].sort().map((n) => DIAS_CORTOS[n - 1]));
      return `${t.charAt(0).toUpperCase()}${t.slice(1)}${hora}`;
    }
    case 'SEMANAL': return `Todos los ${DIAS[(s.dia_semana ?? 1) - 1]}${DIAS[(s.dia_semana ?? 1) - 1].endsWith('s') ? '' : 's'}${hora}`;
    case 'MENSUAL': return `El ${s.dia_mes} de cada mes${hora}`;
    default: return 'Una sola vez';
  }
}

// Cuántos viajes saldrían en la ventana, solo para avisar antes de crear.
// El número real lo devuelve el backend (puede saltear los que no llegan
// a la anticipación mínima, y ajusta el día 29/30/31 al fin de mes).
export function contarViajes({ frecuencia, dias_semana = [], dia_semana, dia_mes, desde, hasta }) {
  if (!desde || !hasta || hasta < desde) return 0;
  let n = 0;
  for (let d = new Date(desde); d <= hasta; d.setDate(d.getDate() + 1)) {
    const dia = diaSemanaIso(d);
    const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    if (frecuencia === 'DIARIA') n += 1;
    else if (frecuencia === 'DIAS_SEMANA' && dias_semana.includes(dia)) n += 1;
    else if (frecuencia === 'SEMANAL' && dia === dia_semana) n += 1;
    else if (frecuencia === 'MENSUAL' && d.getDate() === Math.min(dia_mes, ultimo)) n += 1;
  }
  return n;
}
