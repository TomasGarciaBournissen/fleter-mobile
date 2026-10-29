// Estado de ejemplo del lado de la empresa para el modo desarrollo
// (DEV_MODE, sin backend). Lo usan viajesEmpresa.js y empresa.js: imita las
// respuestas de API.md (develop) para Distribuidora Norte, con horarios
// relativos a ahora para que Inicio y Alertas siempre tengan algo que mostrar.
// Los precios y tiempos de acá son inventados: en la app real los calcula el backend.
import { diaSemanaIso, fechaIso, desdeIso } from '../utils/series';

const ahoraIso = () => new Date().toISOString();
const masMin = (iso, min) => new Date(new Date(iso).getTime() + min * 60000).toISOString();
const redondear = (d, min = 15) => { const r = new Date(d); r.setSeconds(0, 0); r.setMinutes(Math.floor(r.getMinutes() / min) * min); return r; };
const desdeAhora = (min) => redondear(new Date(Date.now() + min * 60000)).toISOString();
const en = (dias, h, m) => { const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(h, m, 0, 0); return d.toISOString(); };
const copia = (x) => JSON.parse(JSON.stringify(x));
const error = (status, mensaje) => Object.assign(new Error(mensaje), { response: { status, data: { error: mensaje } } });

const ORG = {
  id_organizacion: 1, nombre: 'Distribuidora Norte', cuit: '30712345671', razon_social: 'Distribuidora Norte SRL',
  direccion: 'Ruta 8 km 52, Pilar', estado: 'TRIAL', creado_en: en(-20, 10, 0), actualizado_en: en(-20, 10, 0), mi_rol: 'RESPONSABLE',
};

const transit = { id_vehiculo: 10, patente: 'AE421KL', marca: 'Ford', modelo: 'Transit', anio: 2022, color: 'Blanco', tipo_vehiculo: 'utilitario', condiciones: ['FRAGIL', 'VOLUMINOSO'] };
const daily = { id_vehiculo: 11, patente: 'AD118PQ', marca: 'Iveco', modelo: 'Daily', anio: 2019, color: 'Gris', tipo_vehiculo: 'camion_chico', condiciones: ['REFRIGERADO', 'CARGA_PESADA'] };
const fiorino = { id_vehiculo: 12, patente: 'AF332RT', marca: 'Fiat', modelo: 'Fiorino', anio: 2021, color: 'Blanco', tipo_vehiculo: 'utilitario', condiciones: ['FRAGIL'] };

const choferes = [
  { id_conductor: 4, id_usuario: 2, nombre: 'Martín', apellido: 'Gómez', telefono: '+5491155550004', fecha_alta: en(-18, 10, 0), metodo_cobro: 'CALCULO_PLATAFORMA', vehiculos: [transit] },
  { id_conductor: 5, id_usuario: 5, nombre: 'Juan', apellido: 'Pérez', telefono: '+5491155550005', fecha_alta: en(-15, 10, 0), metodo_cobro: 'CALCULO_PLATAFORMA', vehiculos: [daily] },
  { id_conductor: 6, id_usuario: 6, nombre: 'Lucía', apellido: 'Benítez', telefono: '+5491155550006', fecha_alta: en(-6, 10, 0), metodo_cobro: 'CALCULO_PLATAFORMA', vehiculos: [fiorino] },
];
const conductorDe = (id) => {
  const c = choferes.find((x) => x.id_conductor === Number(id));
  return c ? { id_conductor: c.id_conductor, id_usuario: c.id_usuario, nombre: c.nombre, apellido: c.apellido, telefono: c.telefono } : null;
};

let miembros = [
  { id_usuario: 1, nombre: 'Ana', apellido: 'Ferreyra', email: 'ana@distribuidoranorte.com.ar', telefono: '+5491144440001', rol: 'RESPONSABLE', fecha_alta: en(-20, 10, 0) },
  { id_usuario: 7, nombre: 'Diego', apellido: 'Ruiz', email: 'diego@distribuidoranorte.com.ar', telefono: null, rol: 'MIEMBRO', fecha_alta: en(-12, 10, 0) },
  { id_usuario: 8, nombre: 'Sofía', apellido: 'López', email: 'logistica@distribuidoranorte.com.ar', telefono: null, rol: 'MIEMBRO', fecha_alta: en(-3, 10, 0) },
];

