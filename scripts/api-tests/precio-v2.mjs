#!/usr/bin/env node
// Prueba de punta a punta del "Precio v2" del backend (API.md de develop, sección "Precio v2 de
// los viajes de PyME") desde el lado de la app mobile: la empresa estima y crea un viaje con los
// datos nuevos, el conductor lo hace entero sin ver precios ni datos personales, y la empresa
// carga el precio pagado al final.
//
// Uso:
//   BASE_URL=https://nombre-proyecto-back-staging.up.railway.app FIREBASE_API_KEY=AIza... \
//   NODE_USE_ENV_PROXY=1 node scripts/api-tests/precio-v2.mjs
//
// Espera ~2 minutos a que abra la ventana de inicio. Crea cuentas y una empresa que no se borran:
// solo staging o local, nunca producción. Usa 1 canje de invitación.

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.env.BASE_URL || '').replace(/\/$/, '');
const KEY = process.env.FIREBASE_API_KEY || '';
if (!BASE) { console.error('Falta BASE_URL'); process.exit(2); }
if (!KEY) { console.error('Falta FIREBASE_API_KEY'); process.exit(2); }
if (/production|prod\./i.test(BASE) && !/staging/i.test(BASE)) { console.error('Esto no se corre contra producción'); process.exit(2); }

// ── Helpers (los mismos que mobile.mjs) ───────────────────────────────────
const resultados = [];
const notas = [];
let grupo = '';
const seccion = (nombre) => { grupo = nombre; console.log(`\n▸ ${nombre}`); };
const nota = (t) => { notas.push(t); console.log(`  · ${t}`); };
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

function registrar(nombre, ok, detalle = '') {
  resultados.push({ grupo, nombre, ok, detalle });
  console.log(`  ${ok ? '✔' : '✘'} ${nombre}${ok || !detalle ? '' : `\n      ${detalle}`}`);
  return ok;
}

