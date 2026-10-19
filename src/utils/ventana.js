// Ventana para iniciar un viaje: de fecha_programada − 60 min a + 90 min
// (VENTANA_INICIO_ANTES/DESPUES_MINUTOS, defaults del backend). La API no
// manda los bordes; se muestran solo como referencia y el que decide es el
// backend al tocar «Iniciar» (si no, su mensaje se muestra tal cual). Ver ISSUES.md #3.
const ANTES_MIN = 60;
const DESPUES_MIN = 90;

export const inicioVentana = (v) => new Date(new Date(v.fecha_programada).getTime() - ANTES_MIN * 60000);
export const finVentanaInicio = (v) => new Date(new Date(v.fecha_programada).getTime() + DESPUES_MIN * 60000);