let invitaciones = [
  { id_invitacion: 3, tipo: 'CHOFER', fecha_creacion: masMin(ahoraIso(), -60 * 20), fecha_vencimiento: masMin(ahoraIso(), 60 * 52), creada_por: { id_usuario: 1, nombre: 'Ana', apellido: 'Ferreyra' } },
];

let lugares = [
  { id_lugar: 1, nombre: 'Depósito Pilar', direccion: 'Ruta 8 km 52, Pilar', lat: -34.4587, lng: -58.9142 },
  { id_lugar: 2, nombre: 'Cliente Almagro', direccion: 'Av. Corrientes 3200, Almagro, CABA', lat: -34.6037, lng: -58.4110 },
  { id_lugar: 3, nombre: 'Sucursal Vicente López', direccion: 'Av. Mitre 1450, Vicente López', lat: -34.5266, lng: -58.4728 },
  { id_lugar: 4, nombre: 'Mercado Central', direccion: 'Autopista Ricchieri y Boulogne Sur Mer, Tapiales', lat: -34.6969, lng: -58.5085 },
].map((l) => ({ ...l, id_organizacion: 1, activo: true, creado_en: en(-15, 10, 0), actualizado_en: en(-15, 10, 0) }));
const lugarRef = (id) => { const l = lugares.find((x) => x.id_lugar === id); return l ? { id_lugar: l.id_lugar, nombre: l.nombre, activo: l.activo } : null; };

// ── Paradas y viajes con la forma de GET /organizaciones/:id/viajes/:idViaje
let idParada = 100;
function parada(orden, { direccion, lat, lng, id_lugar = null }, llegada, peon = 20, real = {}) {
  const llegada_real = real.llegada ?? null;
  const salida_real = real.salida ?? null;
  return {
    id_parada: idParada++, orden, direccion, latitud: lat, longitud: lng, estado: salida_real ? 'ENTREGADO' : 'PENDIENTE',
    llegada_estimada: llegada, salida_estimada: masMin(llegada, peon), peon_estimado_min: peon,
    llegada_real, salida_real, salida_detectada: null, origen_salida: salida_real ? 'CHOFER' : null, no_visitada: false,
    peon_real_min: llegada_real && salida_real ? Math.round((new Date(salida_real) - new Date(llegada_real)) / 60000) : null,
    diferencia_min: llegada_real ? Math.round((new Date(llegada_real) - new Date(llegada)) / 60000) : null,
    id_lugar, lugar: id_lugar ? lugarRef(id_lugar) : null,
  };
}
const dir = (direccion, lat, lng) => ({ direccion, lat, lng });
const L = (id) => { const l = lugares.find((x) => x.id_lugar === id); return { direccion: l.direccion, lat: l.lat, lng: l.lng, id_lugar: id }; };

function viaje(id, fecha, estado, idConductor, paradas, extra = {}) {
  return {
    id_viaje: id, id_organizacion: 1, id_serie: null, estado, fecha_programada: fecha, descripcion: null,
    organizacion: { id_organizacion: 1, nombre: ORG.nombre, cuit: ORG.cuit },
    creador: { id_usuario: 1, nombre: 'Ana', apellido: 'Ferreyra' },
    conductor: conductorDe(idConductor), id_conductor: idConductor, vehiculo: null,
    condiciones_requeridas: [], paradas, estimado: null, real: null, precio_estimado: null, precio_real: null,
    fecha_inicio: null, fecha_confirmacion: null, fecha_rechazo: null, causa_cancelacion: null, motivo_cancelacion: null,
    puntualidad_inicio: null, vencido: estado === 'VENCIDO', remito_url: null, ruta_planeada: null, cierre: null,
    creado_en: masMin(fecha, -60 * 24), historial_estados: [],
    ...extra,
  };
}