async function api(usuario, method, ruta, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (usuario) headers.Authorization = `Bearer ${usuario.token}`;
  const pedir = () => fetch(BASE + ruta, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let res;
  try { res = await pedir(); } catch (e) {
    console.log(`  (error de red en ${method} ${ruta}: ${e.cause?.code || e.message}; reintento)`);
    await dormir(3000);
    res = await pedir();
  }
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

function espera(nombre, r, status, textoError) {
  let ok = r.status === status;
  if (ok && textoError) ok = typeof r.body?.error === 'string' && r.body.error.toLowerCase().includes(textoError.toLowerCase());
  return registrar(nombre, ok, `esperaba ${status}${textoError ? ` "${textoError}"` : ''}, llegó ${r.status} ${JSON.stringify(r.body).slice(0, 300)}`);
}

const seg = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const PASS = 'Prueba1234';

async function login(email) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error(`Login Firebase falló para ${email}: ${JSON.stringify(j)}`);
  return j.idToken;
}

async function crearUsuario(tipo, etiqueta) {
  const email = `fleter-mobile-${etiqueta.toLowerCase()}-${seg()}@example.com`;
  const dni = String(10000000 + Math.floor(Math.random() * 89999999));
  const base = { nombre: etiqueta, apellido: 'Prueba', dni, email, contrasena: PASS, telefono: '+5491100000000' };
  const alta = () => tipo === 'CLIENTE'
    ? api(null, 'POST', '/api/auth/registro-cliente', base)
    : api(null, 'POST', '/api/auth/registro-conductor', { ...base, nro_licencia: `LIC${dni}`, licencia_vencimiento: '2028-12-31T00:00:00.000Z' });
  let r = await alta();
  if (r.status >= 500) { await dormir(5000); r = await alta(); }
  if (r.status !== 201) throw new Error(`No se pudo registrar ${etiqueta}: ${r.status} ${JSON.stringify(r.body)}`);
  const u = { etiqueta, email, dni, token: await login(email) };
  const me = await api(u, 'GET', '/api/auth/me');
  if (me.status !== 200) throw new Error(`/me falló para ${etiqueta}: ${me.status}`);
  u.me = me.body;
  return u;
}

function cuitValido() {
  const w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  for (;;) {
    const base = '30' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
    const s = [...base].reduce((a, d, i) => a + Number(d) * w[i], 0);
    let dv = 11 - (s % 11);
    if (dv === 11) dv = 0;
    if (dv === 10) continue;
    return base + dv;
  }
}

const LETRAS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const patente = () => Array.from({ length: 2 }, () => LETRAS[Math.floor(Math.random() * 23)]).join('')
  + String(Math.floor(Math.random() * 1000)).padStart(3, '0') + Array.from({ length: 2 }, () => LETRAS[Math.floor(Math.random() * 23)]).join('');

const ORIGEN = { lat: -34.6037, lng: -58.3816, direccion: 'Plaza de Mayo, CABA' };
const DESTINO = { lat: -34.5895, lng: -58.3974, direccion: 'Recoleta, CABA' };
const PROVINCIA = { lat: -34.4708, lng: -58.5286, direccion: 'San Isidro, Buenos Aires' };
const enMin = (min) => new Date(Date.now() + min * 60000).toISOString();
const pesos = (n) => (n == null ? '—' : `$${Number(n).toLocaleString('es-AR')}`);
const cerca = (a, b, tol = 1000) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol;

// Campos que el conductor no puede recibir nunca (API.md, "El chofer no ve precios")
const PROHIBIDOS_CHOFER = ['precio_estimado', 'precio_real', 'tarifa_hora', 'tarifa_km', 'tiempo_capital',
  'distancia_provincia', 'id_creador', 'id_cliente', 'creador', 'cliente', 'empresa', 'version_precio',
  'precio_parametros', 'precio_estimado_desglose', 'precio_estimado_min', 'precio_estimado_max', 'precio_medido',
  'precio_medido_desglose', 'peajes_estimados', 'fuente_peajes', 'precio_pagado', 'precio_pagado_pendiente', 'desglose'];
const filtrados = (obj) => PROHIBIDOS_CHOFER.filter((k) => obj && k in obj);
// Busca en todo el objeto (anidado) claves de precio o datos personales del creador
function fugas(obj, ruta = '') {
  if (!obj || typeof obj !== 'object') return [];
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const r = ruta ? `${ruta}.${k}` : k;
    // fecha_corte_precio es una hora (cuándo se cortó el reloj del precio), no un monto
    if (/precio|tarifa|desglose|peaje/i.test(k) && k !== 'fecha_corte_precio') out.push(r);
    if (/^(email|dni)$/i.test(k)) out.push(r);
    out.push(...fugas(v, r));
  }
  return out;
}

// Comprueba la aritmética de un desglose v2 contra la fórmula de API.md
function cuentasV2(d) {
  if (!d || d.version !== 2) return 'no es un desglose v2';
  const sub = d.precio_base + d.recargo_provincia + d.recargo_escalera + d.monto_paradas_extra;
  if (!cerca(d.subtotal_sin_iva, sub, 1)) return `subtotal ${d.subtotal_sin_iva} ≠ ${sub}`;
  if (!cerca(d.precio_base, Math.max(d.tiempo, d.distancia), 1)) return `precio_base ${d.precio_base} ≠ max(tiempo, distancia)`;
  if (d.factura_a && !cerca(d.iva, Math.round(d.subtotal_sin_iva * 0.21), 2)) return `iva ${d.iva} ≠ 21% de ${d.subtotal_sin_iva}`;
  if (!d.factura_a && d.iva !== 0) return `iva ${d.iva} sin factura A`;
  if (!cerca(d.total, d.subtotal_sin_iva + d.iva + d.peajes, 500)) return `total ${d.total} ≠ subtotal + iva + peajes`;
  if (d.total % 1000 !== 0) return `total ${d.total} no está redondeado a $1.000`;
  if (!cerca(d.bajo, d.total * 0.8, 500) || !cerca(d.alto, d.total * 1.3, 500)) return `rango ${d.bajo}–${d.alto} no es −20 % / +30 % de ${d.total}`;
  return '';
}

