#!/usr/bin/env node
// Prueba de seguridad del backend desde afuera, como lo haría alguien con una cuenta propia:
// dos empresas y dos conductores que intentan leer o tocar lo que no es suyo (IDOR), roles,
// asignación masiva de campos, entradas raras, cabeceras, CORS, límite de tamaño y de pedidos.
// No intenta tirar el servidor. Solo staging o local, nunca producción.
//
// Uso:
//   BASE_URL=https://nombre-proyecto-back-staging.up.railway.app FIREBASE_API_KEY=AIza... \
//   NODE_USE_ENV_PROXY=1 node scripts/api-tests/seguridad.mjs
//
// Crea 5 cuentas y 2 empresas que no se borran. Usa 3 canjes de invitación.

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


const no = (r) => r.status >= 400 && r.status < 500 && r.status !== 429;
function bloqueado(nombre, r) {
  return registrar(nombre, no(r), `llegó ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
}

async function rawFetch(ruta, opciones = {}) {
  const res = await fetch(BASE + ruta, opciones);
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, headers: res.headers, body: json };
}

async function main() {
  seccion('Preparación');
  const E1 = await crearUsuario('CLIENTE', 'EmpresaA');
  const E2 = await crearUsuario('CLIENTE', 'EmpresaB');
  const o1 = await api(E1, 'POST', '/api/organizaciones', { nombre: `Seg A ${seg()}`, cuit: cuitValido() });
  const o2 = await api(E2, 'POST', '/api/organizaciones', { nombre: `Seg B ${seg()}`, cuit: cuitValido() });
  const A = o1.body?.id_organizacion; const B = o2.body?.id_organizacion;
  registrar('dos empresas', !!A && !!B, JSON.stringify([o1.status, o2.status]));
  const M1 = await crearUsuario('CLIENTE', 'MiembroA');
  const invM = await api(E1, 'POST', `/api/organizaciones/${A}/invitaciones`, { tipo: 'MIEMBRO' });
  espera('un miembro (no responsable) en la empresa A', await api(M1, 'POST', '/api/invitaciones/canjear', { codigo: invM.body?.codigo }), 200);
  const C1 = await crearUsuario('CONDUCTOR', 'ConductorA');
  const C2 = await crearUsuario('CONDUCTOR', 'ConductorB');
  const v1 = await api(C1, 'POST', '/api/conductores/mis-vehiculos', { patente: patente(), marca: 'Ford', modelo: 'Transit', anio: 2022, color: 'Blanco', tipo_vehiculo: 'utilitario' });
  const i1 = await api(E1, 'POST', `/api/organizaciones/${A}/invitaciones`, { tipo: 'CHOFER' });
  await api(C1, 'POST', '/api/invitaciones/canjear', { codigo: i1.body?.codigo });
  const i2 = await api(E2, 'POST', `/api/organizaciones/${B}/invitaciones`, { tipo: 'CHOFER' });
  await api(C2, 'POST', '/api/invitaciones/canjear', { codigo: i2.body?.codigo });
  const chA = await api(E1, 'GET', `/api/organizaciones/${A}/choferes`);
  const IDC1 = chA.body?.[0]?.id_conductor;
  const tA = await api(E1, 'POST', `/api/organizaciones/${A}/viajes`, { id_conductor: IDC1, fecha_programada: enMin(3 * 24 * 60), motivo: 'Viaje de A', descripcion: 'Privado', paradas: [ORIGEN, DESTINO] });
  espera('viaje de la empresa A', tA, 201);
  const TA = tA.body?.id_viaje;
  const lugA = await api(E1, 'POST', `/api/organizaciones/${A}/lugares`, { nombre: 'Depósito A', ...ORIGEN });

  seccion('Sin sesión o con token falso');
  for (const ruta of ['/api/auth/me', `/api/organizaciones/${A}/viajes`, '/api/choferes/viajes', `/api/viajes/${TA}`]) {
    espera(`${ruta} sin token → 401`, await api(null, 'GET', ruta), 401);
  }
  const falso = { token: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1aWQiOiJ4IiwiZW1haWwiOiJ4QHguY29tIn0.' };
  espera('JWT sin firma (alg none) → 401', await api(falso, 'GET', '/api/auth/me'), 401);
  const manipulado = { token: E1.token.slice(0, -6) + 'AAAAAA' };
  espera('token real con la firma alterada → 401', await api(manipulado, 'GET', '/api/auth/me'), 401);

  seccion('Una empresa no ve ni toca lo de otra (IDOR)');
  bloqueado('B lista los viajes de A', await api(E2, 'GET', `/api/organizaciones/${A}/viajes`));
  bloqueado('B lee un viaje de A', await api(E2, 'GET', `/api/organizaciones/${A}/viajes/${TA}`));
  bloqueado('B lee el viaje de A por su propia ruta', await api(E2, 'GET', `/api/organizaciones/${B}/viajes/${TA}`));
  bloqueado('B edita un viaje de A', await api(E2, 'PUT', `/api/organizaciones/${B}/viajes/${TA}`, { motivo: 'hackeado' }));
  bloqueado('B cancela un viaje de A', await api(E2, 'POST', `/api/organizaciones/${B}/viajes/${TA}/cancelar`, { motivo: 'x' }));
  bloqueado('B pide el remito de A', await api(E2, 'GET', `/api/organizaciones/${B}/viajes/${TA}/remito`));
  bloqueado('B carga el precio pagado de A', await api(E2, 'PUT', `/api/organizaciones/${B}/viajes/${TA}/precio-pagado`, { monto: 1, incluye_iva: false }));
  bloqueado('B lee el viaje de A por /api/viajes/:id', await api(E2, 'GET', `/api/viajes/${TA}`));
  bloqueado('B ve los conductores de A', await api(E2, 'GET', `/api/organizaciones/${A}/choferes`));
  bloqueado('B ve los miembros de A', await api(E2, 'GET', `/api/organizaciones/${A}/miembros`));
  bloqueado('B usa un lugar guardado de A', await api(E2, 'POST', `/api/organizaciones/${B}/viajes/estimar-precio`, { paradas: [{ id_lugar: lugA.body?.id_lugar }, DESTINO] }));
  bloqueado('B crea un código de invitación de A', await api(E2, 'POST', `/api/organizaciones/${A}/invitaciones`, { tipo: 'MIEMBRO' }));
  const tA2 = await api(E1, 'GET', `/api/organizaciones/${A}/viajes/${TA}`);
  registrar('el viaje de A quedó intacto', tA2.body?.motivo === 'Viaje de A' && tA2.body?.estado === 'ASIGNADO', JSON.stringify({ m: tA2.body?.motivo, e: tA2.body?.estado }));

  seccion('Un conductor no ve ni toca lo de otro');
  bloqueado('C2 lee el viaje de C1', await api(C2, 'GET', `/api/choferes/viajes/${TA}`));
  bloqueado('C2 confirma el viaje de C1', await api(C2, 'POST', `/api/choferes/viajes/${TA}/confirmar`, { id_vehiculo: v1.body?.id_vehiculo }));
  bloqueado('C2 lee el viaje de C1 por /api/viajes/:id', await api(C2, 'GET', `/api/viajes/${TA}`));
  bloqueado('C1 confirma con un vehículo que no es suyo', await api(C1, 'POST', `/api/choferes/viajes/${TA}/confirmar`, { id_vehiculo: 999999 }));
  bloqueado('C2 edita el vehículo de C1', await api(C2, 'PUT', `/api/conductores/mis-vehiculos/${v1.body?.id_vehiculo}`, { color: 'Rojo' }));
  const misC2 = await api(C2, 'GET', '/api/choferes/viajes');
  registrar('la lista de C2 no trae el viaje de C1', Array.isArray(misC2.body) && !misC2.body.some((x) => x.id_viaje === TA), JSON.stringify(misC2.body).slice(0, 200));

  seccion('Roles');
  bloqueado('el conductor no entra a las rutas de la empresa', await api(C1, 'GET', `/api/organizaciones/${A}/viajes`));
  bloqueado('el conductor no crea viajes', await api(C1, 'POST', `/api/organizaciones/${A}/viajes`, { id_conductor: IDC1, fecha_programada: enMin(3000), motivo: 'x', descripcion: 'x', paradas: [ORIGEN, DESTINO] }));
  bloqueado('un miembro no edita los datos de la empresa', await api(M1, 'PUT', `/api/organizaciones/${A}`, { nombre: 'Tomada' }));
  bloqueado('un miembro no se hace responsable solo', await api(M1, 'PUT', `/api/organizaciones/${A}/miembros/${M1.me.id_usuario}/rol`, { rol: 'RESPONSABLE' }));
  bloqueado('la empresa no entra al panel de admin', await api(E1, 'GET', '/api/admin/precios/dataset'));
  bloqueado('la empresa no lista usuarios (admin)', await api(E1, 'GET', '/api/admin/usuarios'));
  bloqueado('el conductor no entra al panel de admin', await api(C1, 'GET', '/api/admin/viajes'));

  seccion('Campos que no se pueden forzar');
  const forz = await api(E1, 'POST', `/api/organizaciones/${A}/viajes`, {
    id_conductor: IDC1, fecha_programada: enMin(3 * 24 * 60), motivo: 'Forzado', descripcion: 'x', paradas: [ORIGEN, DESTINO],
    precio_estimado: 1, precio_real: 1, estado: 'FINALIZADO', id_organizacion: B, version_precio: 1, id_creador: 1,
  });
  registrar('crear ignora precio, estado y organización mandados por el cliente', forz.status === 201 ? (forz.body?.precio_estimado > 1 && forz.body?.estado === 'ASIGNADO' && forz.body?.id_organizacion === A && forz.body?.precio_real == null) : no(forz),
    `${forz.status} ${JSON.stringify({ p: forz.body?.precio_estimado, e: forz.body?.estado, o: forz.body?.id_organizacion, err: forz.body?.error })}`);
  const edF = await api(E1, 'PUT', `/api/organizaciones/${A}/viajes/${TA}`, { motivo: 'Viaje de A', precio_estimado: 1, estado: 'FINALIZADO' });
  const tA3 = await api(E1, 'GET', `/api/organizaciones/${A}/viajes/${TA}`);
  registrar('editar tampoco deja cambiar precio ni estado', tA3.body?.precio_estimado > 1 && tA3.body?.estado === 'ASIGNADO', `${edF.status} ${JSON.stringify({ p: tA3.body?.precio_estimado, e: tA3.body?.estado })}`);
  const meRol = await api(C2, 'PUT', '/api/auth/me', { rol: 'ADMIN' });
  const meDesp = await api(C2, 'GET', '/api/auth/me');
  registrar('nadie se cambia el rol a ADMIN', meDesp.body?.rol === 'CONDUCTOR', `${meRol.status} rol ${meDesp.body?.rol}`);
  if (forz.body?.id_viaje) await api(E1, 'POST', `/api/organizaciones/${A}/viajes/${forz.body.id_viaje}/cancelar`, { motivo: 'Prueba' });

  seccion('Entradas raras');
  espera('id con inyección SQL → 400', await api(E1, 'GET', `/api/organizaciones/${A}/viajes/1%20OR%201=1`), 400);
  bloqueado('organización con inyección SQL', await api(E1, 'GET', `/api/organizaciones/1%20OR%201=1/viajes`));
  const sqli = await api(E1, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [{ ...ORIGEN, direccion: "'; DROP TABLE viaje; --" }, DESTINO] });
  registrar('texto con SQL se trata como texto (no rompe)', sqli.status === 200 || no(sqli), `${sqli.status}`);
  espera('coordenadas imposibles → 400', await api(E1, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [{ lat: 999, lng: -999, direccion: 'x' }, DESTINO] }), 400);
  espera('tipos equivocados → 400', await api(E1, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: 'no es una lista' }), 400);
  const json = await rawFetch(`/api/organizaciones/${A}/viajes/estimar-precio`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${E1.token}` }, body: '{"paradas": [' });
  registrar('JSON roto → 400 en JSON', json.status === 400 && typeof json.body?.error === 'string', `${json.status} ${JSON.stringify(json.body).slice(0, 150)}`);
  const grande = await rawFetch(`/api/organizaciones/${A}/viajes/estimar-precio`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${E1.token}` }, body: JSON.stringify({ x: 'a'.repeat(200 * 1024) }) });
  registrar('body de 200 KB → 413', grande.status === 413, `${grande.status} ${JSON.stringify(grande.body).slice(0, 150)}`);
  const xss = '<script>alert(1)</script>';
  const vx = await api(E1, 'PUT', `/api/organizaciones/${A}/viajes/${TA}`, { motivo: xss });
  if (vx.status === 200) nota(`El backend guarda HTML tal cual en los textos (motivo = ${JSON.stringify(vx.body?.motivo)}). En la app no es un problema (React Native no interpreta HTML); en la web hay que escaparlo al mostrarlo.`);
  await api(E1, 'PUT', `/api/organizaciones/${A}/viajes/${TA}`, { motivo: 'Viaje de A' });

  seccion('Cabeceras y CORS');
  const h = await rawFetch('/api/auth/me', { headers: { Authorization: `Bearer ${E1.token}`, Origin: 'https://sitio-malicioso.example' } });
  registrar('no expone X-Powered-By', !h.headers.get('x-powered-by'), h.headers.get('x-powered-by') ?? '');
  registrar('X-Content-Type-Options: nosniff', h.headers.get('x-content-type-options') === 'nosniff', h.headers.get('x-content-type-options') ?? 'falta');
  registrar('Strict-Transport-Security', !!h.headers.get('strict-transport-security'), 'falta');
  const acao = h.headers.get('access-control-allow-origin');
  registrar('CORS no habilita a un sitio cualquiera', acao !== 'https://sitio-malicioso.example' && acao !== '*', `access-control-allow-origin: ${acao}`);
  const http = await fetch(BASE.replace('https://', 'http://') + '/health', { redirect: 'manual' }).catch((e) => ({ status: 0, err: e.message }));
  registrar('HTTP sin cifrar redirige a HTTPS', [301, 302, 307, 308].includes(http.status) || http.status === 0, `status ${http.status}`);
  const err = await api(E1, 'GET', `/api/organizaciones/${A}/viajes/99999999999999999999`);
  registrar('los errores no muestran detalles internos (stack, SQL)', !/at .*\.js|prisma|stack|select |postgres/i.test(JSON.stringify(err.body)), JSON.stringify(err.body).slice(0, 200));

  seccion('Límite de pedidos (rate limit)');
  console.log('  (ráfaga de pedidos hasta que el backend corte, máx. 700)');
  let primero429 = null; let n = 0; let retry = null;
  for (let tanda = 0; tanda < 14 && !primero429; tanda++) {
    const rs = await Promise.all(Array.from({ length: 50 }, () => api(E1, 'GET', '/api/auth/me')));
    for (const r of rs) { n++; if (r.status === 429 && !primero429) { primero429 = n; retry = r; } }
  }
  registrar('corta con 429 al pasar el límite', !!primero429, `${n} pedidos sin 429`);
  if (primero429) {
    nota(`El primer 429 llegó en el pedido ${primero429} (límite general 600/min por IP)`);
    registrar('el 429 viene en JSON y en castellano', typeof retry.body?.error === 'string', JSON.stringify(retry.body).slice(0, 150));
  }
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