// Viaje en ruta ahora: salió del depósito 22 min tarde, va a la segunda parada
const f2419 = desdeAhora(-45);
const v2419 = viaje(2419, f2419, 'EN_RUTA', 4, [
  parada(1, L(1), f2419, 15, { llegada: masMin(f2419, 1), salida: masMin(f2419, 37) }),
  parada(2, dir('Av. Mitre 1450, Vicente López', -34.5266, -58.4728), masMin(f2419, 50), 15),
  parada(3, L(2), masMin(f2419, 95), 15),
], {
  vehiculo: transit, condiciones_requeridas: ['FRAGIL'], precio_estimado: 68500, fecha_inicio: masMin(f2419, 1), fecha_confirmacion: masMin(f2419, -300),
  puntualidad_inicio: 'A_TIEMPO', estimado: { manejo_horas: 0.83, peon_horas: 0.5, total_horas: 1.33, distancia_km: 48 },
  cierre: { cerrado_por: null, incompleto: false, cierre_manual_desde: null, cierre_manual_habilitado: false, motivo_habilitacion: null, hora_prevista_fin: null, salida_detectada: null, cierre_automatico_en: null, fecha_corte_precio: null },
  _dev_vivo: { posicion: { latitude: -34.4950, longitude: -58.6200 }, minutos: 12, desvio: { fecha: masMin(f2419, 43), metros: 450 } },
});

const f2420 = desdeAhora(150);
const f2421 = desdeAhora(210);
const f2422 = desdeAhora(270);
let viajes = [
  v2419,
  viaje(2420, f2420, 'ASIGNADO', 5, [
    parada(1, L(4), f2420, 20),
    parada(2, dir('Av. Rivadavia 6800, Flores, CABA', -34.6294, -58.4633), masMin(f2420, 45), 20),
  ], { condiciones_requeridas: ['REFRIGERADO'], precio_estimado: 39800, estimado: { manejo_horas: 0.42, peon_horas: 0.67, total_horas: 1.08, distancia_km: 21 } }),
  viaje(2421, f2421, 'CONFIRMADO', 4, [
    parada(1, L(1), f2421, 20),
    parada(2, dir('Panamericana km 26, Don Torcuato', -34.4920, -58.6280), masMin(f2421, 30), 15),
    parada(3, dir('Av. Maipú 2100, Olivos', -34.5100, -58.4890), masMin(f2421, 70), 15),
  ], { vehiculo: transit, condiciones_requeridas: ['VOLUMINOSO'], precio_estimado: 52700, fecha_confirmacion: masMin(ahoraIso(), -300), estimado: { manejo_horas: 0.6, peon_horas: 0.58, total_horas: 1.17, distancia_km: 41 } }),
  viaje(2422, f2422, 'RECHAZADO', 6, [
    parada(1, L(3), f2422, 15),
    parada(2, dir('Av. Cabildo 2040, Belgrano, CABA', -34.5610, -58.4560), masMin(f2422, 35), 15),
  ], { precio_estimado: 27900, fecha_rechazo: masMin(ahoraIso(), -95), estimado: { manejo_horas: 0.33, peon_horas: 0.25, total_horas: 0.58, distancia_km: 9 } }),
  viaje(2418, desdeAhora(-330), 'FINALIZADO', 6, (() => {
    const f = desdeAhora(-330);
    return [
      parada(1, L(3), f, 15, { llegada: masMin(f, -3), salida: masMin(f, 14) }),
      parada(2, dir('Av. del Libertador 5800, Belgrano, CABA', -34.5560, -58.4410), masMin(f, 40), 15, { llegada: masMin(f, 44), salida: masMin(f, 58) }),
    ];
  })(), { vehiculo: fiorino, precio_estimado: 24300, precio_real: 25100, estimado: { manejo_horas: 0.42, peon_horas: 0.5, total_horas: 0.92, distancia_km: 11 }, real: { manejo_horas: 0.45, peon_horas: 0.52, total_horas: 0.97, distancia_km: 11.4, peon_completo: true }, remito_url: 'https://example.com/remito-2418.pdf', cierre: { cerrado_por: 'CHOFER', incompleto: false } }),
  viaje(2416, en(-1, 9, 0), 'FINALIZADO', 4, [
    parada(1, L(1), en(-1, 9, 0), 15, { llegada: en(-1, 8, 58), salida: en(-1, 9, 14) }),
    parada(2, dir('Av. Mitre 1450, Vicente López', -34.5266, -58.4728), en(-1, 9, 45), 15, { llegada: en(-1, 9, 51), salida: en(-1, 10, 5) }),
    parada(3, L(2), en(-1, 10, 20), 15, { llegada: en(-1, 10, 29), salida: en(-1, 10, 44) }),
  ], { vehiculo: transit, condiciones_requeridas: ['FRAGIL'], precio_estimado: 68500, precio_real: 71200, puntualidad_inicio: 'A_TIEMPO', estimado: { manejo_horas: 1.08, peon_horas: 0.5, total_horas: 1.58, distancia_km: 48 }, real: { manejo_horas: 1.2, peon_horas: 0.63, total_horas: 1.83, distancia_km: 51, peon_completo: true }, remito_url: 'https://example.com/remito-2416.pdf', cierre: { cerrado_por: 'CHOFER', incompleto: false } }),
  viaje(2410, en(-3, 15, 0), 'CANCELADO', 5, [
    parada(1, L(4), en(-3, 15, 0), 20),
    parada(2, dir('Av. Rivadavia 6800, Flores, CABA', -34.6294, -58.4633), en(-3, 15, 45), 20),
  ], { condiciones_requeridas: ['REFRIGERADO'], precio_estimado: 39800, causa_cancelacion: 'CHOFER', estimado: { manejo_horas: 0.42, peon_horas: 0.67, total_horas: 1.08, distancia_km: 21 } }),
  viaje(2409, en(-4, 6, 30), 'VENCIDO', 5, [
    parada(1, L(4), en(-4, 6, 30), 20),
    parada(2, dir('Av. Rivadavia 6800, Flores, CABA', -34.6294, -58.4633), en(-4, 7, 15), 20),
  ], { condiciones_requeridas: ['REFRIGERADO'], precio_estimado: 38100, estimado: { manejo_horas: 0.42, peon_horas: 0.67, total_horas: 1.08, distancia_km: 21 } }),
];

