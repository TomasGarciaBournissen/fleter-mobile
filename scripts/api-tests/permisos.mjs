#!/usr/bin/env node
// Sistema de permisos de la PyME (backend develop, «Dueño y permisos»): un único dueño,
// permisos VER_VIAJES / GESTIONAR_VIAJES / ANALYTICS / CHOFERES para el resto, invitaciones
// con permisos, transferir la propiedad, historial, analytics, el evento
// organizacion:permisos_actualizados y desvincular con un viaje en curso (409 + vista previa).
// Solo staging o local, nunca producción.
//
// Uso:
//   BASE_URL=https://nombre-proyecto-back-staging.up.railway.app FIREBASE_API_KEY=AIza... \
//   NODE_USE_ENV_PROXY=1 node scripts/api-tests/permisos.mjs
//
// Crea 5 cuentas y 1 empresa que no se borran, y un viaje que se hace entero (~2 min de espera).

import { createRequire } from 'node:module';
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
const LA_PLATA = { lat: -34.9214, lng: -57.9545, direccion: 'Plaza Moreno, La Plata' }; // por la autopista, con peaje
const enMin = (min) => new Date(Date.now() + min * 60000).toISOString();
const pesos = (n) => (n == null ? '—' : `$${Number(n).toLocaleString('es-AR')}`);
const cerca = (a, b, tol = 1000) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol;

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


