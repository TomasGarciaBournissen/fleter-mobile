#!/usr/bin/env node
// Prueba de carga y de tiempos de respuesta del backend: primero cuánto tarda cada pedido que hace
// la app (de a uno), después cómo responde con varios usuarios a la vez (1, 5, 10, 20 y 40 en
// paralelo, 10 s cada escalón) y cuánto tardan en conectar varios sockets.
// Es una carga moderada a propósito: la base de staging es la misma que la de producción.
//
// Uso:
//   BASE_URL=https://nombre-proyecto-back-staging.up.railway.app FIREBASE_API_KEY=AIza... \
//   NODE_USE_ENV_PROXY=1 node scripts/api-tests/carga.mjs
//
// Crea 2 cuentas, 1 empresa y 3 viajes que no se borran. Usa 1 canje.

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


const pct = (xs, p) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };
const ms = (x) => (x == null ? '—' : `${Math.round(x)} ms`);
const tabla = [];

async function medir(usuario, method, ruta, body) {
  const t = performance.now();
  const r = await api(usuario, method, ruta, body);
  return { ms: performance.now() - t, status: r.status, r };
}

async function serie(nombre, n, fn) {
  const tiempos = []; let errores = 0;
  for (let i = 0; i < n; i++) { const m = await fn(i); tiempos.push(m.ms); if (m.status >= 400) errores++; }
  const fila = { nombre, n, p50: pct(tiempos, 50), p95: pct(tiempos, 95), max: Math.max(...tiempos), errores };
  tabla.push(fila);
  console.log(`  ${nombre.padEnd(46)} p50 ${ms(fila.p50).padStart(8)}  p95 ${ms(fila.p95).padStart(8)}  máx ${ms(fila.max).padStart(8)}  errores ${errores}/${n}`);
  return fila;
}