// ── Series (viajes repetidos)
let series = [];
let idViaje = 2430;
let idSerie = 7;

function paradasDeSerie(lista) {
  return lista.map((p, i) => ({ lat: p.lat, lng: p.lng, orden: i + 1, id_lugar: p.id_lugar ?? null, direccion: p.direccion, lugar: p.id_lugar ? lugarRef(p.id_lugar) : null }));
}
function resumen(id) {
  const vs = viajes.filter((v) => v.id_serie === id);
  return { total: vs.length, por_estado: vs.reduce((acc, v) => ({ ...acc, [v.estado]: (acc[v.estado] ?? 0) + 1 }), {}) };
}

// Estimación inventada para DEV: en la app real la devuelve POST /api/viajes/estimar-costo
function estimarDev(paradas, fecha) {
  let km = 0;
  for (let i = 1; i < paradas.length; i += 1) {
    const a = paradas[i - 1]; const b = paradas[i];
    const dLat = (b.lat - a.lat) * 111; const dLng = (b.lng - a.lng) * 92;
    km += Math.sqrt(dLat * dLat + dLng * dLng) * 1.3;
  }
  km = Math.max(3, Math.round(km * 10) / 10);
  const manejo = km / 35;
  const peon = paradas.length * 0.25;
  const inicio = fecha ?? ahoraIso();
  let t = inicio;
  const tramos = paradas.map((p, i) => {
    const manejoMin = i === 0 ? null : Math.round((manejo * 60) / (paradas.length - 1));
    if (i > 0) t = masMin(t, manejoMin);
    const tramo = { orden: i + 1, llegada_estimada: t, salida_estimada: masMin(t, 15), peon_estimado_min: 15, manejo_estimado_min: manejoMin, distancia_estimada_km: i === 0 ? null : Math.round((km / (paradas.length - 1)) * 10) / 10 };
    t = masMin(t, 15);
    return tramo;
  });
  return {
    zona: 'PROVINCIA',
    precio_estimado: Math.round((15000 + km * 1100) / 100) * 100,
    estimado: { manejo_horas: manejo, peon_horas: peon, total_horas: manejo + peon, distancia_km: km, inicio_estimado: inicio, fin_estimado: t },
    tramos,
  };
}

function resolverParadas(lista) {
  return lista.map((p) => {
    if (p.id_lugar != null) {
      const l = lugares.find((x) => x.id_lugar === p.id_lugar && x.activo);
      if (!l) throw error(400, `El lugar ${p.id_lugar} no existe o no esta activo`);
      return { direccion: l.direccion, lat: l.lat, lng: l.lng, id_lugar: l.id_lugar };
    }
    return { direccion: p.direccion, lat: p.lat, lng: p.lng, id_lugar: null };
  });
}

