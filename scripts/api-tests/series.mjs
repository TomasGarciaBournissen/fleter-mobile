#!/usr/bin/env node
// Pruebas de contrato del Paso 4 (API.md de develop, "Lugares guardados y series de viajes"):
// lugares de la PyME, paradas con { id_lugar }, que el chofer nunca vea el nombre del lugar (REST,
// sockets y remito), series DIARIA / DIAS_SEMANA / SEMANAL / MENSUAL con fechas en hora argentina,
// un solo serie:asignada, viajes de la serie independientes, cancelar la serie, desvincular y el
// límite de paradas.
//
// Uso:
//   BASE_URL=... FIREBASE_API_KEY=... SOCKET_IO_CLIENT=<carpeta con socket.io-client> node scripts/api-tests/series.mjs
//
// Usa 2 canjes de invitación. Crea datos que no se borran: correr contra staging, nunca producción.

import { createRequire } from 'node:module';
import { inflateSync } from 'node:zlib';
import path from 'node:path';

const BASE = (process.env.BASE_URL || '').replace(/\/$/, '');
const KEY = process.env.FIREBASE_API_KEY || '';
if (!BASE) { console.error('Falta BASE_URL'); process.exit(2); }
if (!KEY) { console.error('Falta FIREBASE_API_KEY'); process.exit(2); }

// ── Helpers ────────────────────────────────────────────────────────────────
const resultados = [];
let grupo = '';
const seccion = (nombre) => { grupo = nombre; console.log(`\n▸ ${nombre}`); };
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
    console.log(`  (error de red en ${method} ${ruta}: ${e.cause?.code || e.cause?.message || e.message}; reintento)`);
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
  return registrar(nombre, ok, `esperaba ${status}${textoError ? ` "${textoError}"` : ''}, llegó ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
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
  const email = `fleter-test-${etiqueta.toLowerCase()}-${seg()}@example.com`;
  const dni = String(10000000 + Math.floor(Math.random() * 89999999));
  const base = { nombre: etiqueta, apellido: 'Prueba', dni, email, contrasena: PASS, telefono: '+5491100000000' };
  const alta = () => tipo === 'CLIENTE'
    ? api(null, 'POST', '/api/auth/registro-cliente', base)
    : api(null, 'POST', '/api/auth/registro-conductor', { ...base, nro_licencia: `LIC${dni}`, licencia_vencimiento: '2028-12-31T00:00:00.000Z' });
  let r = await alta();
  if (r.status >= 500) { await dormir(5000); r = await alta(); }
  if (r.status !== 201) throw new Error(`No se pudo registrar ${etiqueta} (${tipo}): ${r.status} ${JSON.stringify(r.body)}`);
  const u = { etiqueta, email, token: await login(email) };
  u.id_usuario = (await api(u, 'GET', '/api/auth/me')).body?.id_usuario;
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

async function crearPyme(usuario, nombre) {
  const r = await api(usuario, 'POST', '/api/organizaciones', { nombre, cuit: cuitValido() });
  if (r.status !== 201) throw new Error(`No se pudo crear la PyME ${nombre}: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.id_organizacion;
}

async function vincular(pymeUsuario, idOrg, invitado) {
  const inv = await api(pymeUsuario, 'POST', `/api/organizaciones/${idOrg}/invitaciones`, { tipo: 'CHOFER' });
  if (inv.status !== 201) throw new Error(`No se pudo generar el código: ${inv.status} ${JSON.stringify(inv.body)}`);
  const c = await api(invitado, 'POST', '/api/invitaciones/canjear', { codigo: inv.body.codigo });
  if (c.status !== 200) throw new Error(`Canje de ${invitado.etiqueta} falló: ${c.status} ${JSON.stringify(c.body)}`);
}