const no = (r) => r.status >= 400 && r.status < 500 && r.status !== 429;
function bloqueado(nombre, r) {
  return registrar(nombre, no(r), `llegó ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
}
// Claves de precio o datos personales en cualquier nivel (lo que el conductor no puede recibir)
function fugas(obj, ruta = '') {
  if (!obj || typeof obj !== 'object') return [];
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const r = ruta ? `${ruta}.${k}` : k;
    if (/precio|tarifa|desglose|peaje/i.test(k) && k !== 'fecha_corte_precio') out.push(r);
    if (/^(email|dni)$/i.test(k)) out.push(r);
    out.push(...fugas(v, r));
  }
  return out;
}

const TODOS = ['VER_VIAJES', 'GESTIONAR_VIAJES', 'ANALYTICS', 'CHOFERES'];
const mismo = (a, b) => JSON.stringify([...(a ?? [])].sort()) === JSON.stringify([...b].sort());
const recibio = (sock, nombre, filtro = () => true) => sock?.eventos.find((e) => e.nombre === nombre && filtro(e.data));
const deViaje = (T) => (d) => Number(d?.id_viaje ?? d?.viaje?.id_viaje) === T;

async function main() {
  seccion('Preparación');
  const D = await crearUsuario('CLIENTE', 'Dueno');
  const M = await crearUsuario('CLIENTE', 'Miembro');      // entra con los permisos por defecto
  const S = await crearUsuario('CLIENTE', 'SinPermisos');  // entra sin ninguno
  const X = await crearUsuario('CLIENTE', 'Ajeno');        // de ninguna empresa
  const C = await crearUsuario('CONDUCTOR', 'Conductor');
  const org = await api(D, 'POST', '/api/organizaciones', { nombre: `Fleter Mobile ${seg()}`, cuit: cuitValido() });
  espera('crear la empresa', org, 201);
  const A = org.body.id_organizacion;
  const O = `/api/organizaciones/${A}`;
  const veh = await api(C, 'POST', '/api/conductores/mis-vehiculos', { patente: patente(), marca: 'Ford', modelo: 'Transit', anio: 2022, color: 'Blanco', tipo_vehiculo: 'utilitario' });
  const VEH = veh.body?.id_vehiculo;

  seccion('El dueño');
  registrar('crear la empresa devuelve es_dueno, mis_permisos y el dueño', org.body?.es_dueno === true && mismo(org.body?.mis_permisos, TODOS) && org.body?.dueno?.id_usuario === D.me.id_usuario,
    JSON.stringify({ es_dueno: org.body?.es_dueno, p: org.body?.mis_permisos, dueno: org.body?.dueno }));
  const meD = await api(D, 'GET', '/api/auth/me');
  registrar('/me trae es_dueno y mis_permisos en la organización', meD.body?.organizacion?.es_dueno === true && mismo(meD.body?.organizacion?.mis_permisos, TODOS), JSON.stringify(meD.body?.organizacion));
  registrar('mi_rol / rol siguen existiendo (RESPONSABLE = dueño)', org.body?.mi_rol === 'RESPONSABLE' && meD.body?.organizacion?.rol === 'RESPONSABLE', `${org.body?.mi_rol} ${meD.body?.organizacion?.rol}`);

  seccion('Invitaciones de miembro con permisos');
  const invDef = await api(D, 'POST', `${O}/invitaciones`, { tipo: 'MIEMBRO' });
  registrar('sin permisos → ANALYTICS y VER_VIAJES', invDef.status === 201 && mismo(invDef.body?.permisos, ['ANALYTICS', 'VER_VIAJES']), `${invDef.status} ${JSON.stringify(invDef.body?.permisos)}`);
  const invSin = await api(D, 'POST', `${O}/invitaciones`, { tipo: 'MIEMBRO', permisos: [] });
  registrar('con permisos: [] → entra sin ninguno', invSin.status === 201 && mismo(invSin.body?.permisos, []), `${invSin.status} ${JSON.stringify(invSin.body)}`);
  const invGest = await api(D, 'POST', `${O}/invitaciones`, { tipo: 'MIEMBRO', permisos: ['GESTIONAR_VIAJES'] });
  registrar('elegir permisos al generar el código', invGest.status === 201 && invGest.body?.permisos?.includes('GESTIONAR_VIAJES'), `${invGest.status} ${JSON.stringify(invGest.body?.permisos)}`);
  bloqueado('un permiso que no existe → 4xx', await api(D, 'POST', `${O}/invitaciones`, { tipo: 'MIEMBRO', permisos: ['SER_DUENO'] }));
  const lista = await api(D, 'GET', `${O}/invitaciones`);
  registrar('la lista de invitaciones muestra los permisos', lista.status === 200 && lista.body?.some?.((i) => i.id_invitacion === invGest.body?.id_invitacion && Array.isArray(i.permisos)), JSON.stringify(lista.body?.[0] ?? lista.body).slice(0, 200));
  await api(D, 'DELETE', `${O}/invitaciones/${invGest.body?.id_invitacion}`);
  espera('M canjea (permisos por defecto)', await api(M, 'POST', '/api/invitaciones/canjear', { codigo: invDef.body?.codigo }), 200);
  const canjeS = await api(S, 'POST', '/api/invitaciones/canjear', { codigo: invSin.body?.codigo });
  espera('S canjea (sin permisos)', canjeS, 200);
  registrar('el canje devuelve es_dueno: false y los permisos del código', canjeS.body?.organizacion?.es_dueno === false && mismo(canjeS.body?.organizacion?.mis_permisos, []), JSON.stringify(canjeS.body?.organizacion));
  const meM = await api(M, 'GET', '/api/auth/me');
  registrar('/me del miembro: es_dueno false y sus permisos', meM.body?.organizacion?.es_dueno === false && mismo(meM.body?.organizacion?.mis_permisos, ['ANALYTICS', 'VER_VIAJES']), JSON.stringify(meM.body?.organizacion));
  const invC = await api(D, 'POST', `${O}/invitaciones`, { tipo: 'CHOFER' });
  espera('vincular al conductor', await api(C, 'POST', '/api/invitaciones/canjear', { codigo: invC.body?.codigo }), 200);
  const IDC = (await api(D, 'GET', `${O}/choferes`)).body?.find?.((c) => c.id_usuario === C.me.id_usuario)?.id_conductor;

  seccion('Un miembro sin permisos');
  const orgS = await api(S, 'GET', O);
  registrar('ve el nombre de la empresa y quién es el dueño', orgS.status === 200 && !!orgS.body?.nombre && orgS.body?.dueno?.id_usuario === D.me.id_usuario && orgS.body?.es_dueno === false,
    `${orgS.status} ${JSON.stringify(orgS.body).slice(0, 250)}`);
  const miembrosS = await api(S, 'GET', `${O}/miembros`);
  registrar('ve la lista de miembros', miembrosS.status === 200 && miembrosS.body?.length === 3, `${miembrosS.status} ${miembrosS.body?.length}`);
  registrar('sin email ni teléfono de los demás (solo el dueño los ve)', miembrosS.status === 200 && miembrosS.body.every((x) => !('email' in x) && !('telefono' in x)),
    JSON.stringify(miembrosS.body?.[0]).slice(0, 200));
  for (const [que, ruta, txt] of [['viajes', `${O}/viajes`, 'viajes'], ['choferes', `${O}/choferes`, 'choferes'], ['analytics', `${O}/analytics`, 'analytics'], ['series', `${O}/series`, 'viajes']]) {
    const r = await api(S, 'GET', ruta);
    registrar(`${que} → 403 con un mensaje que dice qué falta`, r.status === 403 && typeof r.body?.error === 'string' && r.body.error.toLowerCase().includes(txt), `${r.status} ${JSON.stringify(r.body).slice(0, 150)}`);
  }
  const lug = await api(S, 'GET', `${O}/lugares`);
  nota(`Lugares guardados sin permisos: ${lug.status}${lug.body?.error ? ` «${lug.body.error}»` : ''}`);
  const datos = await api(D, 'GET', O);
  registrar('solo el dueño ve el CUIT y los datos completos', 'cuit' in (datos.body ?? {}) , JSON.stringify(datos.body).slice(0, 150));
  nota(`Lo que ve S de la empresa: ${Object.keys(orgS.body ?? {}).join(', ')}`);

  seccion('Ver y gestionar viajes');
  espera('VER_VIAJES lista los viajes', await api(M, 'GET', `${O}/viajes`), 200);
  espera('VER_VIAJES ve los lugares guardados', await api(M, 'GET', `${O}/lugares`), 200);
  espera('VER_VIAJES no guarda lugares → 403', await api(M, 'POST', `${O}/lugares`, { nombre: `Depósito ${seg()}`, direccion: ORIGEN.direccion, lat: ORIGEN.lat, lng: ORIGEN.lng }), 403);
  const paradas = [ORIGEN, DESTINO];
  const crearM = await api(M, 'POST', `${O}/viajes`, { id_conductor: IDC, fecha_programada: enMin(3 * 24 * 60), motivo: 'Prueba', descripcion: 'Prueba de permisos', paradas });
  espera('VER_VIAJES no puede crear viajes → 403', crearM, 403, 'gestionar');
  espera('VER_VIAJES no puede estimar → 403', await api(M, 'POST', `${O}/viajes/estimar-precio`, { paradas, fecha_programada: enMin(3 * 24 * 60) }), 403);
  bloqueado('VER_VIAJES no ve los choferes', await api(M, 'GET', `${O}/choferes`));
  const an = await api(M, 'GET', `${O}/analytics`);
  espera('ANALYTICS ve la pestaña de analytics', an, 200);

  seccion('Solo el dueño cambia permisos y datos');
  bloqueado('un miembro no cambia permisos (ni los suyos)', await api(M, 'PUT', `${O}/miembros/${M.me.id_usuario}/permisos`, { permisos: TODOS }));
  bloqueado('un miembro no edita la empresa', await api(M, 'PUT', O, { nombre: 'Hackeada', cuit: org.body.cuit }));
  bloqueado('un miembro no saca a otro', await api(M, 'DELETE', `${O}/miembros/${S.me.id_usuario}`));
  bloqueado('un miembro no invita miembros', await api(M, 'POST', `${O}/invitaciones`, { tipo: 'MIEMBRO', permisos: [] }));
  bloqueado('un miembro no transfiere', await api(M, 'POST', `${O}/transferir`, { id_usuario: M.me.id_usuario }));
  bloqueado('alguien de afuera no ve la empresa', await api(X, 'GET', O));
  espera('PUT /miembros/:id/rol ya no existe → 404', await api(D, 'PUT', `${O}/miembros/${M.me.id_usuario}/rol`, { rol: 'RESPONSABLE' }), 404);
  const miembrosD = await api(D, 'GET', `${O}/miembros`);
  registrar('el dueño sí ve email y teléfono', miembrosD.body?.every?.((x) => 'email' in x), JSON.stringify(miembrosD.body?.[1]).slice(0, 200));
  bloqueado('el dueño no se cambia sus propios permisos', await api(D, 'PUT', `${O}/miembros/${D.me.id_usuario}/permisos`, { permisos: [] }));

  seccion('Cambiar permisos en vivo (socket)');
  let sM = null; let sS = null; let sD = null;
  if (io) {
    [sM, sS, sD] = await Promise.all([conectar(M), conectar(S), conectar(D)]);
    registrar('dueño y miembros conectados por socket', !sM.error && !sS.error && !sD.error, [sM, sS, sD].map((x) => x.error?.message).join(' '));
  }
  const pm = await api(D, 'PUT', `${O}/miembros/${M.me.id_usuario}/permisos`, { permisos: ['GESTIONAR_VIAJES', 'CHOFERES'] });
  registrar('GESTIONAR_VIAJES incluye ver (permisos_efectivos)', pm.status === 200 && mismo(pm.body?.permisos, ['GESTIONAR_VIAJES', 'CHOFERES']) && mismo(pm.body?.permisos_efectivos, ['VER_VIAJES', 'GESTIONAR_VIAJES', 'CHOFERES']),
    `${pm.status} ${JSON.stringify(pm.body)}`);
  bloqueado('permisos con un valor que no existe → 4xx', await api(D, 'PUT', `${O}/miembros/${M.me.id_usuario}/permisos`, { permisos: ['TODO'] }));
  await dormir(1500);
  if (sM && !sM.error) {
    const ev = recibio(sM, 'organizacion:permisos_actualizados');
    registrar('organizacion:permisos_actualizados le llega al miembro', !!ev && Number(ev.data?.id_organizacion) === A && ev.data?.es_dueno === false && Array.isArray(ev.data?.permisos),
      ev ? JSON.stringify(ev.data) : `eventos: ${sM.eventos.map((e) => e.nombre).join(', ')}`);
    if (ev) nota(`Evento: ${JSON.stringify(ev.data)}`);
    registrar('a los demás no les llega', !recibio(sS, 'organizacion:permisos_actualizados'), 'S recibió el evento de M');
  }
  const meM2 = await api(M, 'GET', '/api/auth/me');
  registrar('/me ya trae los permisos nuevos', meM2.body?.organizacion?.mis_permisos?.includes('GESTIONAR_VIAJES') && meM2.body?.organizacion?.mis_permisos?.includes('VER_VIAJES'), JSON.stringify(meM2.body?.organizacion?.mis_permisos));
  espera('ahora sin ANALYTICS → 403', await api(M, 'GET', `${O}/analytics`), 403, 'analytics');
  espera('CHOFERES lista los conductores', await api(M, 'GET', `${O}/choferes`), 200);
  bloqueado('sin CHOFERES no ve las invitaciones', await api(S, 'GET', `${O}/invitaciones`));
  espera('GESTIONAR_VIAJES guarda lugares', await api(M, 'POST', `${O}/lugares`, { nombre: `Depósito ${seg()}`, direccion: ORIGEN.direccion, lat: ORIGEN.lat, lng: ORIGEN.lng }), 201);
  espera('CHOFERES genera códigos de conductor', await api(M, 'POST', `${O}/invitaciones`, { tipo: 'CHOFER' }), 201);

  seccion('Eventos de viajes según el permiso');
  const viaje = await api(M, 'POST', `${O}/viajes`, { id_conductor: IDC, fecha_programada: enMin(61), motivo: 'Prueba de permisos', descripcion: 'Prueba de permisos', paradas });
  espera('GESTIONAR_VIAJES crea un viaje', viaje, 201);
  const T = viaje.body?.id_viaje;
  await dormir(2000);
  if (sD && !sD.error) {
    registrar('al dueño le llega viaje:asignado', !!recibio(sD, 'viaje:asignado', deViaje(T)), `eventos: ${sD.eventos.map((e) => e.nombre).join(', ')}`);
    registrar('al miembro sin VER_VIAJES no le llega ningún evento de viajes', !sS.eventos.some((e) => /^(viaje|parada|serie|alerta):/.test(e.nombre)), `recibió: ${sS.eventos.map((e) => e.nombre).join(', ')}`);
  }

  seccion('Analytics');
  const an2 = await api(D, 'GET', `${O}/analytics?agrupar=semana`);
  for (const q of ['', '?desde=todo', '?rango=todo', '?periodo=todo', '?todo=1', '?desde=2000-01-01']) {
    const r = await api(D, 'GET', `${O}/analytics${q}`);
    nota(`analytics${q || ' (sin nada)'} → ${r.status} rango ${JSON.stringify(r.body?.rango ?? r.body)}`);
  }
  const campos = ['total_gastado', 'costo_promedio', 'solicitados', 'finalizados', 'tasa_cancelacion', 'puntualidad', 'duracion_promedio_min', 'evolucion', 'gasto_por_zona'];
  registrar('trae lo que muestra la pestaña', an2.status === 200 && campos.every((k) => k in (an2.body ?? {})), `faltan: ${campos.filter((k) => !(k in (an2.body ?? {}))).join(', ')}`);
  const masCaro = Object.keys(an2.body ?? {}).filter((k) => /caro|barato/i.test(k));
  registrar('trae el flete más caro y el más barato', masCaro.length >= 2, `claves: ${Object.keys(an2.body ?? {}).join(', ')}`);
  registrar('sin desde = «Todo»', an2.body?.rango?.todo === true, `sin desde toma ${JSON.stringify(an2.body?.rango)}`);
  registrar('cuenta el viaje creado', an2.body?.solicitados >= 1, `solicitados ${an2.body?.solicitados}`);
  const anR = await api(D, 'GET', `${O}/analytics?desde=2026-11-01&hasta=2026-11-30&agrupar=dia`);
  registrar('con rango y agrupar=dia', anR.status === 200 && anR.body?.rango?.todo === false && anR.body?.evolucion?.length >= 28, `${anR.status} ${JSON.stringify(anR.body?.rango)} ${anR.body?.evolucion?.length}`);
  bloqueado('agrupar inválido → 4xx', await api(D, 'GET', `${O}/analytics?agrupar=anio`));
  bloqueado('desde después de hasta → 4xx', await api(D, 'GET', `${O}/analytics?desde=2026-12-01&hasta=2026-11-01`));
  nota(`Analytics (Todo): ${JSON.stringify({ total: an2.body?.total_gastado, solicitados: an2.body?.solicitados, extras: Object.keys(an2.body ?? {}).filter((k) => !campos.includes(k)) })}`);

  seccion('Historial de permisos');
  const h = await api(D, 'GET', `${O}/permisos/historial`);
  const acciones = h.body?.items?.map((i) => i.accion) ?? [];
  registrar('registra crear, invitar, canjear y cambiar permisos', h.status === 200 && ['CREAR', 'INVITAR', 'CANJE', 'PERMISOS'].every((a) => acciones.includes(a)), `${h.status} ${acciones.join(', ')}`);
  const cambio = h.body?.items?.find((i) => i.accion === 'PERMISOS');
  registrar('cada cambio dice quién, a quién, antes y después', !!cambio?.actor && !!cambio?.afectado && !!cambio?.antes && !!cambio?.despues, JSON.stringify(cambio).slice(0, 250));
  bloqueado('un miembro no ve el historial', await api(S, 'GET', `${O}/permisos/historial`));

  seccion('Desvincular con un viaje en curso');
  espera('el conductor confirma', await api(C, 'POST', `/api/choferes/viajes/${T}/confirmar`, { id_vehiculo: VEH }), 200);
  const futuro = await api(D, 'POST', `${O}/viajes`, { id_conductor: IDC, fecha_programada: enMin(3 * 24 * 60), motivo: 'Viaje futuro', descripcion: 'Prueba de permisos', paradas });
  const pre0 = await api(D, 'GET', `${O}/choferes/${IDC}/desvinculacion`);
  registrar('vista previa de la empresa (sin viaje en curso)', pre0.status === 200 && Array.isArray(pre0.body?.viajes_a_cancelar) && (pre0.body?.en_curso === null || Array.isArray(pre0.body?.en_curso)) && Array.isArray(pre0.body?.series_a_borrar),
    `${pre0.status} ${JSON.stringify(pre0.body).slice(0, 300)}`);
  // en_curso es un viaje (objeto) o null; viajes_a_cancelar, una lista de ids
const ids = (l) => (l == null ? [] : (Array.isArray(l) ? l : [l])).map((v) => v?.id_viaje ?? v);
  registrar('lista los dos viajes por hacer', [T, futuro.body?.id_viaje].every((id) => ids(pre0.body?.viajes_a_cancelar).includes(id)), JSON.stringify(pre0.body?.viajes_a_cancelar).slice(0, 200));
  nota(`Vista previa (empresa): ${JSON.stringify(pre0.body).slice(0, 300)}`);
  console.log('  (esperando a que abra la ventana de inicio…)');
  let ini;
  for (let i = 0; i < 12; i++) {
    await dormir(20000);
    ini = await api(C, 'POST', `/api/choferes/viajes/${T}/iniciar`, { lat: ORIGEN.lat, lng: ORIGEN.lng });
    if (ini.status === 200 || !/ventana|todavia|a partir de/i.test(ini.body?.error ?? '')) break;
  }
  espera('el conductor inicia el viaje', ini, 200);
  const pre1 = await api(D, 'GET', `${O}/choferes/${IDC}/desvinculacion`);
  registrar('la vista previa marca el viaje en curso', pre1.status === 200 && ids(pre1.body?.en_curso).includes(T) && !ids(pre1.body?.viajes_a_cancelar).includes(T), JSON.stringify(pre1.body).slice(0, 300));
  const del = await api(D, 'DELETE', `${O}/choferes/${IDC}`);
  registrar('la empresa desvincula → 409 { error, en_curso }', del.status === 409 && typeof del.body?.error === 'string' && ids(del.body?.en_curso).includes(T), `${del.status} ${JSON.stringify(del.body).slice(0, 300)}`);
  if (del.body?.error) nota(`409 de la empresa: «${del.body.error}»`);
  const preC = await api(C, 'GET', `/api/choferes/mis-organizaciones/${A}/desvinculacion`);
  registrar('vista previa del conductor', preC.status === 200 && ids(preC.body?.en_curso).includes(T), `${preC.status} ${JSON.stringify(preC.body).slice(0, 300)}`);
  registrar('la del conductor no trae precios', fugas(preC.body).length === 0, `trae: ${fugas(preC.body).join(', ')}`);
  nota(`Vista previa (conductor): ${JSON.stringify(preC.body).slice(0, 300)}`);
  const delC = await api(C, 'DELETE', `/api/choferes/mis-organizaciones/${A}`);
  registrar('el conductor se desvincula → 409 { error, en_curso }', delC.status === 409 && typeof delC.body?.error === 'string' && ids(delC.body?.en_curso).includes(T), `${delC.status} ${JSON.stringify(delC.body).slice(0, 300)}`);
  if (delC.body?.error) nota(`409 del conductor: «${delC.body.error}»`);
  const sigue = await api(C, 'GET', `/api/choferes/viajes/${T}`);
  registrar('el viaje sigue en curso', sigue.status === 200 && !['CANCELADO'].includes(sigue.body?.estado), `${sigue.status} ${sigue.body?.estado}`);
  // terminar el viaje
  await api(C, 'POST', `/api/choferes/viajes/${T}/salir`);
  const ps = sigue.body?.paradas ?? [];
  await api(C, 'POST', `/api/viajes/${T}/confirmar-parada`, { id_parada: ps[ps.length - 1]?.id_parada, lat: DESTINO.lat, lng: DESTINO.lng });
  const fin = await api(C, 'POST', `/api/choferes/viajes/${T}/salir`);
  registrar('se termina el viaje', fin.status === 200, `${fin.status} ${JSON.stringify(fin.body).slice(0, 150)}`);
  const preC2 = await api(C, 'GET', `/api/choferes/mis-organizaciones/${A}/desvinculacion`);
  registrar('sin viaje en curso: la vista previa lista lo que se cancela', preC2.status === 200 && !ids(preC2.body?.en_curso).length && ids(preC2.body?.viajes_a_cancelar).includes(futuro.body?.id_viaje), JSON.stringify(preC2.body).slice(0, 300));
  const delC2 = await api(C, 'DELETE', `/api/choferes/mis-organizaciones/${A}`);
  registrar('ahora sí se desvincula', delC2.status === 200, `${delC2.status} ${JSON.stringify(delC2.body).slice(0, 200)}`);
  nota(`Desvincularse: ${JSON.stringify(delC2.body).slice(0, 200)}`);

  seccion('Transferir la propiedad');
  bloqueado('el dueño no se puede ir sin transferir', await api(D, 'POST', `${O}/salir`));
  bloqueado('no se transfiere a alguien de afuera', await api(D, 'POST', `${O}/transferir`, { id_usuario: X.me.id_usuario }));
  const tr = await api(D, 'POST', `${O}/transferir`, { id_usuario: M.me.id_usuario });
  espera('transferir a M', tr, 200);
  await dormir(1500);
  const [oM, oD] = [await api(M, 'GET', O), await api(D, 'GET', O)];
  registrar('M queda dueño con todos los permisos', oM.body?.es_dueno === true && mismo(oM.body?.mis_permisos, TODOS) && oM.body?.dueno?.id_usuario === M.me.id_usuario, JSON.stringify({ es: oM.body?.es_dueno, p: oM.body?.mis_permisos }));
  registrar('el dueño anterior queda como miembro', oD.status === 200 && oD.body?.es_dueno === false, JSON.stringify({ es: oD.body?.es_dueno, p: oD.body?.mis_permisos }));
  nota(`Después de transferir, el anterior tiene: ${JSON.stringify(oD.body?.mis_permisos)}`);
  if (sD && !sD.error) {
    const evD = recibio(sD, 'organizacion:permisos_actualizados');
    registrar('al dueño anterior le llega el evento', !!evD && evD.data?.es_dueno === false, evD ? JSON.stringify(evD.data) : `eventos: ${sD.eventos.map((e) => e.nombre).join(', ')}`);
  }
  bloqueado('el anterior ya no cambia permisos', await api(D, 'PUT', `${O}/miembros/${S.me.id_usuario}/permisos`, { permisos: TODOS }));
  espera('el anterior ya se puede ir', await api(D, 'POST', `${O}/salir`), 200);
  const sacar = await api(M, 'DELETE', `${O}/miembros/${S.me.id_usuario}`);
  espera('el dueño nuevo saca a S', sacar, 200);
  await dormir(1500);
  if (sS && !sS.error) {
    const evS = recibio(sS, 'organizacion:permisos_actualizados', (d) => d?.miembro === false);
    registrar('a S le llega { miembro: false }', !!evS, `eventos: ${sS.eventos.map((e) => `${e.nombre} ${JSON.stringify(e.data)}`).join(', ')}`);
  }
  const meS = await api(S, 'GET', '/api/auth/me');
  registrar('S queda sin empresa', meS.body?.organizacion === null, JSON.stringify(meS.body?.organizacion));
  [sM, sS, sD].forEach((x) => x?.s?.close());
}

main()
  .catch((e) => registrar('la prueba no pudo seguir', false, e.stack || e.message))
  .finally(() => {
    const fallas = resultados.filter((r) => !r.ok);
    console.log(`\n${resultados.length - fallas.length}/${resultados.length} pruebas bien.`);
    fallas.forEach((f) => console.log(`  ✘ [${f.grupo}] ${f.nombre}\n      ${f.detalle}`));
    if (notas.length) { console.log('\nNotas:'); notas.forEach((x) => console.log(`  · ${x}`)); }
    process.exit(fallas.length ? 1 : 0);
  });