function validarConductor(idConductor, condiciones = []) {
  const c = choferes.find((x) => x.id_conductor === Number(idConductor));
  if (!c) throw error(400, 'El chofer no esta vinculado a esta PyME');
  const apto = c.vehiculos.some((veh) => condiciones.every((k) => veh.condiciones.includes(k)));
  if (!apto) throw error(400, `El chofer no tiene un vehiculo propio que cumpla las condiciones del viaje: ${condiciones.join(', ')}`);
}

function nuevoViaje({ id_conductor, fecha_programada, paradas, condiciones_requeridas = [], descripcion = null }, idSerieViaje = null) {
  if (paradas.length > 10) throw error(400, 'Un viaje puede tener como máximo 10 paradas');
  if (new Date(fecha_programada) < new Date(Date.now() + 30 * 60000)) throw error(400, 'La fecha programada tiene que ser con al menos 30 minutos de anticipación');
  validarConductor(id_conductor, condiciones_requeridas);
  const resueltas = resolverParadas(paradas);
  const est = estimarDev(resueltas, fecha_programada);
  const v = viaje(idViaje++, fecha_programada, 'ASIGNADO', Number(id_conductor),
    resueltas.map((p, i) => parada(i + 1, p, est.tramos[i].llegada_estimada, 15)),
    { condiciones_requeridas, descripcion, precio_estimado: est.precio_estimado, estimado: { ...est.estimado }, id_serie: idSerieViaje, creado_en: ahoraIso() });
  delete v.estimado.inicio_estimado; delete v.estimado.fin_estimado;
  return v;
}

function fechasDeSerie({ frecuencia, dias_semana = [], dia_semana, dia_mes, fecha_desde, fecha_hasta }) {
  const fechas = [];
  const hasta = desdeIso(fecha_hasta);
  for (let d = desdeIso(fecha_desde); d <= hasta; d.setDate(d.getDate() + 1)) {
    const dia = diaSemanaIso(d);
    const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    if (frecuencia === 'DIARIA'
      || (frecuencia === 'DIAS_SEMANA' && dias_semana.includes(dia))
      || (frecuencia === 'SEMANAL' && dia === dia_semana)
      || (frecuencia === 'MENSUAL' && d.getDate() === Math.min(dia_mes, ultimo))) fechas.push(fechaIso(d));
  }
  return fechas;
}

function crearSerieDev(body, generar = true) {
  if (body.fecha_hasta && (desdeIso(body.fecha_hasta) - desdeIso(body.fecha_desde)) / 86400000 > 30) {
    throw error(400, 'fecha_hasta puede ser como maximo 30 dias despues de fecha_desde');
  }
  validarConductor(body.id_conductor, body.condiciones_requeridas);
  const id = idSerie++;
  const [h, m] = body.hora.split(':').map(Number);
  const salteadas = [];
  const creados = [];
  if (generar) {
    fechasDeSerie(body).forEach((f) => {
      const d = desdeIso(f); d.setHours(h, m, 0, 0);
      if (d < new Date(Date.now() + 30 * 60000)) { salteadas.push({ fecha: f, fecha_programada: d.toISOString(), motivo: d < new Date() ? 'PASADA' : 'SIN_ANTICIPACION' }); return; }
      const v = nuevoViaje({ ...body, fecha_programada: d.toISOString() }, id);
      viajes.push(v); creados.push(v);
    });
    if (!creados.length) throw error(400, 'La serie no genera ningun viaje en esa ventana');
  }
  const serie = {
    id_serie: id, id_organizacion: 1, id_creador: 1, id_conductor: Number(body.id_conductor), conductor: conductorDe(body.id_conductor),
    frecuencia: body.frecuencia, dias_semana: body.dias_semana ?? [], dia_semana: body.dia_semana ?? null, dia_mes: body.dia_mes ?? null,
    hora: body.hora, zona_horaria: 'America/Argentina/Buenos_Aires', fecha_desde: body.fecha_desde, fecha_hasta: body.fecha_hasta,
    paradas: paradasDeSerie(resolverParadas(body.paradas)), condiciones_requeridas: body.condiciones_requeridas ?? [], descripcion: body.descripcion ?? null,
    estado: 'ACTIVA', fecha_baja: null, creado_en: ahoraIso(), actualizado_en: ahoraIso(),
  };
  series.unshift(serie);
  return { serie, viajes: creados, salteadas, ajustadas: [] };
}