const LETRAS = 'ABCDEFGHJKLMNPRSTUVWXYZ23456789';
const patente = () => 'S' + Array.from({ length: 6 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
async function crearVehiculo(chofer) {
  const r = await api(chofer, 'POST', '/api/conductores/mis-vehiculos', {
    patente: patente(), marca: 'Fiat', modelo: 'Fiorino', anio: 2020, color: 'Blanco', tipo_vehiculo: 'Utilitario', condiciones: [],
  });
  if (r.status !== 201) throw new Error(`No se pudo registrar el vehículo de ${chofer.etiqueta}: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.id_vehiculo;
}

const ORIGEN = { lat: -34.6037, lng: -58.3816, direccion: 'Plaza de Mayo, CABA' };
const DESTINO = { lat: -34.5895, lng: -58.3974, direccion: 'Recoleta, CABA' };

// Fechas en hora argentina (UTC−3, sin horario de verano).
const AR = 3 * 3600000;
const hoyAR = () => new Date(Date.now() - AR).toISOString().slice(0, 10);
const masDias = (fecha, n) => new Date(Date.parse(`${fecha}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const diaIso = (fecha) => new Date(`${fecha}T12:00:00Z`).getUTCDay() || 7; // 1 = lunes … 7 = domingo
const aUTC = (fecha, hora) => new Date(Date.parse(`${fecha}T${hora}:00Z`) + AR).toISOString();
const fechaAR = (iso) => new Date(Date.parse(iso) - AR).toISOString().slice(0, 10);
const horaAR = (iso) => new Date(Date.parse(iso) - AR).toISOString().slice(11, 16);
function fechasEsperadas(desde, hasta, ok) {
  const out = [];
  for (let f = desde; f <= hasta; f = masDias(f, 1)) if (ok(f)) out.push(f);
  return out;
}

// Texto visible de un PDF (streams FlateDecode + strings literales y hexa), para buscar el nombre del lugar.
function textoPdf(buf) {
  const s = buf.toString('latin1');
  let texto = '';
  for (let i = s.indexOf('stream'); i !== -1; i = s.indexOf('stream', i + 6)) {
    let ini = i + 6; if (s[ini] === '\r') ini++; if (s[ini] === '\n') ini++;
    const fin = s.indexOf('endstream', ini);
    if (fin === -1) break;
    let cont = buf.subarray(ini, fin);
    try { cont = inflateSync(cont); } catch { /* no comprimido */ }
    const c = cont.toString('latin1');
    for (const m of c.matchAll(/<([0-9A-Fa-f\s]+)>/g)) texto += Buffer.from(m[1].replace(/\s/g, ''), 'hex').toString('latin1') + ' ';
    for (const m of c.matchAll(/\(((?:\\.|[^\\)])*)\)/g)) texto += m[1] + ' ';
    i = fin;
  }
  return texto;
}

// ── WebSocket (opcional) ───────────────────────────────────────────────────
let io = null; let agente;
if (process.env.SOCKET_IO_CLIENT) {
  try {
    const req = createRequire(path.join(process.env.SOCKET_IO_CLIENT, 'index.js'));
    io = req('socket.io-client').io;
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    if (proxy) { const { HttpsProxyAgent } = req('https-proxy-agent'); agente = new HttpsProxyAgent(proxy); }
  } catch (e) { console.log(`(sin pruebas de WebSocket: ${e.message})`); io = null; }
}
function conectar(usuario) {
  return new Promise((ok, mal) => {
    const s = io(BASE, { auth: { token: `Bearer ${usuario.token}` }, transports: ['websocket'], agent: agente, reconnection: true, reconnectionDelay: 500, timeout: 15000 });
    s.eventos = [];
    s.onAny((nombre, data) => s.eventos.push({ nombre, data }));
    s.on('connect', () => { if (s.yaConectado) console.log(`  (socket de ${usuario.etiqueta} reconectado)`); s.yaConectado = true; ok(s); });
    s.on('disconnect', (motivo) => console.log(`  (socket de ${usuario.etiqueta} desconectado: ${motivo})`));
    s.on('connect_error', (e) => mal(new Error(`Socket de ${usuario.etiqueta}: ${e.message}`)));
  });
}
// Antes de un paso que espera eventos, asegurar que el socket esté conectado (se reconecta solo).
async function conectado(s, ms = 15000) {
  const fin = Date.now() + ms;
  while (s && !s.connected && Date.now() < fin) await dormir(200);
  if (s && !s.connected) console.log('  (el socket no se reconectó a tiempo)');
}
async function evento(s, nombre, pred = () => true, ms = 8000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    const e = s.eventos.find((x) => x.nombre === nombre && pred(x.data));
    if (e) return e.data;
    await dormir(150);
  }
  return null;
}

// ── Pruebas ────────────────────────────────────────────────────────────────
async function main() {
  seccion('Preparación');
  const R = await crearUsuario('CLIENTE', 'Rita');   // responsable de la PyME A
  const Q = await crearUsuario('CLIENTE', 'Quique'); // responsable de la PyME B
  const C1 = await crearUsuario('CONDUCTOR', 'Cho1');
  const C2 = await crearUsuario('CONDUCTOR', 'Cho2');
  const A = await crearPyme(R, `PyME A ${seg()}`);
  const B = await crearPyme(Q, `PyME B ${seg()}`);
  await vincular(R, A, C1);
  await vincular(R, A, C2);
  const V1 = await crearVehiculo(C1);
  await crearVehiculo(C2);
  const choferes = (await api(R, 'GET', `/api/organizaciones/${A}/choferes`)).body || [];
  const IDC1 = choferes.find((c) => c.id_usuario === C1.id_usuario)?.id_conductor;
  const IDC2 = choferes.find((c) => c.id_usuario === C2.id_usuario)?.id_conductor;
  registrar('PyMEs, choferes y vehículos listos', !!(IDC1 && IDC2), JSON.stringify(choferes));

  let sR = null; let sC1 = null;
  if (io) {
    try { sR = await conectar(R); sC1 = await conectar(C1); registrar('WebSocket: PyME y chofer conectados', true); }
    catch (e) { registrar('WebSocket: conexión', false, e.message); sR = sC1 = null; }
  }

  const sonda = await api(R, 'POST', `/api/organizaciones/${A}/viajes`, { id_conductor: IDC1, fecha_programada: new Date(Date.now() - 60000).toISOString(), paradas: [ORIGEN, DESTINO] });
  const ANT = Number(/al menos (\d+) minutos/.exec(sonda.body?.error || '')?.[1] ?? 60);
  const fecha = () => new Date(Date.now() + (ANT + 2) * 60000).toISOString();
  const crearViaje = (paradas, extra = {}) => api(R, 'POST', `/api/organizaciones/${A}/viajes`, { id_conductor: IDC1, fecha_programada: fecha(), paradas, ...extra });

  // ── Lugares ──
  seccion('Lugares: crear, listar, editar, nombre único');
  const NOMBRE = 'Depósito Pilar';
  const DIR = 'Av. Rivadavia 100, CABA';
  const l1 = await api(R, 'POST', `/api/organizaciones/${A}/lugares`, { nombre: `  ${NOMBRE}  `, direccion: DIR, lat: ORIGEN.lat, lng: ORIGEN.lng });
  espera('crear "Depósito Pilar" → 201', l1, 201);
  const L1 = l1.body?.id_lugar;
  registrar('vuelve con nombre sin espacios de más, activo y coordenadas', l1.body?.nombre === NOMBRE && l1.body?.activo === true && l1.body?.lat === ORIGEN.lat && l1.body?.lng === ORIGEN.lng && l1.body?.id_organizacion === A, JSON.stringify(l1.body));
  const l2 = await api(R, 'POST', `/api/organizaciones/${A}/lugares`, { nombre: 'Cliente Recoleta', direccion: 'Av. Alvear 1800, CABA', lat: DESTINO.lat, lng: DESTINO.lng });
  espera('crear "Cliente Recoleta" → 201', l2, 201);
  const L2 = l2.body?.id_lugar;
  espera('mismo nombre con otras mayúsculas → 400', await api(R, 'POST', `/api/organizaciones/${A}/lugares`, { nombre: 'depósito PILAR', direccion: 'x', lat: 0, lng: 0 }), 400, 'Ya existe un lugar con ese nombre');
  espera('lat fuera de rango → 400', await api(R, 'POST', `/api/organizaciones/${A}/lugares`, { nombre: 'Malo', direccion: 'x', lat: 95, lng: 0 }), 400);
  espera('nombre de más de 80 caracteres → 400', await api(R, 'POST', `/api/organizaciones/${A}/lugares`, { nombre: 'x'.repeat(81), direccion: 'x', lat: 0, lng: 0 }), 400);
  espera('otra PyME puede usar el mismo nombre → 201', await api(Q, 'POST', `/api/organizaciones/${B}/lugares`, { nombre: NOMBRE, direccion: 'Pilar', lat: -34.45, lng: -58.91 }), 201);
  const lista = await api(R, 'GET', `/api/organizaciones/${A}/lugares`);
  registrar('listar: los dos, ordenados por nombre', lista.status === 200 && JSON.stringify(lista.body?.map?.((l) => l.id_lugar)) === JSON.stringify([L2, L1]), JSON.stringify(lista.body));
  espera('otra PyME lista los lugares de A → 403', await api(Q, 'GET', `/api/organizaciones/${A}/lugares`), 403);
  espera('otra PyME edita un lugar de A por su ruta → 404', await api(Q, 'PUT', `/api/organizaciones/${B}/lugares/${L1}`, { nombre: 'x' }), 404, 'Lugar no encontrado');
  espera('cuenta de chofer → 403', await api(C1, 'GET', `/api/organizaciones/${A}/lugares`), 403);
  espera('editar sin campos → 400', await api(R, 'PUT', `/api/organizaciones/${A}/lugares/${L1}`, {}), 400, 'al menos un campo');
  espera('renombrar al nombre de otro lugar → 400', await api(R, 'PUT', `/api/organizaciones/${A}/lugares/${L1}`, { nombre: 'CLIENTE recoleta' }), 400, 'Ya existe un lugar con ese nombre');
  espera('renombrarse a sí mismo con otras mayúsculas → 200', await api(R, 'PUT', `/api/organizaciones/${A}/lugares/${L1}`, { nombre: 'DEPÓSITO Pilar' }), 200);
  const ren = await api(R, 'PUT', `/api/organizaciones/${A}/lugares/${L1}`, { nombre: NOMBRE });
  registrar('volver al nombre original → 200', ren.status === 200 && ren.body?.nombre === NOMBRE, JSON.stringify(ren.body));

  seccion('Viaje con una parada { id_lugar }');
  espera('id_lugar y coordenadas en la misma parada → 400', await crearViaje([{ id_lugar: L1, lat: 1, lng: 1 }, DESTINO]), 400, 'no las dos cosas');
  const LB = (await api(Q, 'GET', `/api/organizaciones/${B}/lugares`)).body?.[0]?.id_lugar;
  espera('id_lugar de otra PyME → 400', await crearViaje([{ id_lugar: LB }, DESTINO]), 400, 'no existe o no esta activo');
  espera('id_lugar inexistente → 400', await crearViaje([{ id_lugar: 999999999 }, DESTINO]), 400, 'no existe o no esta activo');
  await conectado(sC1); await conectado(sR);
  const tv = await crearViaje([{ id_lugar: L1 }, DESTINO]);
  espera('crear con { id_lugar } como origen → 201', tv, 201);
  const TL = tv.body?.id_viaje;
  const p0 = tv.body?.paradas?.[0] || {};
  registrar('copia dirección y coordenadas del lugar', p0.direccion === DIR && p0.latitud === ORIGEN.lat && p0.longitud === ORIGEN.lng, JSON.stringify(p0).slice(0, 300));
  registrar('la PyME ve id_lugar y lugar { id_lugar, nombre, activo }', p0.id_lugar === L1 && p0.lugar?.nombre === NOMBRE && p0.lugar?.activo === true, JSON.stringify({ id_lugar: p0.id_lugar, lugar: p0.lugar }));
  registrar('la parada con coordenadas tiene lugar null', tv.body?.paradas?.[1]?.lugar === null, JSON.stringify(tv.body?.paradas?.[1]?.lugar));

  seccion('Editar el lugar no cambia el viaje ya creado');
  const ed = await api(R, 'PUT', `/api/organizaciones/${A}/lugares/${L1}`, { nombre: 'Depósito Pilar Norte', direccion: 'Otra dirección 999', lat: -34.6, lng: -58.4 });
  espera('editar nombre, dirección y coordenadas → 200', ed, 200);
  const dv = (await api(R, 'GET', `/api/organizaciones/${A}/viajes/${TL}`)).body?.paradas?.[0] || {};
  registrar('la parada conserva dirección y coordenadas (snapshot)', dv.direccion === DIR && dv.latitud === ORIGEN.lat && dv.longitud === ORIGEN.lng, JSON.stringify(dv).slice(0, 300));
  registrar('lugar.nombre muestra el nombre actual', dv.lugar?.nombre === 'Depósito Pilar Norte', JSON.stringify(dv.lugar));
  await api(R, 'PUT', `/api/organizaciones/${A}/lugares/${L1}`, { nombre: NOMBRE, direccion: DIR, lat: ORIGEN.lat, lng: ORIGEN.lng });

  seccion('El chofer nunca ve el nombre del lugar');
  const tieneNombre = (x) => /Pilar/i.test(JSON.stringify(x ?? ''));
  const sinLugar = (ps) => (ps || []).every((p) => !('id_lugar' in p) && !('lugar' in p));
  const lc = await api(C1, 'GET', '/api/choferes/viajes');
  const vc = lc.body?.find?.((v) => v.id_viaje === TL);
  registrar('lista del chofer: sin id_lugar, sin lugar, sin el nombre', !!vc && sinLugar(vc.paradas) && !tieneNombre(vc), JSON.stringify(vc?.paradas).slice(0, 300));
  const dc = await api(C1, 'GET', `/api/choferes/viajes/${TL}`);
  registrar('detalle del chofer: sin id_lugar, sin lugar, sin el nombre', dc.status === 200 && sinLugar(dc.body?.paradas) && !tieneNombre(dc.body), JSON.stringify(dc.body?.paradas).slice(0, 300));
  registrar('…pero con la dirección copiada', dc.body?.paradas?.[0]?.direccion === DIR);
  const dvc = await api(C1, 'GET', `/api/viajes/${TL}`);
  registrar('GET /api/viajes/:id del chofer: sin el nombre', dvc.status === 200 && sinLugar(dvc.body?.paradas) && !tieneNombre(dvc.body), `${dvc.status} ${JSON.stringify(dvc.body?.paradas).slice(0, 300)}`);
  if (sC1) {
    const ws = await evento(sC1, 'viaje:asignado', (d) => d.id_viaje === TL);
    registrar('socket viaje:asignado del chofer: sin el nombre', !!ws && !tieneNombre(ws) && sinLugar(ws.paradas), JSON.stringify(ws).slice(0, 300));
  }
  if (sR) {
    const ws = await evento(sR, 'viaje:asignado', (d) => d.id_viaje === TL);
    registrar('ningún socket lleva el nombre, tampoco el de la PyME', !!ws && !tieneNombre(ws), JSON.stringify(ws).slice(0, 300));
  }

  seccion('Remito del viaje con lugar (no tiene que mostrar el nombre)');
  espera('confirmar con vehículo → 200', await api(C1, 'POST', `/api/choferes/viajes/${TL}/confirmar`, { id_vehiculo: V1 }), 200);
  let ini;
  for (let i = 0; i < 20; i++) {
    ini = await api(C1, 'POST', `/api/choferes/viajes/${TL}/iniciar`, { lat: ORIGEN.lat, lng: ORIGEN.lng });
    if (!(ini.status === 400 && /a partir de/.test(ini.body?.error || ''))) break;
    await dormir(30000);
  }
  espera('iniciar en el origen → 200', ini, 200);
  espera('Salir de la parada 1 → 200', await api(C1, 'POST', `/api/choferes/viajes/${TL}/salir`), 200);
  const p2 = dc.body?.paradas?.[1];
  espera('confirmar la parada 2 → 200', await api(C1, 'POST', `/api/viajes/${TL}/confirmar-parada`, { id_parada: p2?.id_parada, lat: p2?.latitud, lng: p2?.longitud }), 200);
  const fin = await api(C1, 'POST', `/api/choferes/viajes/${TL}/salir`);
  registrar('Salir de la última → FINALIZADO con remito', fin.body?.estado === 'FINALIZADO' && !!fin.body?.remito_url, JSON.stringify(fin.body).slice(0, 300));
  if (sC1) {
    const wf = await evento(sC1, 'viaje:finalizado', (d) => d.id_viaje === TL, 3000);
    if (wf) registrar('socket viaje:finalizado: sin el nombre', !tieneNombre(wf), JSON.stringify(wf).slice(0, 300));
  }
  if (fin.body?.remito_url) {
    const pdf = Buffer.from(await (await fetch(fin.body.remito_url)).arrayBuffer());
    // El PDF reparte las letras con kerning ("Riv ada via"): se compara sin espacios.
    const texto = textoPdf(pdf).replace(/\s+/g, '');
    if (/Rivadavia/.test(texto)) {
      registrar('el remito muestra la dirección y NO el nombre del lugar', !/Pilar/i.test(texto), texto.slice(0, 300));
    } else {
      registrar('remito: no se pudo leer el texto del PDF (no se puede afirmar nada)', false, `${pdf.length} bytes; texto: ${texto.slice(0, 200)}`);
    }
  }

  seccion('Borrar un lugar');
  const bl = await api(R, 'DELETE', `/api/organizaciones/${A}/lugares/${L2}`);
  espera('borrar → 200', bl, 200);
  const lista2 = (await api(R, 'GET', `/api/organizaciones/${A}/lugares`)).body || [];
  registrar('ya no aparece en la lista', !lista2.some((l) => l.id_lugar === L2));
  espera('borrarlo de nuevo → 404', await api(R, 'DELETE', `/api/organizaciones/${A}/lugares/${L2}`), 404, 'Lugar no encontrado');
  espera('editar un lugar borrado → 404', await api(R, 'PUT', `/api/organizaciones/${A}/lugares/${L2}`, { nombre: 'y' }), 404);
  espera('usarlo en un viaje nuevo → 400', await crearViaje([ORIGEN, { id_lugar: L2 }]), 400, `El lugar ${L2} no existe o no esta activo`);
  espera('su nombre queda libre → 201', await api(R, 'POST', `/api/organizaciones/${A}/lugares`, { nombre: 'Cliente Recoleta', direccion: 'Av. Alvear 1800, CABA', lat: DESTINO.lat, lng: DESTINO.lng }), 201);
  const tb = await crearViaje([ORIGEN, { id_lugar: L1 }]);
  const TB = tb.body?.id_viaje;
  await api(R, 'DELETE', `/api/organizaciones/${A}/lugares/${L1}`);
  const dtb = (await api(R, 'GET', `/api/organizaciones/${A}/viajes/${TB}`)).body?.paradas?.[1] || {};
  registrar('un viaje que lo usaba conserva la parada y muestra lugar.activo=false', dtb.direccion === DIR && dtb.lugar?.activo === false, JSON.stringify(dtb.lugar));

  // ── Series ──
  const hoy = hoyAR();
  const manana = masDias(hoy, 1);
  const crearSerie = (body) => api(R, 'POST', `/api/organizaciones/${A}/series`, { id_conductor: IDC1, paradas: [ORIGEN, DESTINO], ...body });
  const fechasDe = (r) => (r.body?.viajes || []).map((v) => v.fecha_programada).sort();

  seccion('Serie DIARIA (y un solo serie:asignada)');
  const LS = (await api(R, 'POST', `/api/organizaciones/${A}/lugares`, { nombre: 'Planta Avellaneda', direccion: 'Av. Mitre 500, Avellaneda', lat: -34.6627, lng: -58.3653 })).body?.id_lugar;
  await conectado(sC1); await conectado(sR);
  if (sC1) sC1.eventos.length = 0;
  if (sR) sR.eventos.length = 0;
  const t0 = Date.now();
  const sd = await crearSerie({ frecuencia: 'DIARIA', hora: '09:00', fecha_desde: manana, fecha_hasta: masDias(manana, 2), paradas: [{ id_lugar: LS }, DESTINO], descripcion: 'Reparto diario' });
  espera('DIARIA de 3 días → 201', sd, 201);
  console.log(`  (tardó ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  const SD = sd.body?.serie?.id_serie;
  const espD = [0, 1, 2].map((n) => aUTC(masDias(manana, n), '09:00'));
  registrar('3 viajes a las 09:00 de Argentina (12:00Z)', JSON.stringify(fechasDe(sd)) === JSON.stringify(espD), JSON.stringify(fechasDe(sd)));
  registrar('todos ASIGNADO al chofer, con id_serie', (sd.body?.viajes || []).every((v) => v.estado === 'ASIGNADO' && v.id_serie === SD && v.conductor?.id_conductor === IDC1));
  registrar('serie ACTIVA con zona horaria de Argentina, salteadas y ajustadas vacías', sd.body?.serie?.estado === 'ACTIVA' && sd.body?.serie?.zona_horaria === 'America/Argentina/Buenos_Aires' && sd.body?.salteadas?.length === 0 && sd.body?.ajustadas?.length === 0, JSON.stringify({ s: sd.body?.serie?.estado, z: sd.body?.serie?.zona_horaria, sa: sd.body?.salteadas, aj: sd.body?.ajustadas }));
  registrar('la serie muestra el lugar a la PyME', sd.body?.serie?.paradas?.[0]?.lugar?.nombre === 'Planta Avellaneda');
  registrar('cada viaje con su propia estimación (estimado y precio)', (sd.body?.viajes || []).every((v) => v.estimado && typeof v.precio_estimado === 'number'));
  const idsD = (sd.body?.viajes || []).map((v) => v.id_viaje);
  if (sC1) {
    await dormir(4000);
    const series = sC1.eventos.filter((e) => e.nombre === 'serie:asignada' && e.data?.id_serie === SD);
    const sueltos = sC1.eventos.filter((e) => e.nombre === 'viaje:asignado' && idsD.includes(e.data?.id_viaje));
    registrar('el chofer recibe UN solo serie:asignada con los 3 viajes', series.length === 1 && series[0].data.cantidad_viajes === 3 && series[0].data.viajes?.length === 3, JSON.stringify(series.map((e) => e.data?.cantidad_viajes)));
    registrar('…y ningún viaje:asignado suelto por esos viajes', sueltos.length === 0, `${sueltos.length} eventos`);
    registrar('serie:asignada al chofer sin el nombre del lugar', series.length === 1 && !/Avellaneda Planta|Planta Avellaneda/.test(JSON.stringify(series[0].data)) && series[0].data.viajes.every((v) => sinLugar(v.paradas)), JSON.stringify(series[0]?.data?.viajes?.[0]?.paradas));
  }
  if (sR) {
    const series = sR.eventos.filter((e) => e.nombre === 'serie:asignada' && e.data?.id_serie === SD);
    registrar('la PyME también recibe un solo serie:asignada', series.length === 1, `${series.length}`);
  }

  seccion('Serie DIARIA sin fecha_hasta: 30 días inclusive');
  const s31 = await crearSerie({ frecuencia: 'DIARIA', hora: '07:30', fecha_desde: manana });
  espera('→ 201', s31, 201);
  const f31 = fechasDe(s31);
  registrar('31 viajes, del día desde al desde + 30', f31.length === 31 && f31[0] === aUTC(manana, '07:30') && f31[30] === aUTC(masDias(manana, 30), '07:30') && s31.body?.serie?.fecha_hasta === masDias(manana, 30), `${f31.length}: ${f31[0]} … ${f31.at(-1)} (hasta ${s31.body?.serie?.fecha_hasta})`);
  const S31 = s31.body?.serie?.id_serie;

  seccion('Serie DIAS_SEMANA lun/mié/vie');
  const hasta14 = masDias(manana, 13);
  const sw = await crearSerie({ frecuencia: 'DIAS_SEMANA', dias_semana: [1, 3, 5], hora: '18:15', fecha_desde: manana, fecha_hasta: hasta14 });
  espera('→ 201', sw, 201);
  const espW = fechasEsperadas(manana, hasta14, (f) => [1, 3, 5].includes(diaIso(f))).map((f) => aUTC(f, '18:15'));
  registrar('solo lunes, miércoles y viernes a las 18:15 de Argentina', JSON.stringify(fechasDe(sw)) === JSON.stringify(espW), `esperadas ${JSON.stringify(espW)}\n      llegaron ${JSON.stringify(fechasDe(sw))}`);
  registrar('…verificado por día de la semana y hora en Argentina', fechasDe(sw).every((iso) => [1, 3, 5].includes(diaIso(fechaAR(iso))) && horaAR(iso) === '18:15'));
  const SW = sw.body?.serie?.id_serie;

  seccion('Serie SEMANAL (martes) y hora que cruza la medianoche UTC');
  const ss = await crearSerie({ frecuencia: 'SEMANAL', dia_semana: 2, hora: '23:30', fecha_desde: manana });
  espera('→ 201', ss, 201);
  const espS = fechasEsperadas(manana, masDias(manana, 30), (f) => diaIso(f) === 2).map((f) => aUTC(f, '23:30'));
  registrar('todos los martes de la ventana a las 23:30 de Argentina (02:30Z del día siguiente)', JSON.stringify(fechasDe(ss)) === JSON.stringify(espS), `esperadas ${JSON.stringify(espS)}\n      llegaron ${JSON.stringify(fechasDe(ss))}`);

  seccion('Serie MENSUAL');
  // Primer mes de 30 días o menos que empiece dentro de los próximos 90 días.
  let mes = masDias(hoy.slice(0, 8) + '01', 32).slice(0, 8) + '01';
  const ultimoDia = (m) => masDias(masDias(m, 32).slice(0, 8) + '01', -1);
  while (Number(ultimoDia(mes).slice(8)) === 31) mes = masDias(mes, 32).slice(0, 8) + '01';
  const sm = await crearSerie({ frecuencia: 'MENSUAL', dia_mes: 31, hora: '10:00', fecha_desde: mes });
  espera(`dia_mes 31 desde ${mes} → 201`, sm, 201);
  registrar(`el viaje va el último día del mes (${ultimoDia(mes)}) a las 10:00`, JSON.stringify(fechasDe(sm)) === JSON.stringify([aUTC(ultimoDia(mes), '10:00')]), JSON.stringify(fechasDe(sm)));
  registrar('aparece en ajustadas con motivo FIN_DE_MES', JSON.stringify(sm.body?.ajustadas) === JSON.stringify([{ fecha: ultimoDia(mes), motivo: 'FIN_DE_MES' }]), JSON.stringify(sm.body?.ajustadas));
  const dm = Number(masDias(manana, 5).slice(8));
  const sm2 = await crearSerie({ frecuencia: 'MENSUAL', dia_mes: dm, hora: '08:00', fecha_desde: manana });
  espera(`dia_mes ${dm} → 201`, sm2, 201);
  registrar('un solo viaje, ese día a las 08:00', JSON.stringify(fechasDe(sm2)) === JSON.stringify([aUTC(masDias(manana, 5), '08:00')]), JSON.stringify(fechasDe(sm2)));

  seccion('Series: validaciones');
  espera('ventana de más de 30 días → 400', await crearSerie({ frecuencia: 'DIARIA', hora: '09:00', fecha_desde: manana, fecha_hasta: masDias(manana, 31) }), 400, 'como maximo 30 dias');
  espera('fecha_desde ayer → 400', await crearSerie({ frecuencia: 'DIARIA', hora: '09:00', fecha_desde: masDias(hoy, -1) }), 400, 'no puede ser anterior a hoy');
  espera('fecha_desde a más de 90 días → 400', await crearSerie({ frecuencia: 'DIARIA', hora: '09:00', fecha_desde: masDias(hoy, 91) }), 400, '90 dias');
  espera('dias_semana repetidos → 400', await crearSerie({ frecuencia: 'DIAS_SEMANA', dias_semana: [1, 1], hora: '09:00', fecha_desde: manana }), 400, 'repetidos');
  espera('MENSUAL sin dia_mes → 400', await crearSerie({ frecuencia: 'MENSUAL', hora: '09:00', fecha_desde: manana }), 400, 'dia_mes es requerido');
  espera('hora 24:00 → 400', await crearSerie({ frecuencia: 'DIARIA', hora: '24:00', fecha_desde: manana }), 400, 'HH:MM');
  espera('frecuencia ANUAL → 400', await crearSerie({ frecuencia: 'ANUAL', hora: '09:00', fecha_desde: manana }), 400, 'frecuencia debe ser');
  const pasada = await crearSerie({ frecuencia: 'DIARIA', hora: '00:00', fecha_desde: hoy, fecha_hasta: hoy });
  espera('todas las ocurrencias ya pasaron → 400', pasada, 400, 'no genera ningun viaje');
  registrar('…con salteadas motivo PASADA', pasada.body?.salteadas?.[0]?.motivo === 'PASADA', JSON.stringify(pasada.body));
  espera('serie con un lugar borrado → 400', await crearSerie({ frecuencia: 'DIARIA', hora: '09:00', fecha_desde: manana, paradas: [{ id_lugar: L1 }, DESTINO] }), 400, 'no existe o no esta activo');
  espera('chofer no vinculado (de otra PyME) → 400', await api(Q, 'POST', `/api/organizaciones/${B}/series`, { id_conductor: IDC1, frecuencia: 'DIARIA', hora: '09:00', fecha_desde: manana, paradas: [ORIGEN, DESTINO] }), 400, 'no esta vinculado');

  seccion('Listar y ver series');
  const ls = await api(R, 'GET', `/api/organizaciones/${A}/series`);
  const sdl = ls.body?.find?.((s) => s.id_serie === SD);
  registrar('lista con resumen_viajes', ls.status === 200 && sdl?.resumen_viajes?.total === 3 && sdl.resumen_viajes.por_estado?.ASIGNADO === 3, JSON.stringify(sdl?.resumen_viajes));
  const lsA = await api(R, 'GET', `/api/organizaciones/${A}/series?estado=ACTIVA`);
  registrar('filtro estado=ACTIVA', lsA.status === 200 && lsA.body.every((s) => s.estado === 'ACTIVA'));
  const gd = await api(R, 'GET', `/api/organizaciones/${A}/series/${SD}`);
  registrar('detalle con sus viajes', gd.status === 200 && gd.body?.viajes?.length === 3, `${gd.status}`);
  espera('otra PyME pide la serie por su ruta → 404', await api(Q, 'GET', `/api/organizaciones/${B}/series/${SD}`), 404, 'Serie no encontrada');
  espera('otra PyME lista las series de A → 403', await api(Q, 'GET', `/api/organizaciones/${A}/series`), 403);

  seccion('Viajes de la serie: independientes');
  const [v1, v2, v3] = idsD;
  const lch = (await api(C1, 'GET', '/api/choferes/viajes')).body || [];
  registrar('el chofer los ve como viajes normales con id_serie', idsD.every((id) => lch.find((v) => v.id_viaje === id)?.id_serie === SD));
  registrar('un viaje suelto trae id_serie null', lch.find((v) => v.id_viaje === TB)?.id_serie === null);
  espera('confirmar uno → 200', await api(C1, 'POST', `/api/choferes/viajes/${v1}/confirmar`, { id_vehiculo: V1 }), 200);
  espera('rechazar otro → 200', await api(C1, 'POST', `/api/choferes/viajes/${v2}/rechazar`), 200);
  const estados = async (ids) => {
    const d = (await api(R, 'GET', `/api/organizaciones/${A}/series/${SD}`)).body?.viajes || [];
    return ids.map((id) => d.find((v) => v.id_viaje === id)?.estado);
  };
  registrar('cada uno en su estado, el tercero sigue ASIGNADO', JSON.stringify(await estados([v1, v2, v3])) === '["CONFIRMADO","RECHAZADO","ASIGNADO"]', JSON.stringify(await estados([v1, v2, v3])));
  const v4 = (sw.body?.viajes || [])[0]?.id_viaje;
  const v5 = (sw.body?.viajes || [])[1]?.id_viaje;
  const v6 = (sw.body?.viajes || [])[2]?.id_viaje;
  const antesW = (await api(R, 'GET', `/api/organizaciones/${A}/series/${SW}`)).body?.viajes || [];
  const e4 = await api(R, 'PUT', `/api/organizaciones/${A}/viajes/${v4}`, { descripcion: 'solo este' });
  registrar('editar uno → 200 y conserva id_serie', e4.status === 200 && e4.body?.id_serie === SW, `${e4.status} ${e4.body?.id_serie}`);
  const r5 = await api(R, 'POST', `/api/organizaciones/${A}/viajes/${v5}/reasignar`, { id_conductor: IDC2 });
  registrar('reasignar otro a Cho2 → 200 y conserva id_serie', r5.status === 200 && r5.body?.id_serie === SW && r5.body?.conductor?.id_conductor === IDC2, `${r5.status}`);
  espera('cancelar otro → 200', await api(R, 'POST', `/api/organizaciones/${A}/viajes/${v6}/cancelar`), 200);
  const despuesW = (await api(R, 'GET', `/api/organizaciones/${A}/series/${SW}`)).body?.viajes || [];
  const resto = (l) => l.filter((v) => ![v4, v5, v6].includes(v.id_viaje)).map((v) => [v.id_viaje, v.estado, v.descripcion, v.conductor?.id_conductor, v.fecha_programada]);
  registrar('los demás viajes de la serie no cambiaron', resto(antesW).length > 0 && JSON.stringify(resto(antesW)) === JSON.stringify(resto(despuesW)), JSON.stringify(resto(despuesW)).slice(0, 300));
  const sw2 = (await api(R, 'GET', `/api/organizaciones/${A}/series/${SW}`)).body || {};
  registrar('la serie sigue ACTIVA y con su definición original', sw2.estado === 'ACTIVA' && sw2.id_conductor === IDC1 && sw2.descripcion !== 'solo este', JSON.stringify({ e: sw2.estado, c: sw2.id_conductor, d: sw2.descripcion }));

  seccion('Cancelar la serie');
  await conectado(sR);
  const antesD = await estados([v1, v2, v3]);
  const cs = await api(R, 'POST', `/api/organizaciones/${A}/series/${SD}/cancelar`);
  espera('→ 200', cs, 200);
  registrar('queda CANCELADA con fecha_baja', cs.body?.estado === 'CANCELADA' && !!cs.body?.fecha_baja, JSON.stringify(cs.body));
  registrar('los viajes ya creados siguen igual', JSON.stringify(await estados([v1, v2, v3])) === JSON.stringify(antesD), JSON.stringify(await estados([v1, v2, v3])));
  espera('cancelarla de nuevo → 400', await api(R, 'POST', `/api/organizaciones/${A}/series/${SD}/cancelar`), 400, 'CANCELADA');
  espera('otra PyME la cancela por su ruta → 404', await api(Q, 'POST', `/api/organizaciones/${B}/series/${SW}/cancelar`), 404);
  if (sR) registrar('socket serie:cancelada a la PyME', !!(await evento(sR, 'serie:cancelada', (d) => d.id_serie === SD && d.estado === 'CANCELADA')));

  seccion('Límite de paradas');
  const once = Array.from({ length: 11 }, (_, i) => ({ lat: -34.6037 + i * 0.002, lng: -58.3816 - i * 0.002, direccion: `Parada ${i + 1}` }));
  espera('viaje con 11 paradas → 400', await crearViaje(once), 400, 'como máximo 10 paradas');
  espera('estimar-costo con 11 paradas → 400', await api(R, 'POST', '/api/viajes/estimar-costo', { paradas: once }), 400, 'como máximo 10 paradas');
  espera('editar un viaje a 11 paradas → 400', await api(R, 'PUT', `/api/organizaciones/${A}/viajes/${TB}`, { paradas: once }), 400, 'como máximo 10 paradas');
  espera('serie con 11 paradas → 400', await crearSerie({ frecuencia: 'DIARIA', hora: '09:00', fecha_desde: manana, paradas: once }), 400, 'como máximo 10 paradas');
  const diez = await crearViaje(once.slice(0, 10));
  registrar('viaje con exactamente 10 paradas → 201', diez.status === 201 && diez.body?.paradas?.length === 10, `${diez.status} ${JSON.stringify(diez.body).slice(0, 200)}`);

  seccion('Desvincular al chofer');
  const activas = ((await api(R, 'GET', `/api/organizaciones/${A}/series?estado=ACTIVA`)).body || []).filter((s) => s.id_conductor === IDC1).map((s) => s.id_serie).sort((a, b) => a - b);
  const noFinales = ((await api(R, 'GET', `/api/organizaciones/${A}/viajes?grupo=activos`)).body || []).filter((v) => v.conductor?.id_conductor === IDC1).map((v) => v.id_viaje).sort((a, b) => a - b);
  const des = await api(R, 'DELETE', `/api/organizaciones/${A}/choferes/${IDC1}`);
  espera('→ 200', des, 200);
  const canc = [...(des.body?.viajes_cancelados || [])].sort((a, b) => a - b);
  const borr = [...(des.body?.series_borradas || [])].sort((a, b) => a - b);
  registrar(`cancela sus ${noFinales.length} viajes no finales (incluidos los de series)`, JSON.stringify(canc) === JSON.stringify(noFinales), `esperados ${noFinales.length}, llegaron ${canc.length}`);
  registrar(`series_borradas trae sus ${activas.length} series activas`, JSON.stringify(borr) === JSON.stringify(activas), `esperadas ${JSON.stringify(activas)}, llegaron ${JSON.stringify(borr)}`);
  registrar('…y no la que ya estaba cancelada', !borr.includes(SD));
  const gsw = (await api(R, 'GET', `/api/organizaciones/${A}/series/${SW}`)).body || {};
  registrar('la serie queda BORRADA', gsw.estado === 'BORRADA', gsw.estado);
  const gsd = (await api(R, 'GET', `/api/organizaciones/${A}/series/${SD}`)).body || {};
  registrar('la cancelada sigue CANCELADA', gsd.estado === 'CANCELADA', gsd.estado);
  const v5d = (await api(R, 'GET', `/api/organizaciones/${A}/viajes/${v5}`)).body || {};
  registrar('el viaje de la serie reasignado a Cho2 no se cancela', v5d.estado === 'ASIGNADO' && v5d.conductor?.id_conductor === IDC2, `${v5d.estado} ${v5d.conductor?.id_conductor}`);
  const v31 = (await api(R, 'GET', `/api/organizaciones/${A}/series/${S31}`)).body?.viajes || [];
  registrar('los 31 viajes de la serie diaria quedaron CANCELADO por DESVINCULACION', v31.length === 31 && v31.every((v) => v.estado === 'CANCELADO' && v.causa_cancelacion === 'DESVINCULACION'), JSON.stringify([...new Set(v31.map((v) => `${v.estado}/${v.causa_cancelacion}`))]));

  sR?.close(); sC1?.close();
}

const inicio = Date.now();
console.log(`Fleter · pruebas del Paso 4 (lugares y series) · ${BASE}`);
try { await main(); } catch (e) { registrar('ejecución completa', false, e.stack || e.message); }
const fallas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallas.length} de ${resultados.length} pruebas pasaron (${((Date.now() - inicio) / 1000).toFixed(1)} s)`);
if (fallas.length) {
  console.log('\nFallaron:');
  for (const f of fallas) console.log(`  - [${f.grupo}] ${f.nombre}\n      ${f.detalle}`);
}
process.exit(fallas.length ? 1 : 0);