// ── Socket (handshake con el token, como services/socket.js) ───────────────
let io = null; let agente;
try {
  const req = createRequire(new URL('../../package.json', import.meta.url));
  io = req('socket.io-client').io;
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxy) { const { HttpsProxyAgent } = req('https-proxy-agent'); agente = new HttpsProxyAgent(proxy); }
} catch (e) { console.log(`(sin prueba de socket: ${e.message})`); }

function conectar(usuario) {
  return new Promise((ok) => {
    const s = io(BASE, { auth: { token: `Bearer ${usuario.token}` }, transports: ['websocket'], reconnection: false, agent: agente, timeout: 15000 });
    const eventos = [];
    s.onAny((nombre, data) => eventos.push({ nombre, data }));
    s.on('connect', () => ok({ s, eventos, error: null }));
    s.on('connect_error', (err) => { ok({ s, eventos, error: err }); s.close(); });
  });
}

// ── Pruebas ────────────────────────────────────────────────────────────────
async function main() {
  seccion('Preparación');
  const E = await crearUsuario('CLIENTE', 'Empresa');
  const org = await api(E, 'POST', '/api/organizaciones', { nombre: `Fleter Mobile ${seg()}`, cuit: cuitValido() });
  espera('crear la empresa', org, 201);
  const A = org.body.id_organizacion;
  const C = await crearUsuario('CONDUCTOR', 'Conductor');
  const veh = await api(C, 'POST', '/api/conductores/mis-vehiculos', { patente: patente(), marca: 'Ford', modelo: 'Transit', anio: 2022, color: 'Blanco', tipo_vehiculo: 'utilitario' });
  espera('vehículo del conductor', veh, 201);
  const VEH = veh.body?.id_vehiculo;
  const inv = await api(E, 'POST', `/api/organizaciones/${A}/invitaciones`, { tipo: 'CHOFER' });
  espera('vincular al conductor', await api(C, 'POST', '/api/invitaciones/canjear', { codigo: inv.body?.codigo }), 200);
  const ch = await api(E, 'GET', `/api/organizaciones/${A}/choferes`);
  const IDC = ch.body?.find?.((c) => c.id_usuario === C.me.id_usuario)?.id_conductor;

  seccion('Estimar el precio (lo que ve la empresa al pedir un viaje)');
  const viejo = await api(E, 'POST', '/api/viajes/estimar-costo', { paradas: [ORIGEN, DESTINO], fecha_programada: enMin(120) });
  const basico = await api(E, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [ORIGEN, DESTINO], fecha_programada: enMin(120) });
  registrar('estimar-precio responde v2 con total y rango', basico.status === 200 && basico.body?.version_precio === 2
    && typeof basico.body?.total === 'number' && basico.body.bajo < basico.body.total && basico.body.alto > basico.body.total,
  `${basico.status} ${JSON.stringify(basico.body).slice(0, 300)}`);
  registrar('el desglose cierra con la fórmula', !cuentasV2(basico.body?.desglose), cuentasV2(basico.body?.desglose));
  registrar('viaje corto en CABA: manda el mínimo de 2 horas (régimen TIEMPO)', basico.body?.desglose?.regimen === 'TIEMPO' && basico.body?.desglose?.horas_facturables === 2, JSON.stringify({ regimen: basico.body?.desglose?.regimen, h: basico.body?.desglose?.horas_facturables }));
  nota(`Plaza de Mayo → Recoleta: endpoint viejo (el que usa hoy la app) ${pesos(viejo.body?.precio_estimado)}; v2 ${pesos(basico.body?.total)} (${pesos(basico.body?.bajo)} a ${pesos(basico.body?.alto)})`);

  const completo = { paradas: [ORIGEN, { ...DESTINO, acceso: 'ESCALERA', pisos: 3, operacion: 'DESCARGA' }], fecha_programada: enMin(120),
    tipo_servicio: 'LIVIANO', ayudantes: 1, factura_a: true, peajes_estimados: 1200 };
  const full = await api(E, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, completo);
  const d = full.body?.desglose;
  registrar('con ayudante, escalera, factura A y peajes: el desglose cierra', full.status === 200 && !cuentasV2(d), `${full.status} ${cuentasV2(d)} ${JSON.stringify(d).slice(0, 300)}`);
  registrar('suma el ayudante, el 25 % de escalera, el IVA y los peajes', d?.costo_ayudantes > 0 && d?.recargo_escalera > 0 && d?.iva > 0 && d?.peajes === 1200 && full.body?.peajes?.fuente === 'PYME',
    JSON.stringify({ ayud: d?.costo_ayudantes, esc: d?.recargo_escalera, iva: d?.iva, peajes: d?.peajes, fuente: full.body?.peajes }));
  nota(`Mismo viaje con 1 ayudante, 3 pisos por escalera, factura A y $1.200 de peajes: ${pesos(full.body?.total)}`);

  const prov = await api(E, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [ORIGEN, PROVINCIA], fecha_programada: enMin(120) });
  const dp = prov.body?.desglose;
  registrar('a provincia: cierra la fórmula y aplica recargo solo en régimen TIEMPO', prov.status === 200 && !cuentasV2(dp)
    && (dp?.regimen === 'TIEMPO' ? dp?.recargo_provincia > 0 : dp?.recargo_provincia === 0), `${cuentasV2(dp)} ${JSON.stringify({ regimen: dp?.regimen, recargo: dp?.recargo_provincia, km: dp?.km_ida })}`);
  nota(`Plaza de Mayo → San Isidro (${dp?.km_ida} km): ${pesos(prov.body?.total)}, régimen ${dp?.regimen}`);

  const extra = await api(E, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [ORIGEN, DESTINO, PROVINCIA, ORIGEN], fecha_programada: enMin(120) });
  registrar('4 paradas: cobra 2 paradas extra', extra.body?.desglose?.paradas_extra === 2 && extra.body?.desglose?.monto_paradas_extra === 50000, JSON.stringify({ n: extra.body?.desglose?.paradas_extra, m: extra.body?.desglose?.monto_paradas_extra }));

  const est = (b) => api(E, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [ORIGEN, DESTINO], ...b });
  espera('EQUIPO con 1 ayudante → 400', await est({ tipo_servicio: 'EQUIPO', ayudantes: 1 }), 400, 'siempre 2');
  espera('LIVIANO con 2 ayudantes → 400', await est({ tipo_servicio: 'LIVIANO', ayudantes: 2 }), 400, 'como máximo 1');
  espera('escalera sin ayudante → 400', await api(E, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [ORIGEN, { ...DESTINO, acceso: 'ESCALERA', pisos: 2 }] }), 400, 'ayudante');
  espera('ascensor sin pisos → 400', await api(E, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [ORIGEN, { ...DESTINO, acceso: 'ASCENSOR' }] }), 400, 'pisos es obligatorio');
  const eq = await est({ tipo_servicio: 'EQUIPO', ayudantes: 2 });
  registrar('EQUIPO con 2 ayudantes es más caro que LIVIANO', eq.status === 200 && eq.body?.total > basico.body?.total, `${pesos(eq.body?.total)} vs ${pesos(basico.body?.total)}`);
  const cam = await est({ tipo_servicio: 'CAMION' });
  registrar('CAMION responde', cam.status === 200 && !cuentasV2(cam.body?.desglose), `${cam.status} ${cuentasV2(cam.body?.desglose)}`);
  nota(`Plaza de Mayo → Recoleta por servicio: LIVIANO ${pesos(basico.body?.total)} · EQUIPO ${pesos(eq.body?.total)} · CAMION ${pesos(cam.body?.total)}`);

  seccion('Factura A por defecto y lugares con acceso');
  const pf = await api(E, 'PUT', `/api/organizaciones/${A}`, { factura_a_por_defecto: true });
  registrar('la empresa guarda factura A por defecto', pf.status === 200 && pf.body?.factura_a_por_defecto === true, `${pf.status} ${JSON.stringify(pf.body).slice(0, 200)}`);
  const porDef = await api(E, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [ORIGEN, DESTINO], fecha_programada: enMin(120) });
  registrar('sin mandar factura_a, usa la de la empresa (suma IVA)', porDef.body?.desglose?.factura_a === true && porDef.body?.desglose?.iva > 0, JSON.stringify({ fa: porDef.body?.desglose?.factura_a, iva: porDef.body?.desglose?.iva }));
  const lug = await api(E, 'POST', `/api/organizaciones/${A}/lugares`, { nombre: 'Cliente con escalera', ...DESTINO, acceso_por_defecto: 'ESCALERA', pisos_por_defecto: 2 });
  registrar('lugar con acceso y pisos por defecto', lug.status === 201 && lug.body?.acceso_por_defecto === 'ESCALERA' && lug.body?.pisos_por_defecto === 2, `${lug.status} ${JSON.stringify(lug.body).slice(0, 200)}`);
  espera('viaje a ese lugar sin ayudante → 400 (copia la escalera)', await api(E, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [ORIGEN, { id_lugar: lug.body?.id_lugar }] }), 400, 'ayudante');

  seccion('Crear el viaje con los datos nuevos');
  let sockC = null; let sockE = null;
  if (io) {
    sockC = await conectar(C); sockE = await conectar(E);
    registrar('conductor y empresa conectados por socket', !sockC.error && !sockE.error, `${sockC.error?.message ?? ''} ${sockE.error?.message ?? ''}`);
  }
  const cuerpo = {
    id_conductor: IDC, fecha_programada: enMin(62), motivo: 'Entrega a cliente', descripcion: 'Subir por la escalera del fondo',
    paradas: [ORIGEN, { ...DESTINO, acceso: 'ESCALERA', pisos: 3, operacion: 'DESCARGA' }],
    tipo_servicio: 'LIVIANO', ayudantes: 1, factura_a: false, peajes_estimados: 0,
    tipo_carga: 'FRAGIL', bultos: 12, peso_kg: 180, volumen_m3: 2.5, pallets: 0, valor_declarado: 900000,
  };
  const v = await api(E, 'POST', `/api/organizaciones/${A}/viajes`, cuerpo);
  espera('crear el viaje', v, 201);
  const T = v.body?.id_viaje;
  const ps = v.body?.paradas ?? [];
  registrar('se crea en v2 con precio, rango y desglose', v.body?.version_precio === 2 && typeof v.body?.precio_estimado === 'number'
    && v.body?.precio_estimado_min < v.body?.precio_estimado && v.body?.precio_estimado_max > v.body?.precio_estimado && !cuentasV2(v.body?.desglose_estimado),
  JSON.stringify({ ver: v.body?.version_precio, p: v.body?.precio_estimado, min: v.body?.precio_estimado_min, max: v.body?.precio_estimado_max, err: cuentasV2(v.body?.desglose_estimado) }));
  registrar('guarda lo declarado (servicio, carga, acceso por parada)', v.body?.tipo_servicio === 'LIVIANO' && v.body?.tipo_carga === 'FRAGIL' && v.body?.bultos === 12
    && ps[1]?.acceso === 'ESCALERA' && ps[1]?.pisos === 3, JSON.stringify({ s: v.body?.tipo_servicio, c: v.body?.tipo_carga, p: ps.map((p) => [p.acceso, p.pisos]) }));
  const ed = await api(E, 'PUT', `/api/organizaciones/${A}/viajes/${T}`, { ayudantes: 1, peajes_estimados: 2500 });
  registrar('editar los peajes recalcula el precio', ed.status === 200 && cerca(ed.body?.precio_estimado - v.body?.precio_estimado, 2500, 500),
    `${ed.status} ${pesos(v.body?.precio_estimado)} → ${pesos(ed.body?.precio_estimado)}`);
  nota(`Viaje creado: VJ-${T}, ${pesos(ed.body?.precio_estimado ?? v.body?.precio_estimado)} (${pesos(ed.body?.precio_estimado_min ?? v.body?.precio_estimado_min)} a ${pesos(ed.body?.precio_estimado_max ?? v.body?.precio_estimado_max)})`);

  seccion('Lo que ve el conductor (sin precios ni datos personales)');
  await dormir(1500);
  if (sockC && !sockC.error) {
    const asig = sockC.eventos.find((e) => e.nombre === 'viaje:asignado' && Number(e.data?.id_viaje ?? e.data?.viaje?.id_viaje) === T);
    registrar('viaje:asignado le llega sin precio', !!asig && fugas(asig.data).length === 0, asig ? `trae: ${fugas(asig.data).join(', ')}` : `eventos: ${sockC.eventos.map((e) => e.nombre).join(', ')}`);
    const asigE = sockE?.eventos.find((e) => e.nombre === 'viaje:asignado' && Number(e.data?.id_viaje ?? e.data?.viaje?.id_viaje) === T);
    if (asigE) registrar('a la empresa sí le llega con precio', JSON.stringify(asigE.data).includes('precio_estimado'), JSON.stringify(asigE.data).slice(0, 200));
  }
  const lista = await api(C, 'GET', '/api/choferes/viajes');
  const enLista = lista.body?.find?.((x) => x.id_viaje === T);
  registrar('la lista no trae precios ni datos del creador', !!enLista && fugas(enLista).length === 0 && filtrados(enLista).length === 0, `trae: ${[...fugas(enLista), ...filtrados(enLista)].join(', ')}`);
  const det = await api(C, 'GET', `/api/choferes/viajes/${T}`);
  registrar('el detalle tampoco', det.status === 200 && fugas(det.body).length === 0 && filtrados(det.body).length === 0, `trae: ${[...fugas(det.body), ...filtrados(det.body)].join(', ')}`);
  const txt = JSON.stringify(det.body ?? {});
  registrar('no aparece el email ni el DNI de la empresa en ningún lado', !txt.includes(E.email) && !txt.includes(E.dni), 'aparece el email o el DNI del usuario de la empresa');
  registrar('sí trae lo operativo (servicio, ayudantes, carga, acceso y pisos)', det.body?.tipo_servicio === 'LIVIANO' && det.body?.ayudantes === 1 && det.body?.tipo_carga === 'FRAGIL'
    && det.body?.paradas?.[1]?.acceso === 'ESCALERA' && det.body?.paradas?.[1]?.pisos === 3, JSON.stringify({ s: det.body?.tipo_servicio, a: det.body?.ayudantes, c: det.body?.tipo_carga, p: det.body?.paradas?.map((p) => [p.acceso, p.pisos]) }));
  const gen = await api(C, 'GET', `/api/viajes/${T}`);
  registrar('GET /api/viajes/:id tampoco trae precio', gen.status === 200 && fugas(gen.body).length === 0, `${gen.status} trae: ${fugas(gen.body).join(', ')}`);
  espera('confirmar con su vehículo', await api(C, 'POST', `/api/choferes/viajes/${T}/confirmar`, { id_vehiculo: VEH }), 200);

  seccion('Hacer el viaje');
  console.log('  (esperando a que abra la ventana de inicio…)');
  let ini;
  for (let i = 0; i < 12; i++) {
    await dormir(20000);
    ini = await api(C, 'POST', `/api/choferes/viajes/${T}/iniciar`, { lat: ORIGEN.lat, lng: ORIGEN.lng });
    if (ini.status === 200 || !/ventana|todavia|a partir de/i.test(ini.body?.error ?? '')) break;
  }
  espera('iniciar en el origen', ini, 200);
  espera('costo-acumulado del conductor → 403', await api(C, 'GET', `/api/viajes/${T}/costo-acumulado`), 403, 'no esta disponible para el chofer');
  const vivo = await api(E, 'GET', `/api/organizaciones/${A}/viajes/${T}/costo-acumulado`);
  registrar('la empresa sí ve el costo en vivo (v2, mayor a $0)', vivo.status === 200 && vivo.body?.version_precio === 2 && (vivo.body?.costo_actual ?? vivo.body?.desglose?.total ?? 0) > 0,
    `${vivo.status} ${JSON.stringify(vivo.body).slice(0, 300)}`);
  espera('salir del origen', await api(C, 'POST', `/api/choferes/viajes/${T}/salir`), 200);
  const lleg = await api(C, 'POST', `/api/viajes/${T}/confirmar-parada`, { id_parada: ps[1]?.id_parada, lat: DESTINO.lat, lng: DESTINO.lng });
  registrar('llegar a la última', lleg.status === 200 && lleg.body?.estado === 'DESCARGANDO', `${lleg.status} ${JSON.stringify(lleg.body).slice(0, 200)}`);
  const fin = await api(C, 'POST', `/api/choferes/viajes/${T}/salir`);
  registrar('salir de la última: finaliza con remito y sin precio_real', fin.status === 200 && fin.body?.viaje_finalizado === true && !!fin.body?.remito_url && fugas(fin.body).length === 0,
    `${fin.status} ${JSON.stringify(fin.body).slice(0, 300)}`);

  await dormir(2500);
  if (sockC && !sockC.error) {
    const fc = sockC.eventos.find((e) => e.nombre === 'viaje:finalizado' && Number(e.data?.id_viaje) === T);
    registrar('viaje:finalizado al conductor sin precio ni desglose', !!fc && fugas(fc.data).length === 0, fc ? `trae: ${fugas(fc.data).join(', ')}` : 'no llegó');
    const costoC = sockC.eventos.filter((e) => e.nombre === 'costo:actualizar');
    registrar('el conductor no recibe costo:actualizar', costoC.length === 0, `${costoC.length} eventos`);
    const fe = sockE?.eventos.find((e) => e.nombre === 'viaje:finalizado' && Number(e.data?.id_viaje) === T);
    registrar('la empresa recibe viaje:finalizado con precio_pagado_pendiente', fe?.data?.precio_pagado_pendiente === true, JSON.stringify(fe?.data ?? 'no llegó').slice(0, 300));
    sockC.s.close(); sockE?.s.close();
  }

  seccion('Precio final y remito');
  const dE = await api(E, 'GET', `/api/organizaciones/${A}/viajes/${T}`);
  const dm = dE.body?.precio_medido_desglose;
  registrar('sin GPS el precio no sale $0 (usa la distancia estimada)', dE.body?.precio_real > 0 && ['ESTIMADA', 'ESTIMADA_PARCIAL', 'GPS'].includes(dm?.entradas?.fuente_km),
    JSON.stringify({ real: dE.body?.precio_real, fuente: dm?.entradas?.fuente_km, pings: dm?.entradas?.pings }));
  registrar('el desglose medido cierra con la fórmula', !cuentasV2(dm), cuentasV2(dm));
  registrar('queda pendiente el precio pagado', dE.body?.precio_pagado_pendiente === true && dE.body?.precio_pagado === null, JSON.stringify({ pend: dE.body?.precio_pagado_pendiente, pp: dE.body?.precio_pagado }));
  nota(`Precio final: ${pesos(dE.body?.precio_real)} (estimado ${pesos(dE.body?.precio_estimado)}), km ${dm?.entradas?.fuente_km}`);

  const rem = await api(E, 'GET', `/api/organizaciones/${A}/viajes/${T}/remito`);
  if (rem.body?.remito_url) {
    try {
      const pdf = Buffer.from(await (await fetch(rem.body.remito_url)).arrayBuffer());
      const dir = mkdtempSync(join(tmpdir(), 'remito-'));
      writeFileSync(join(dir, 'r.pdf'), pdf);
      const texto = execFileSync('pdftotext', [join(dir, 'r.pdf'), '-'], { encoding: 'utf8' });
      registrar('el remito no muestra precio', !/total|\$\s?\d|costo|precio/i.test(texto), texto.slice(0, 400).replace(/\s+/g, ' '));
    } catch (e) { nota(`no pude leer el remito (${e.message})`); }
  } else registrar('la empresa obtiene el remito', false, JSON.stringify(rem.body));

  seccion('Feedback del precio pagado');
  const pend = await api(E, 'GET', `/api/organizaciones/${A}/viajes/precio-pagado/pendientes`);
  registrar('aparece en pendientes', pend.status === 200 && pend.body?.viajes?.some?.((x) => x.id_viaje === T), `${pend.status} ${JSON.stringify(pend.body).slice(0, 300)}`);
  const ruta = `/api/organizaciones/${A}/viajes/${T}/precio-pagado`;
  espera('el conductor no puede cargarlo → 403', await api(C, 'PUT', ruta, { monto: 1000, incluye_iva: false }), 403);
  espera('monto 0 → 400', await api(E, 'PUT', ruta, { monto: 0, incluye_iva: false }), 400);
  espera('sin incluye_iva → 400', await api(E, 'PUT', ruta, { monto: 1000 }), 400);
  const pp = await api(E, 'PUT', ruta, { monto: 150000, incluye_iva: false, monto_peajes: 2500, metodo_pago: 'TRANSFERENCIA', ayudantes_reales: 1, comentario: 'Pagado al conductor' });
  registrar('cargar lo pagado → 201', pp.status === 201 && pp.body?.creado === true && pp.body?.precio_pagado?.monto === 150000, `${pp.status} ${JSON.stringify(pp.body).slice(0, 300)}`);
  const pp2 = await api(E, 'PUT', ruta, { monto: 160000, incluye_iva: false });
  registrar('corregirlo → 200 y lo opcional queda null', pp2.status === 200 && pp2.body?.precio_pagado?.monto === 160000 && pp2.body?.precio_pagado?.metodo_pago === null, `${pp2.status} ${JSON.stringify(pp2.body).slice(0, 300)}`);
  const pend2 = await api(E, 'GET', `/api/organizaciones/${A}/viajes/precio-pagado/pendientes`);
  registrar('sale de pendientes', !pend2.body?.viajes?.some?.((x) => x.id_viaje === T), JSON.stringify(pend2.body).slice(0, 200));
  const otro = await api(E, 'POST', `/api/organizaciones/${A}/viajes`, { ...cuerpo, fecha_programada: enMin(24 * 60) });
  espera('en un viaje sin terminar → 400', await api(E, 'PUT', `/api/organizaciones/${A}/viajes/${otro.body?.id_viaje}/precio-pagado`, { monto: 1000, incluye_iva: false }), 400, 'finalizado');
  await api(E, 'POST', `/api/organizaciones/${A}/viajes/${otro.body?.id_viaje}/cancelar`, { motivo: 'Prueba del mobile' });
}

main()
  .catch((e) => registrar('la prueba no pudo seguir', false, e.stack || e.message))
  .finally(() => {
    const fallas = resultados.filter((r) => !r.ok);
    console.log(`\n${resultados.length - fallas.length}/${resultados.length} pruebas bien.`);
    fallas.forEach((f) => console.log(`  ✘ [${f.grupo}] ${f.nombre}\n      ${f.detalle}`));
    if (notas.length) { console.log('\nNúmeros:'); notas.forEach((n) => console.log(`  · ${n}`)); }
    process.exit(fallas.length ? 1 : 0);
  });