// Series de ejemplo: la de L-M-V de Martín (con 2425 mañana) y la diaria de Juan
(() => {
  const hoy = new Date();
  const hasta = new Date(); hasta.setDate(hoy.getDate() + 30);
  crearSerieDev({ id_conductor: 4, frecuencia: 'DIAS_SEMANA', dias_semana: [1, 3, 5], hora: '07:00', fecha_desde: fechaIso(hoy), fecha_hasta: fechaIso(hasta), paradas: [{ id_lugar: 1 }, { direccion: 'Av. Mitre 1450, Vicente López', lat: -34.5266, lng: -58.4728 }, { id_lugar: 2 }], condiciones_requeridas: ['FRAGIL'] });
  crearSerieDev({ id_conductor: 5, frecuencia: 'DIARIA', hora: '06:30', fecha_desde: fechaIso(hoy), fecha_hasta: fechaIso(new Date(hoy.getTime() + 24 * 86400000)), paradas: [{ id_lugar: 4 }, { direccion: 'Av. Rivadavia 6800, Flores, CABA', lat: -34.6294, lng: -58.4633 }], condiciones_requeridas: ['REFRIGERADO'] });
  // La primera de cada serie, confirmada, para que se vean las dos cosas
  [7, 8].forEach((s) => { const v = viajes.find((x) => x.id_serie === s); if (v) Object.assign(v, { estado: 'CONFIRMADO', vehiculo: s === 7 ? transit : daily, fecha_confirmacion: ahoraIso() }); });
})();

const GRUPOS = {
  activos: ['ASIGNADO', 'CONFIRMADO', 'CARGANDO', 'EN_RUTA', 'DESCARGANDO'],
  en_curso: ['CARGANDO', 'EN_RUTA', 'DESCARGANDO'],
  historial: ['FINALIZADO', 'RECHAZADO', 'VENCIDO', 'CANCELADO'],
};
const buscar = (id) => {
  const v = viajes.find((x) => x.id_viaje === Number(id));
  if (!v) throw error(404, 'Viaje no encontrado');
  return v;
};
const conRuta = (v) => ({ ...v, ruta_planeada: null });