async function main() {
  seccion('Preparación');
  const E = await crearUsuario('CLIENTE', 'EmpresaCarga');
  const org = await api(E, 'POST', '/api/organizaciones', { nombre: `Carga ${seg()}`, cuit: cuitValido() });
  const A = org.body?.id_organizacion;
  const C = await crearUsuario('CONDUCTOR', 'ConductorCarga');
  await api(C, 'POST', '/api/conductores/mis-vehiculos', { patente: patente(), marca: 'Ford', modelo: 'Transit', anio: 2022, color: 'Blanco', tipo_vehiculo: 'utilitario' });
  const inv = await api(E, 'POST', `/api/organizaciones/${A}/invitaciones`, { tipo: 'CHOFER' });
  await api(C, 'POST', '/api/invitaciones/canjear', { codigo: inv.body?.codigo });
  const ch = await api(E, 'GET', `/api/organizaciones/${A}/choferes`);
  const IDC = ch.body?.[0]?.id_conductor;
  registrar('empresa y conductor listos', !!A && !!IDC, JSON.stringify({ A, IDC }));

  seccion('Tiempo de cada pedido, de a uno');
  await serie('GET /health', 20, () => medir(null, 'GET', '/health'));
  await serie('GET /api/auth/me', 20, () => medir(E, 'GET', '/api/auth/me'));
  const ids = [];
  await serie('POST crear viaje (Google: ruta y peajes)', 3, async (i) => {
    const m = await medir(E, 'POST', `/api/organizaciones/${A}/viajes`, { id_conductor: IDC, fecha_programada: enMin(3 * 24 * 60 + i * 120), motivo: `Carga ${i}`, descripcion: 'Prueba de carga', paradas: [ORIGEN, DESTINO] });
    if (m.r.body?.id_viaje) ids.push(m.r.body.id_viaje);
    return m;
  });
  await serie('POST estimar-precio (Google)', 5, (i) => medir(E, 'POST', `/api/organizaciones/${A}/viajes/estimar-precio`, { paradas: [ORIGEN, { ...DESTINO, lat: DESTINO.lat + i * 0.001 }], fecha_programada: enMin(200 + i * 61) }));
  await serie('GET viajes de la empresa (lista)', 20, () => medir(E, 'GET', `/api/organizaciones/${A}/viajes`));
  await serie('GET detalle de un viaje (empresa)', 20, () => medir(E, 'GET', `/api/organizaciones/${A}/viajes/${ids[0]}`));
  await serie('GET viajes del conductor (lista)', 20, () => medir(C, 'GET', '/api/choferes/viajes'));
  await serie('GET detalle de un viaje (conductor)', 20, () => medir(C, 'GET', `/api/choferes/viajes/${ids[0]}`));
  await serie('GET conductores de la empresa', 20, () => medir(E, 'GET', `/api/organizaciones/${A}/choferes`));

  seccion('Varios usuarios a la vez (pedidos de lectura mezclados)');
  const mezcla = [
    () => api(E, 'GET', `/api/organizaciones/${A}/viajes`),
    () => api(E, 'GET', `/api/organizaciones/${A}/viajes/${ids[0]}`),
    () => api(C, 'GET', '/api/choferes/viajes'),
    () => api(C, 'GET', `/api/choferes/viajes/${ids[0]}`),
    () => api(E, 'GET', '/api/auth/me'),
  ];
  const escalones = [];
  for (const conc of [1, 5, 10, 20, 40]) {
    const tiempos = []; let errores = 0; let n429 = 0; const codigos = {};
    const fin = Date.now() + 10000;
    await Promise.all(Array.from({ length: conc }, async (_, w) => {
      let k = w;
      while (Date.now() < fin) {
        const t = performance.now();
        let r;
        try { r = await mezcla[k++ % mezcla.length](); } catch (e) { r = { status: 0 }; }
        tiempos.push(performance.now() - t);
        if (r.status === 429) n429++; else if (r.status >= 400 || r.status === 0) { errores++; codigos[r.status] = (codigos[r.status] ?? 0) + 1; }
      }
    }));
    const e = { conc, n: tiempos.length, rps: tiempos.length / 10, p50: pct(tiempos, 50), p95: pct(tiempos, 95), p99: pct(tiempos, 99), max: Math.max(...tiempos), errores, n429, codigos };
    escalones.push(e);
    console.log(`  ${String(conc).padStart(2)} a la vez: ${String(e.n).padStart(4)} pedidos (${e.rps.toFixed(1)}/s)  p50 ${ms(e.p50).padStart(8)}  p95 ${ms(e.p95).padStart(8)}  p99 ${ms(e.p99).padStart(8)}  errores ${errores}${n429 ? `  429: ${n429}` : ''}${errores ? ` ${JSON.stringify(codigos)}` : ''}`);
    await dormir(3000);
  }
  const total = escalones.reduce((t, e) => t + e.n, 0);
  const errores = escalones.reduce((t, e) => t + e.errores, 0);
  registrar(`sin errores 5xx bajo carga (${total} pedidos)`, errores === 0, `${errores} errores`);
  const ultimo = escalones[escalones.length - 1];
  registrar('con 40 a la vez, el 95 % responde en menos de 2 s', ultimo.p95 < 2000, `p95 ${ms(ultimo.p95)}`);

  seccion('Sockets');
  if (io) {
    const t0 = performance.now();
    const conns = await Promise.all(Array.from({ length: 20 }, async () => {
      const t = performance.now(); const c = await conectar(E); return { ...c, ms: performance.now() - t };
    }));
    const okc = conns.filter((c) => !c.error);
    const tc = okc.map((c) => c.ms);
    console.log(`  20 sockets a la vez: ${okc.length} conectados en ${ms(performance.now() - t0)} (p50 ${ms(pct(tc, 50))}, máx ${ms(Math.max(...tc))})`);
    registrar('20 sockets conectan', okc.length === 20, conns.filter((c) => c.error).map((c) => c.error.message).join(', '));
    conns.forEach((c) => c.s?.close());
  }

  for (const id of ids) await api(E, 'POST', `/api/organizaciones/${A}/viajes/${id}/cancelar`, { motivo: 'Prueba de carga' });
}

main()
  .catch((e) => registrar('la prueba no pudo seguir', false, e.stack || e.message))
  .finally(() => {
    const fallas = resultados.filter((r) => !r.ok);
    console.log(`\n${resultados.length - fallas.length}/${resultados.length} pruebas bien.`);
    fallas.forEach((f) => console.log(`  ✘ [${f.grupo}] ${f.nombre}\n      ${f.detalle}`));
    process.exit(fallas.length ? 1 : 0);
  });
