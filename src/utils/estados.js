// Estados del viaje interno (empresa → conductor) en las 5 familias de UXUI.md.
// Familia = qué colores usa el chip (base / ink / soft del tema).
//   aviso:   alguien tiene que actuar (el conductor confirmar)
//   proximo: está agendado y en orden
//   curso:   el viaje está pasando ahora (el punto late)
//   ok:      terminó bien
//   error:   terminó sin hacerse
export const ESTADOS = {
  ASIGNADO:    { label: 'Sin confirmar', familia: 'aviso' },
  CONFIRMADO:  { label: 'Confirmado',    familia: 'proximo' },
  CARGANDO:    { label: 'Cargando',      familia: 'curso' },
  EN_RUTA:     { label: 'En ruta',       familia: 'curso' },
  DESCARGANDO: { label: 'En parada',     familia: 'curso' }, // Paso 3: «en una parada», carga o descarga
  FINALIZADO:  { label: 'Entregado',     familia: 'ok' },
  RECHAZADO:   { label: 'Rechazado',     familia: 'error' },
  VENCIDO:     { label: 'Vencido',       familia: 'error' },
  CANCELADO:   { label: 'Cancelado',     familia: 'error' },
};

export const EN_CURSO = ['CARGANDO', 'EN_RUTA', 'DESCARGANDO'];
export const FINALES = ['FINALIZADO', 'RECHAZADO', 'VENCIDO', 'CANCELADO'];

export const estadoInfo = (estado) => ESTADOS[estado] ?? { label: estado ?? 'A confirmar', familia: 'proximo' };

// Colores de una familia en el tema activo
export function coloresFamilia(familia, c) {
  return {
    aviso:   { base: c.warning, ink: c.warningInk, soft: c.warningSoft },
    proximo: { base: c.info,    ink: c.infoInk,    soft: c.infoSoft },
    curso:   { base: c.accent,  ink: c.accentInk,  soft: c.accentSoft },
    ok:      { base: c.success, ink: c.successInk, soft: c.successSoft },
    error:   { base: c.error,   ink: c.errorInk,   soft: c.errorSoft },
  }[familia];
}

// Por qué terminó sin hacerse, en una línea
export function motivoFinal(viaje) {
  if (viaje.estado === 'VENCIDO') return 'No se inició a tiempo.';
  if (viaje.estado === 'RECHAZADO') return 'Lo rechazaste.';
  if (viaje.estado === 'CANCELADO') {
    return {
      CHOFER: 'Lo cancelaste.',
      ORGANIZACION: 'Lo canceló la empresa.',
      ADMIN: 'Lo canceló Fleter.',
      DESVINCULACION: 'Se canceló al desvincularte de la empresa.',
    }[viaje.causa_cancelacion] ?? 'Se canceló.';
  }
  return '';
}