export const mock = {
  // Organización y personas
  organizacion: () => copia(ORG),
  editarOrganizacion(body) { Object.assign(ORG, body, { actualizado_en: ahoraIso() }); return copia(ORG); },
  miembros: () => copia(miembros),
  cambiarRol(idUsuario, rol) {
    const m = miembros.find((x) => x.id_usuario === Number(idUsuario));
    if (!m) throw error(404, 'Miembro no encontrado');
    if (rol === 'MIEMBRO' && m.rol === 'RESPONSABLE' && miembros.filter((x) => x.rol === 'RESPONSABLE').length === 1) {
      throw error(409, 'La PyME tiene que tener al menos un responsable activo: promove a otro miembro antes');
    }
    m.rol = rol;
    return { mensaje: 'Rol actualizado', id_usuario: m.id_usuario, rol };
  },
  eliminarMiembro(idUsuario) {
    miembros = miembros.filter((x) => x.id_usuario !== Number(idUsuario));
    return { mensaje: 'Miembro eliminado', id_usuario: Number(idUsuario) };
  },
  invitaciones: () => copia(invitaciones),
  crearInvitacion(tipo) {
    const inv = { id_invitacion: Date.now() % 100000, tipo, fecha_creacion: ahoraIso(), fecha_vencimiento: masMin(ahoraIso(), 72 * 60), creada_por: { id_usuario: 1, nombre: 'Ana', apellido: 'Ferreyra' } };
    invitaciones = [inv, ...invitaciones];
    return { ...copia(inv), codigo: tipo === 'CHOFER' ? 'GZ32F-JNQSR' : 'HK7PM-W4XT9' };
  },
  revocarInvitacion(id) {
    invitaciones = invitaciones.filter((x) => x.id_invitacion !== Number(id));
    return { mensaje: 'Invitacion revocada', id_invitacion: Number(id) };
  },
  choferes: () => copia(choferes),
  desvincularChofer(idConductor) {
    const i = choferes.findIndex((x) => x.id_conductor === Number(idConductor));
    if (i === -1) throw error(404, 'No hay un vinculo activo con ese chofer');
    choferes.splice(i, 1);
    const cancelados = viajes.filter((v) => v.id_conductor === Number(idConductor) && GRUPOS.activos.includes(v.estado));
    cancelados.forEach((v) => Object.assign(v, { estado: 'CANCELADO', causa_cancelacion: 'DESVINCULACION' }));
    const borradas = series.filter((s) => s.id_conductor === Number(idConductor) && s.estado === 'ACTIVA');
    borradas.forEach((s) => Object.assign(s, { estado: 'BORRADA', fecha_baja: ahoraIso() }));
    return { mensaje: 'Chofer desvinculado', id_conductor: Number(idConductor), viajes_cancelados: cancelados.map((v) => v.id_viaje), series_borradas: borradas.map((s) => s.id_serie) };
  },

  // Lugares guardados
  lugares: () => copia(lugares.filter((l) => l.activo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))),
  guardarLugar(id, body) {
    const choca = lugares.find((l) => l.activo && l.id_lugar !== id && l.nombre.toLowerCase() === body.nombre?.trim().toLowerCase());
    if (choca) throw error(400, 'Ya existe un lugar con ese nombre');
    if (id) {
      const l = lugares.find((x) => x.id_lugar === id && x.activo);
      if (!l) throw error(404, 'Lugar no encontrado');
      Object.assign(l, body, { actualizado_en: ahoraIso() });
      return copia(l);
    }
    const l = { id_lugar: Math.max(...lugares.map((x) => x.id_lugar)) + 1, id_organizacion: 1, activo: true, creado_en: ahoraIso(), actualizado_en: ahoraIso(), ...body, nombre: body.nombre.trim() };
    lugares.push(l);
    return copia(l);
  },
  borrarLugar(id) {
    const l = lugares.find((x) => x.id_lugar === Number(id) && x.activo);
    if (!l) throw error(404, 'Lugar no encontrado');
    l.activo = false;
    return { mensaje: 'Lugar borrado', id_lugar: l.id_lugar };
  },

  // Series
  series: ({ estado } = {}) => copia(series.filter((s) => !estado || s.estado === estado).map((s) => ({ ...s, resumen_viajes: resumen(s.id_serie) }))),
  serie(id) {
    const s = series.find((x) => x.id_serie === Number(id));
    if (!s) throw error(404, 'Serie no encontrada');
    return copia({ ...s, resumen_viajes: resumen(s.id_serie), viajes: viajes.filter((v) => v.id_serie === s.id_serie).sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada)) });
  },
  crearSerie: (body) => copia(crearSerieDev(body)),
  cancelarSerie(id) {
    const s = series.find((x) => x.id_serie === Number(id));
    if (!s) throw error(404, 'Serie no encontrada');
    if (s.estado !== 'ACTIVA') throw error(400, `No se puede cancelar una serie en estado ${s.estado}`);
    Object.assign(s, { estado: 'CANCELADA', fecha_baja: ahoraIso() });
    return { mensaje: 'Serie cancelada. Sus viajes no se modificaron', id_serie: s.id_serie, estado: 'CANCELADA', fecha_baja: s.fecha_baja };
  },

  // Viajes
  listar({ grupo, estado } = {}) {
    let r = viajes;
    if (grupo) r = r.filter((v) => GRUPOS[grupo].includes(v.estado));
    if (estado) r = r.filter((v) => v.estado === estado);
    return copia([...r].sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada)));
  },
  obtener: (id) => copia(conRuta(buscar(id))),
  estimar: ({ paradas, fecha_programada }) => estimarDev(paradas, fecha_programada),
  crear(body) { const v = nuevoViaje(body); viajes.push(v); return copia(v); },
  editar(id, body) {
    const v = buscar(id);
    if (!['ASIGNADO', 'CONFIRMADO'].includes(v.estado)) throw error(400, `No se puede editar un viaje en estado ${v.estado}`);
    const cond = body.condiciones_requeridas ?? v.condiciones_requeridas;
    validarConductor(v.id_conductor, cond);
    if (body.paradas || body.fecha_programada) {
      const fecha = body.fecha_programada ?? v.fecha_programada;
      const ps = body.paradas ? resolverParadas(body.paradas) : v.paradas.map((p) => ({ direccion: p.direccion, lat: p.latitud, lng: p.longitud, id_lugar: p.id_lugar }));
      const est = estimarDev(ps, fecha);
      Object.assign(v, { fecha_programada: fecha, paradas: ps.map((p, i) => parada(i + 1, p, est.tramos[i].llegada_estimada, 15)), precio_estimado: est.precio_estimado, estimado: { manejo_horas: est.estimado.manejo_horas, peon_horas: est.estimado.peon_horas, total_horas: est.estimado.total_horas, distancia_km: est.estimado.distancia_km } });
    }
    Object.assign(v, { condiciones_requeridas: cond, descripcion: body.descripcion !== undefined ? body.descripcion : v.descripcion, estado: 'ASIGNADO', vehiculo: null, fecha_confirmacion: null });
    return copia(v);
  },
  reasignar(id, idConductor) {
    const v = buscar(id);
    if (!['ASIGNADO', 'CONFIRMADO'].includes(v.estado)) throw error(400, `No se puede reasignar un viaje en estado ${v.estado}`);
    validarConductor(idConductor, v.condiciones_requeridas);
    Object.assign(v, { id_conductor: Number(idConductor), conductor: conductorDe(idConductor), estado: 'ASIGNADO', vehiculo: null, fecha_confirmacion: null });
    return copia(v);
  },
  cancelar(id, motivo) {
    const v = buscar(id);
    if (GRUPOS.historial.includes(v.estado)) throw error(400, `No se puede cancelar un viaje en estado ${v.estado}`);
    Object.assign(v, { estado: 'CANCELADO', causa_cancelacion: 'ORGANIZACION', motivo_cancelacion: motivo ?? null });
    return { mensaje: 'Viaje cancelado', id_viaje: v.id_viaje, estado: 'CANCELADO', causa_cancelacion: 'ORGANIZACION' };
  },
  finalizar(id) {
    const v = buscar(id);
    if (v.estado === 'FINALIZADO') throw error(409, 'El viaje ya fue cerrado por el chofer');
    const ultima = v.paradas[v.paradas.length - 1];
    if (!ultima.llegada_real) throw error(409, 'El chofer todavia no llego a la ultima parada: no se puede finalizar el viaje');
    Object.assign(v, { estado: 'FINALIZADO', cierre: { ...v.cierre, cerrado_por: 'ORGANIZACION' }, precio_real: v.precio_estimado, remito_url: 'https://example.com/remito.pdf' });
    return { mensaje: 'Viaje finalizado', id_viaje: v.id_viaje, estado: 'FINALIZADO', cerrado_por: 'ORGANIZACION' };
  },
  remito(id) {
    const v = buscar(id);
    if (v.estado !== 'FINALIZADO') throw error(400, 'El remito solo esta disponible para viajes finalizados');
    return { remito_url: v.remito_url };
  },

  // Lo que en la app real llega por socket: alertas del día para la pestaña Alertas
  alertasDelDia() {
    const s = v2419.paradas[0].salida_real;
    return [
      { id: 'dev-desvio', tipo: 'desvio', id_viaje: 2419, fecha: masMin(s, 6), titulo: 'Martín se desvió de la ruta', texto: 'VJ-2419, 450 m. El sistema recalculó la ruta.', nueva: true },
      { id: 'dev-tarde', tipo: 'tarde', id_viaje: 2419, fecha: s, titulo: 'VJ-2419 salió 22 min tarde', texto: 'Martín dejó Depósito Pilar.', nueva: true },
      { id: 'dev-entregado', tipo: 'entregado', id_viaje: 2418, fecha: viajes.find((v) => v.id_viaje === 2418).paradas[1].salida_real, titulo: 'VJ-2418 entregado', texto: 'El remito ya está listo.' },
      { id: 'dev-confirmado', tipo: 'confirmado', id_viaje: 2421, fecha: masMin(ahoraIso(), -300), titulo: 'Martín confirmó VJ-2421', texto: 'Lo hace con la Ford Transit.' },
    ];
  },
};
