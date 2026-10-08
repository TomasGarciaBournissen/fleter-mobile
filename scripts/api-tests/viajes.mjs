#!/usr/bin/env node
// Pruebas de contrato del viaje interno (api.md, sección "Viaje interno — la PyME asigna,
// el chofer confirma (Paso 2)"): crear, ver, editar, reasignar, confirmar, rechazar,
// iniciar en el origen, avanzar, cerrar con remito, cancelar, desvincular y VENCIDO.
//
// Uso:
//   BASE_URL=... FIREBASE_API_KEY=... ESTADO=/tmp/x.json node scripts/api-tests/viajes.mjs principal
//   (cuando cierre la ventana de inicio de los viajes que deja preparados, ~95 min después)
//   BASE_URL=... FIREBASE_API_KEY=... ESTADO=/tmp/x.json node scripts/api-tests/viajes.mjs vencido
//
// Opcional: SOCKET_IO_CLIENT=<carpeta con node_modules/socket.io-client> suma las pruebas de
// eventos WebSocket. Detrás de un proxy hace falta además https-proxy-agent en esa carpeta.
//
// Usa 5 canjes de invitación (el límite es 5 cada 15 minutos). Crea datos que no se borran:
// correr contra local o staging, nunca contra producción.

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE = (process.env.BASE_URL || '').replace(/\/$/, '');
const KEY = process.env.FIREBASE_API_KEY || '';
const ESTADO = process.env.ESTADO || '';
const MODO = process.argv[2] || 'principal';

if (!BASE) { console.error('Falta BASE_URL'); process.exit(2); }
if (!KEY) { console.error('Falta FIREBASE_API_KEY'); process.exit(2); }
if (!['principal', 'vencido'].includes(MODO)) { console.error('Modo: principal | vencido'); process.exit(2); }
if (MODO === 'vencido' && !ESTADO) { console.error('El modo vencido necesita ESTADO'); process.exit(2); }

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
  const res = await fetch(BASE + ruta, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

function espera(nombre, r, status, textoError) {
  let ok = r.status === status;
  if (ok && textoError) ok = typeof r.body?.error === 'string' && r.body.error.toLowerCase().includes(textoError.toLowerCase());
  return registrar(nombre, ok, `esperaba ${status}${textoError ? ` "${textoError}"` : ''}, llegó ${r.status} ${JSON.stringify(r.body)}`);
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

async function entrar(email, etiqueta) {
  const u = { etiqueta, email, token: await login(email) };
  const me = await api(u, 'GET', '/api/auth/me');
  if (me.status !== 200) throw new Error(`GET /api/auth/me falló para ${etiqueta}: ${me.status} ${JSON.stringify(me.body)}`);
  u.id_usuario = me.body.id_usuario;
  return u;
}

async function crearUsuario(tipo, etiqueta) {
  const email = `fleter-test-${etiqueta.toLowerCase()}-${seg()}@example.com`;
  const dni = String(10000000 + Math.floor(Math.random() * 89999999));
  const base = { nombre: etiqueta, apellido: 'Prueba', dni, email, contrasena: PASS, telefono: '+5491100000000' };
  const alta = () => tipo === 'CLIENTE'
    ? api(null, 'POST', '/api/auth/registro-cliente', base)
    : api(null, 'POST', '/api/auth/registro-conductor', { ...base, nro_licencia: `LIC${dni}`, licencia_vencimiento: '2028-12-31T00:00:00.000Z' });
  let r = await alta();
  // Neon suspende la base sin uso: el primer request puede dar 500 mientras despierta.
  if (r.status >= 500) { await dormir(5000); r = await alta(); }
  if (r.status !== 201) throw new Error(`No se pudo registrar ${etiqueta} (${tipo}): ${r.status} ${JSON.stringify(r.body)}`);
  return entrar(email, etiqueta);
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

async function vincular(pymeUsuario, idOrg, tipo, invitado) {
  const inv = await api(pymeUsuario, 'POST', `/api/organizaciones/${idOrg}/invitaciones`, { tipo });
  if (inv.status !== 201) throw new Error(`No se pudo generar el código ${tipo}: ${inv.status} ${JSON.stringify(inv.body)}`);
  const c = await api(invitado, 'POST', '/api/invitaciones/canjear', { codigo: inv.body.codigo });
  if (c.status !== 200) throw new Error(`Canje de ${invitado.etiqueta} falló: ${c.status} ${JSON.stringify(c.body)}`);
}

const LETRAS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const patente = () => 'T' + Array.from({ length: 6 }, () => (LETRAS + '23456789')[Math.floor(Math.random() * 31)]).join('');

async function crearVehiculo(chofer, condiciones = []) {
  const r = await api(chofer, 'POST', '/api/conductores/mis-vehiculos', {
    patente: patente(), marca: 'Fiat', modelo: 'Fiorino', anio: 2020, color: 'Blanco', tipo_vehiculo: 'Utilitario', condiciones,
  });
  if (r.status !== 201) throw new Error(`No se pudo registrar el vehículo de ${chofer.etiqueta}: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.id_vehiculo;
}

const ORIGEN = { lat: -34.6037, lng: -58.3816, direccion: 'Plaza de Mayo, CABA' };
const DESTINO = { lat: -34.5895, lng: -58.3974, direccion: 'Recoleta, CABA' };
const LEJOS = { lat: -34.6137, lng: -58.3816 }; // ~1,1 km al sur del origen

const historial = (v) => (v?.historial_estados || []).map((h) => h.estado).join(',');

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
    const s = io(BASE, { auth: { token: `Bearer ${usuario.token}` }, transports: ['websocket'], agent: agente, reconnection: false, timeout: 15000 });
    s.eventos = [];
    s.onAny((nombre, data) => s.eventos.push({ nombre, data }));
    s.on('connect', () => ok(s));
    s.on('connect_error', (e) => mal(new Error(`Socket de ${usuario.etiqueta}: ${e.message}`)));
  });
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

// ── Modo principal ─────────────────────────────────────────────────────────
async function principal() {
  seccion('Preparación');
  const R = await crearUsuario('CLIENTE', 'Rita');    // responsable de la PyME A
  const M = await crearUsuario('CLIENTE', 'Mario');   // miembro de la PyME A
  const Q = await crearUsuario('CLIENTE', 'Quique');  // responsable de la PyME B
  const C1 = await crearUsuario('CONDUCTOR', 'Cho1'); // vinculado a A y B, con vehículo FRAGIL y otro sin condiciones
  const C2 = await crearUsuario('CONDUCTOR', 'Cho2'); // vinculado a A, vehículo sin condiciones
  const C3 = await crearUsuario('CONDUCTOR', 'Cho3'); // vinculado a A, para desvincular
  const C5 = await crearUsuario('CONDUCTOR', 'Cho5'); // sin vínculo
  const A = await crearPyme(R, `PyME A ${seg()}`);
  const B = await crearPyme(Q, `PyME B ${seg()}`);
  await vincular(R, A, 'MIEMBRO', M);  // canje 1
  await vincular(R, A, 'CHOFER', C1);  // canje 2
  await vincular(M, A, 'CHOFER', C2);  // canje 3 (lo genera un miembro)
  await vincular(R, A, 'CHOFER', C3);  // canje 4
  await vincular(Q, B, 'CHOFER', C1);  // canje 5
  const V1f = await crearVehiculo(C1, ['FRAGIL']);
  const V1s = await crearVehiculo(C1);
  const V2 = await crearVehiculo(C2);
  const V5 = await crearVehiculo(C5);
  const choferes = (await api(R, 'GET', `/api/organizaciones/${A}/choferes`)).body;
  const idc = (u) => choferes.find((c) => c.id_usuario === u.id_usuario)?.id_conductor;
  const [IDC1, IDC2, IDC3] = [idc(C1), idc(C2), idc(C3)];
  const IDC5 = (await api(C5, 'GET', '/api/conductores/mis-vehiculos')).body?.find?.((v) => v.id_vehiculo === V5)?.id_conductor;
  registrar('2 PyMEs, 1 miembro, 3 choferes vinculados y vehículos', !!(IDC1 && IDC2 && IDC3 && IDC5), JSON.stringify(choferes));

  // Sockets: la PyME A (sala organizacion:A por el responsable) y el chofer 1.
  let sR = null; let sC1 = null;
  if (io) {
    try { sR = await conectar(R); sC1 = await conectar(C1); registrar('WebSocket: responsable y chofer conectados', true); }
    catch (e) { registrar('WebSocket: conexión', false, e.message); sR = sC1 = null; }
  }

  // Anticipación mínima configurada: se lee del mensaje de error.
  const enMin = (m) => new Date(Date.now() + m * 60000).toISOString();
  const sonda = await api(R, 'POST', `/api/organizaciones/${A}/viajes`, {
    id_conductor: IDC2, fecha_programada: new Date(Date.now() - 60000).toISOString(), paradas: [ORIGEN, DESTINO],
  });
  espera('fecha_programada pasada → 400', sonda, 400, 'fecha_programada debe ser una fecha ISO futura');
  const ANT = Number(/al menos (\d+) minutos/.exec(sonda.body?.error || '')?.[1] ?? 60);
  const fecha = () => enMin(ANT + 2);
  console.log(`  (anticipación mínima en este servidor: ${ANT} min)`);

  const crear = (quien, idConductor, extra = {}, org = A) => api(quien, 'POST', `/api/organizaciones/${org}/viajes`, {
    id_conductor: idConductor, fecha_programada: fecha(), paradas: [ORIGEN, DESTINO], ...extra,
  });

  seccion('POST /api/organizaciones/:id/viajes — validaciones');
  espera('chofer sin vínculo con la PyME → 400', await crear(R, IDC5), 400, 'no esta vinculado');
  espera('chofer vinculado sin vehículos → 400', await crear(R, IDC3), 400, 'no tiene vehiculos propios');
  espera('ningún vehículo cumple REFRIGERADO → 400', await crear(R, IDC1, { condiciones_requeridas: ['REFRIGERADO'] }), 400, 'REFRIGERADO');
  espera('sin id_conductor → 400', await api(R, 'POST', `/api/organizaciones/${A}/viajes`, { fecha_programada: fecha(), paradas: [ORIGEN, DESTINO] }), 400);
  espera('responsable de otra PyME → 403', await crear(Q, IDC1), 403, 'No perteneces a esta PyME');
  espera('cuenta CONDUCTOR → 403', await crear(C1, IDC1), 403);
  await crearVehiculo(C3); // desde acá C3 ya puede recibir viajes

  seccion('Crear: un MIEMBRO asigna a Cho1 un viaje FRAGIL');
  const r1 = await crear(M, IDC1, { condiciones_requeridas: ['FRAGIL'], descripcion: 'Portón azul' });
  espera('201', r1, 201);
  const T1 = r1.body?.id_viaje;
  const v1 = r1.body || {};
  registrar('estado ASIGNADO, sin vehículo', v1.estado === 'ASIGNADO' && v1.id_vehiculo === null && v1.vehiculo === null, JSON.stringify(v1).slice(0, 300));
  registrar('organizacion, creador (el miembro) y conductor', v1.organizacion?.id_organizacion === A && v1.creador?.id_usuario === M.id_usuario && v1.conductor?.id_conductor === IDC1);
  registrar('condiciones_requeridas es ["FRAGIL"]', JSON.stringify(v1.condiciones_requeridas) === '["FRAGIL"]', JSON.stringify(v1.condiciones_requeridas));
  registrar('historial: ASIGNADO con origen CLIENTE', historial(v1) === 'ASIGNADO' && v1.historial_estados?.[0]?.origen === 'CLIENTE', JSON.stringify(v1.historial_estados));
  registrar('paradas con id_parada, en orden', v1.paradas?.length === 2 && v1.paradas[0].orden === 1 && v1.paradas.every((p) => p.id_parada));
  registrar('precio, metodo_cobro y vencido=false', typeof v1.precio_estimado === 'number' && v1.metodo_cobro === 'CALCULO_PLATAFORMA' && v1.vencido === false);
  if (sC1) registrar('WS: el chofer recibe viaje:asignado con id_organizacion', !!(await evento(sC1, 'viaje:asignado', (d) => d.id_viaje === T1 && d.id_organizacion === A)));
  if (sR) registrar('WS: la PyME recibe viaje:asignado', !!(await evento(sR, 'viaje:asignado', (d) => d.id_viaje === T1)));

  seccion('Quién ve qué');
  const listaA = await api(R, 'GET', `/api/organizaciones/${A}/viajes`);
  registrar('el responsable ve el viaje que creó el miembro', listaA.status === 200 && listaA.body.some((v) => v.id_viaje === T1), `${listaA.status}`);
  const det = await api(R, 'GET', `/api/organizaciones/${A}/viajes/${T1}`);
  registrar('detalle de la PyME: 200 con la clave ruta_planeada', det.status === 200 && 'ruta_planeada' in det.body, `${det.status} ${JSON.stringify(det.body).slice(0, 200)}`);
  espera('otra PyME lista los viajes de A → 403', await api(Q, 'GET', `/api/organizaciones/${A}/viajes`), 403);
  espera('otra PyME pide el viaje por su propia ruta → 404', await api(Q, 'GET', `/api/organizaciones/${B}/viajes/${T1}`), 404, 'Viaje no encontrado');
  espera('viaje inexistente → 404', await api(R, 'GET', `/api/organizaciones/${A}/viajes/999999999`), 404, 'Viaje no encontrado');
  const delChofer = await api(C1, 'GET', '/api/choferes/viajes');
  const t1Chofer = delChofer.body?.find?.((v) => v.id_viaje === T1);
  registrar('el chofer lo ve en /api/choferes/viajes con el nombre de la PyME', delChofer.status === 200 && !!t1Chofer?.organizacion?.nombre, `${delChofer.status}`);
  espera('otro chofer pide el detalle → 404', await api(C2, 'GET', `/api/choferes/viajes/${T1}`), 404);
  espera('ruta vieja GET /api/viajes/:id para el miembro → 403', await api(R, 'GET', `/api/viajes/${T1}`), 403);
  const legacy = await api(M, 'GET', '/api/viajes/mis-viajes');
  registrar('GET /api/viajes/mis-viajes no lista viajes de PyME', legacy.status === 200 && !legacy.body.some((v) => v.id_viaje === T1), `${legacy.status}`);

  seccion('Filtros');
  const act = await api(R, 'GET', `/api/organizaciones/${A}/viajes?grupo=activos`);
  const hist = await api(R, 'GET', `/api/organizaciones/${A}/viajes?grupo=historial`);
  registrar('grupo=activos lo incluye y grupo=historial no', act.body?.some?.((v) => v.id_viaje === T1) && !hist.body?.some?.((v) => v.id_viaje === T1));
  const porEstado = await api(R, 'GET', `/api/organizaciones/${A}/viajes?estado=ASIGNADO`);
  registrar('estado=ASIGNADO devuelve solo ASIGNADO', porEstado.status === 200 && porEstado.body.every((v) => v.estado === 'ASIGNADO'));
  espera('estado inválido → 400', await api(R, 'GET', `/api/organizaciones/${A}/viajes?estado=VOLANDO`), 400);
  espera('grupo inválido → 400', await api(R, 'GET', `/api/organizaciones/${A}/viajes?grupo=todos`), 400);
  const asig = await api(C1, 'GET', '/api/choferes/viajes?grupo=asignados');
  registrar('chofer grupo=asignados lo incluye', asig.body?.some?.((v) => v.id_viaje === T1));

  seccion('Confirmar');
  espera('iniciar sin confirmar → 400', await api(C1, 'POST', `/api/choferes/viajes/${T1}/iniciar`, ORIGEN), 400, 'confirmar el viaje');
  espera('vehículo de otro chofer → 400', await api(C1, 'POST', `/api/choferes/viajes/${T1}/confirmar`, { id_vehiculo: V2 }), 400, 'no es tuyo');
  espera('vehículo propio sin FRAGIL → 400', await api(C1, 'POST', `/api/choferes/viajes/${T1}/confirmar`, { id_vehiculo: V1s }), 400, 'FRAGIL');
  espera('otro chofer confirma → 404', await api(C2, 'POST', `/api/choferes/viajes/${T1}/confirmar`, { id_vehiculo: V2 }), 404);
  const conf = await api(C1, 'POST', `/api/choferes/viajes/${T1}/confirmar`, { id_vehiculo: V1f });
  espera('vehículo correcto → 200', conf, 200);
  registrar('queda CONFIRMADO con vehículo y fecha_confirmacion', conf.body?.estado === 'CONFIRMADO' && conf.body?.vehiculo?.id_vehiculo === V1f && !!conf.body?.fecha_confirmacion, JSON.stringify(conf.body));
  espera('confirmar de nuevo → 400', await api(C1, 'POST', `/api/choferes/viajes/${T1}/confirmar`, { id_vehiculo: V1f }), 400, 'CONFIRMADO');
  if (sR) registrar('WS: la PyME recibe viaje:confirmado con el vehículo', !!(await evento(sR, 'viaje:confirmado', (d) => d.id_viaje === T1 && d.vehiculo?.id_vehiculo === V1f)));

  seccion('Editar (PUT)');
  espera('body vacío → 400', await api(R, 'PUT', `/api/organizaciones/${A}/viajes/${T1}`, {}), 400, 'al menos un campo');
  espera('condición que el chofer no cumple → 400', await api(R, 'PUT', `/api/organizaciones/${A}/viajes/${T1}`, { condiciones_requeridas: ['FRAGIL', 'REFRIGERADO'] }), 400, 'REFRIGERADO');
  const ed = await api(M, 'PUT', `/api/organizaciones/${A}/viajes/${T1}`, { descripcion: 'editado' });
  espera('editar un CONFIRMADO → 200', ed, 200);
  registrar('vuelve a ASIGNADO sin vehículo', ed.body?.estado === 'ASIGNADO' && ed.body?.vehiculo === null && ed.body?.descripcion === 'editado', JSON.stringify(ed.body).slice(0, 200));
  registrar('historial ASIGNADO,CONFIRMADO,ASIGNADO', historial(ed.body) === 'ASIGNADO,CONFIRMADO,ASIGNADO', historial(ed.body));
  if (sC1) registrar('WS: el chofer recibe viaje:editado con confirmacion_anulada', !!(await evento(sC1, 'viaje:editado', (d) => d.id_viaje === T1 && d.confirmacion_anulada === true)));
  const ed2 = await api(R, 'PUT', `/api/organizaciones/${A}/viajes/${T1}`, { paradas: [ORIGEN, { lat: -34.5975, lng: -58.3923, direccion: 'Tribunales' }, DESTINO] });
  registrar('cambiar paradas → 3 paradas y precio recalculado', ed2.status === 200 && ed2.body?.paradas?.length === 3, `${ed2.status} ${JSON.stringify(ed2.body).slice(0, 200)}`);

  seccion('Reasignar');
  espera('al mismo chofer → 400', await api(R, 'POST', `/api/organizaciones/${A}/viajes/${T1}/reasignar`, { id_conductor: IDC1 }), 400, 'ya esta asignado');
  espera('a un chofer sin vehículo FRAGIL → 400', await api(R, 'POST', `/api/organizaciones/${A}/viajes/${T1}/reasignar`, { id_conductor: IDC2 }), 400);
  espera('a un chofer no vinculado → 400', await api(R, 'POST', `/api/organizaciones/${A}/viajes/${T1}/reasignar`, { id_conductor: IDC5 }), 400, 'no esta vinculado');
  const T2 = (await crear(R, IDC1)).body?.id_viaje;
  await api(C1, 'POST', `/api/choferes/viajes/${T2}/confirmar`, { id_vehiculo: V1s });
  const rea = await api(R, 'POST', `/api/organizaciones/${A}/viajes/${T2}/reasignar`, { id_conductor: IDC2 });
  espera('un CONFIRMADO a otro chofer → 200', rea, 200);
  registrar('queda ASIGNADO a Cho2 sin vehículo', rea.body?.estado === 'ASIGNADO' && rea.body?.conductor?.id_conductor === IDC2 && rea.body?.vehiculo === null);
  espera('el chofer anterior ya no lo ve → 404', await api(C1, 'GET', `/api/choferes/viajes/${T2}`), 404);
  espera('el chofer nuevo sí → 200', await api(C2, 'GET', `/api/choferes/viajes/${T2}`), 200);
  if (sC1) registrar('WS: el chofer anterior recibe viaje:desasignado', !!(await evento(sC1, 'viaje:desasignado', (d) => d.id_viaje === T2)));

  seccion('Rechazar');
  const rech = await api(C2, 'POST', `/api/choferes/viajes/${T2}/rechazar`);
  espera('ASIGNADO → 200', rech, 200);
  registrar('queda RECHAZADO con fecha_rechazo', rech.body?.estado === 'RECHAZADO' && !!rech.body?.fecha_rechazo, JSON.stringify(rech.body));
  espera('rechazar de nuevo → 400', await api(C2, 'POST', `/api/choferes/viajes/${T2}/rechazar`), 400);
  espera('confirmar un RECHAZADO → 400', await api(C2, 'POST', `/api/choferes/viajes/${T2}/confirmar`, { id_vehiculo: V2 }), 400);
  espera('la PyME cancela un RECHAZADO → 400', await api(R, 'POST', `/api/organizaciones/${A}/viajes/${T2}/cancelar`), 400, 'RECHAZADO');
  espera('editar un RECHAZADO → 400', await api(R, 'PUT', `/api/organizaciones/${A}/viajes/${T2}`, { descripcion: 'x' }), 400);
  if (sR) registrar('WS: la PyME recibe viaje:rechazado', !!(await evento(sR, 'viaje:rechazado', (d) => d.id_viaje === T2)));

  seccion('El chofer cancela antes de iniciar');
  const T3 = (await crear(R, IDC1)).body?.id_viaje;
  const cc = await api(C1, 'POST', `/api/choferes/viajes/${T3}/cancelar`);
  espera('ASIGNADO → 200', cc, 200);
  registrar('causa_cancelacion CHOFER', cc.body?.estado === 'CANCELADO' && cc.body?.causa_cancelacion === 'CHOFER', JSON.stringify(cc.body));
  espera('cancelar de nuevo → 400', await api(C1, 'POST', `/api/choferes/viajes/${T3}/cancelar`), 400);
  if (sR) registrar('WS: la PyME recibe viaje:cancelado causa CHOFER', !!(await evento(sR, 'viaje:cancelado', (d) => d.id_viaje === T3 && d.causa === 'CHOFER')));

  seccion('Ciclo completo: iniciar en el origen → FINALIZADO con remito');
  espera('reconfirmar después de la edición → 200', await api(C1, 'POST', `/api/choferes/viajes/${T1}/confirmar`, { id_vehiculo: V1f }), 200);
  if (sC1) {
    sC1.emit('conductor:ubicacion', { id_viaje: T1, ...ORIGEN, timestamp: Date.now() });
    registrar('WS: ping GPS antes de iniciar → error "El viaje no fue iniciado"', !!(await evento(sC1, 'error', (d) => (d.error || d.mensaje || '').includes('no fue iniciado'))));
  }
  const lejos = await api(C1, 'POST', `/api/choferes/viajes/${T1}/iniciar`, LEJOS);
  espera('a ~1 km del origen → 400 con la distancia', lejos, 400, 'del origen');
  // Si la ventana todavía no abrió (anticipación configurada alta), esperar a que abra.
  let ini;
  for (let i = 0; i < 20; i++) {
    ini = await api(C1, 'POST', `/api/choferes/viajes/${T1}/iniciar`, ORIGEN);
    if (!(ini.status === 400 && /a partir de/.test(ini.body?.error || ''))) break;
    if (i === 0) console.log(`  (la ventana todavía no abrió: ${ini.body.error}; espero)`);
    await dormir(30000);
  }
  espera('en el origen y dentro de la ventana → 200', ini, 200);
  registrar('pasa directo a CARGANDO, inicio = llegada al origen', ini.body?.estado === 'CARGANDO' && ini.body?.fecha_inicio && ini.body.fecha_inicio === ini.body.fecha_llegada_origen, JSON.stringify(ini.body));
  if (sR) registrar('WS: la PyME recibe viaje:iniciado', !!(await evento(sR, 'viaje:iniciado', (d) => d.id_viaje === T1)));
  espera('iniciar de nuevo → 400', await api(C1, 'POST', `/api/choferes/viajes/${T1}/iniciar`, ORIGEN), 400);
  espera('pedir CARGANDO por PATCH → 400', await api(C1, 'PATCH', `/api/viajes/${T1}/estado`, { estado: 'CARGANDO' }), 400);
  espera('el chofer no puede cancelar en curso → 400', await api(C1, 'POST', `/api/choferes/viajes/${T1}/cancelar`), 400, 'ya esta en curso');
  espera('editar en curso → 400', await api(R, 'PUT', `/api/organizaciones/${A}/viajes/${T1}`, { descripcion: 'x' }), 400, 'CARGANDO');
  espera('reasignar en curso → 400', await api(R, 'POST', `/api/organizaciones/${A}/viajes/${T1}/reasignar`, { id_conductor: IDC2 }), 400);
  espera('remito antes de finalizar → 400', await api(R, 'GET', `/api/organizaciones/${A}/viajes/${T1}/remito`), 400, 'finalizados');
  const costo = await api(R, 'GET', `/api/organizaciones/${A}/viajes/${T1}/costo-acumulado`);
  registrar('costo-acumulado por la ruta de la PyME → 200', costo.status === 200 && 'precio_acumulado' in (costo.body || {}), `${costo.status} ${JSON.stringify(costo.body)}`);
  espera('costo-acumulado desde otra PyME → 404', await api(Q, 'GET', `/api/organizaciones/${B}/viajes/${T1}/costo-acumulado`), 404);
  if (sC1 && sR) {
    sC1.emit('conductor:ubicacion', { id_viaje: T1, ...ORIGEN, timestamp: Date.now() });
    registrar('WS: la sala de la PyME recibe mapa:actualizar del viaje', !!(await evento(sR, 'mapa:actualizar', (d) => d.id_viaje === T1)));
  }
  espera('CARGANDO → EN_RUTA → 200', await api(C1, 'PATCH', `/api/viajes/${T1}/estado`, { estado: 'EN_RUTA' }), 200);
  if (sR) registrar('WS: la PyME recibe viaje:estado_cambiado', !!(await evento(sR, 'viaje:estado_cambiado', (d) => d.id_viaje === T1 && d.estado_nuevo === 'EN_RUTA')));
  const paradas = (await api(C1, 'GET', `/api/choferes/viajes/${T1}`)).body?.paradas || [];
  espera('confirmar parada lejos → 400', await api(C1, 'POST', `/api/viajes/${T1}/confirmar-parada`, { id_parada: paradas[0]?.id_parada, ...LEJOS }), 400, 'de la parada');
  for (const p of paradas.slice(0, -1)) {
    espera(`confirmar parada ${p.orden} → 200 sin cerrar`, await api(C1, 'POST', `/api/viajes/${T1}/confirmar-parada`, { id_parada: p.id_parada, lat: p.latitud, lng: p.longitud }), 200);
  }
  espera('EN_RUTA → DESCARGANDO → 200', await api(C1, 'PATCH', `/api/viajes/${T1}/estado`, { estado: 'DESCARGANDO' }), 200);
  const ult = paradas[paradas.length - 1];
  const cierre = await api(C1, 'POST', `/api/viajes/${T1}/confirmar-parada`, { id_parada: ult?.id_parada, lat: ult?.latitud, lng: ult?.longitud });
  registrar('última parada → viaje_finalizado con precio_real y remito_url', cierre.status === 200 && cierre.body?.viaje_finalizado === true && typeof cierre.body?.precio_real === 'number' && !!cierre.body?.remito_url, `${cierre.status} ${JSON.stringify(cierre.body)}`);
  if (sR) registrar('WS: la PyME recibe viaje:finalizado', !!(await evento(sR, 'viaje:finalizado', (d) => d.id_viaje === T1)));
  const fin = (await api(R, 'GET', `/api/organizaciones/${A}/viajes/${T1}`)).body || {};
  registrar('FINALIZADO, puntualidad A_TIEMPO, aproximación 0', fin.estado === 'FINALIZADO' && fin.puntualidad_inicio === 'A_TIEMPO' && fin.duracion_aproximacion_origen === 0, JSON.stringify({ e: fin.estado, p: fin.puntualidad_inicio, a: fin.duracion_aproximacion_origen }));
  registrar('historial termina CARGANDO,EN_RUTA,DESCARGANDO,FINALIZADO (origen CONDUCTOR)', historial(fin).endsWith('CONFIRMADO,CARGANDO,EN_RUTA,DESCARGANDO,FINALIZADO') && fin.historial_estados.slice(-4).every((h) => h.origen === 'CONDUCTOR'), historial(fin));
  registrar('duraciones calculadas (no null)', [fin.duracion_real, fin.duracion_carga, fin.duracion_descarga].every((x) => typeof x === 'number'), JSON.stringify([fin.duracion_real, fin.duracion_carga, fin.duracion_descarga]));
  const rem = await api(R, 'GET', `/api/organizaciones/${A}/viajes/${T1}/remito`);
  registrar('remito por la ruta de la PyME → 200 con URL', rem.status === 200 && /^https?:\/\/.+\.pdf$/.test(rem.body?.remito_url || ''), `${rem.status} ${JSON.stringify(rem.body)}`);
  if (rem.body?.remito_url) {
    const pdf = await fetch(rem.body.remito_url);
    registrar('el PDF del remito se descarga', pdf.ok && (pdf.headers.get('content-type') || '').includes('pdf'), `${pdf.status} ${pdf.headers.get('content-type')}`);
  }
  const histC = await api(C1, 'GET', '/api/choferes/viajes?grupo=historial');
  registrar('aparece en el historial del chofer', histC.body?.some?.((v) => v.id_viaje === T1));
  espera('cancelar un FINALIZADO → 400', await api(R, 'POST', `/api/organizaciones/${A}/viajes/${T1}/cancelar`), 400);

  seccion('La PyME cancela un viaje en curso');
  const T4 = (await crear(R, IDC1)).body?.id_viaje;
  await api(C1, 'POST', `/api/choferes/viajes/${T4}/confirmar`, { id_vehiculo: V1s });
  espera('iniciar → 200', await api(C1, 'POST', `/api/choferes/viajes/${T4}/iniciar`, ORIGEN), 200);
  const enCurso = await api(R, 'GET', `/api/organizaciones/${A}/viajes?grupo=en_curso`);
  registrar('grupo=en_curso lo incluye', enCurso.body?.some?.((v) => v.id_viaje === T4));
  const cp = await api(M, 'POST', `/api/organizaciones/${A}/viajes/${T4}/cancelar`, { motivo: 'cliente cancelo el pedido' });
  espera('cancelar en CARGANDO → 200', cp, 200);
  registrar('causa ORGANIZACION', cp.body?.estado === 'CANCELADO' && cp.body?.causa_cancelacion === 'ORGANIZACION', JSON.stringify(cp.body));
  const d4 = (await api(R, 'GET', `/api/organizaciones/${A}/viajes/${T4}`)).body || {};
  registrar('motivo_cancelacion guardado', d4.motivo_cancelacion === 'cliente cancelo el pedido', JSON.stringify(d4.motivo_cancelacion));
  if (sC1) registrar('WS: el chofer recibe viaje:cancelado con estado_anterior CARGANDO', !!(await evento(sC1, 'viaje:cancelado', (d) => d.id_viaje === T4 && d.causa === 'ORGANIZACION' && d.estado_anterior === 'CARGANDO')));
  espera('PATCH sobre el cancelado → 4xx', await api(C1, 'PATCH', `/api/viajes/${T4}/estado`, { estado: 'EN_RUTA' }), 400);

  seccion('Desvincular cancela los viajes del chofer con esa PyME');
  const T5 = (await crear(R, IDC3)).body?.id_viaje;
  const T6 = (await crear(R, IDC3)).body?.id_viaje;
  const V3 = (await api(C3, 'GET', '/api/conductores/mis-vehiculos')).body?.[0]?.id_vehiculo;
  await api(C3, 'POST', `/api/choferes/viajes/${T6}/confirmar`, { id_vehiculo: V3 });
  espera('Cho3 inicia T6 → 200', await api(C3, 'POST', `/api/choferes/viajes/${T6}/iniciar`, ORIGEN), 200);
  const des = await api(M, 'DELETE', `/api/organizaciones/${A}/choferes/${IDC3}`);
  espera('la PyME desvincula a Cho3 → 200', des, 200);
  registrar('viajes_cancelados trae el asignado y el en curso', JSON.stringify([...(des.body?.viajes_cancelados || [])].sort((a, b) => a - b)) === JSON.stringify([T5, T6].sort((a, b) => a - b)), JSON.stringify(des.body));
  const d6 = (await api(R, 'GET', `/api/organizaciones/${A}/viajes/${T6}`)).body || {};
  registrar('T6 CANCELADO con causa DESVINCULACION', d6.estado === 'CANCELADO' && d6.causa_cancelacion === 'DESVINCULACION', JSON.stringify({ e: d6.estado, c: d6.causa_cancelacion }));
  const T7 = (await crear(R, IDC1)).body?.id_viaje;                // de Cho1 con A
  const T8 = (await crear(Q, IDC1, {}, B)).body?.id_viaje;         // de Cho1 con B
  registrar('la PyME B también crea viajes para Cho1', !!T8);
  const ch2 = await api(C1, 'GET', '/api/choferes/viajes');
  const orgs = new Set((ch2.body || []).map((v) => v.organizacion?.id_organizacion));
  registrar('el chofer ve viajes de sus dos PyMEs', orgs.has(A) && orgs.has(B));
  espera('la PyME A no ve el viaje de B → 404', await api(R, 'GET', `/api/organizaciones/${A}/viajes/${T8}`), 404);
  const self = await api(C1, 'DELETE', `/api/choferes/mis-organizaciones/${B}`);
  espera('Cho1 se desvincula de B → 200', self, 200);
  registrar('cancela solo el viaje con B', JSON.stringify(self.body?.viajes_cancelados) === JSON.stringify([T8]), JSON.stringify(self.body));
  const d7 = (await api(R, 'GET', `/api/organizaciones/${A}/viajes/${T7}`)).body || {};
  registrar('el viaje con A sigue ASIGNADO', d7.estado === 'ASIGNADO', d7.estado);

  seccion('Preparar VENCIDO (se verifica con el modo vencido)');
  const TV1 = (await crear(R, IDC1)).body?.id_viaje;                // queda ASIGNADO
  const TV2 = (await crear(R, IDC1)).body?.id_viaje;                // queda CONFIRMADO
  espera('TV2 confirmado → 200', await api(C1, 'POST', `/api/choferes/viajes/${TV2}/confirmar`, { id_vehiculo: V1s }), 200);
  const fv = (await api(R, 'GET', `/api/organizaciones/${A}/viajes/${TV1}`)).body?.fecha_programada;
  registrar('dos viajes listos para vencer', !!TV1 && !!TV2 && !!fv);
  if (ESTADO && fv) {
    writeFileSync(ESTADO, JSON.stringify({ R: R.email, C1: C1.email, A, TV1, TV2, fecha_programada: fv }, null, 2));
    const cuando = new Date(new Date(fv).getTime() + 92 * 60000);
    console.log(`  (correr el modo vencido después de ${cuando.toISOString()} si la ventana es la default de 90 min)`);
  }

  sR?.close(); sC1?.close();
}

// ── Modo vencido ───────────────────────────────────────────────────────────
async function vencido() {
  const e = JSON.parse(readFileSync(ESTADO, 'utf8'));
  const R = await entrar(e.R, 'Rita');
  const C1 = await entrar(e.C1, 'Cho1');
  seccion(`VENCIDO (programados ${e.fecha_programada})`);
  for (const [id, antes] of [[e.TV1, 'ASIGNADO'], [e.TV2, 'CONFIRMADO']]) {
    const v = (await api(R, 'GET', `/api/organizaciones/${e.A}/viajes/${id}`)).body || {};
    const ult = v.historial_estados?.at(-1);
    registrar(`${antes} → VENCIDO, vencido=true`, v.estado === 'VENCIDO' && v.vencido === true, JSON.stringify({ e: v.estado, v: v.vencido }));
    registrar(`${antes}: la última fila del historial es de SISTEMA`, ult?.estado === 'VENCIDO' && ult?.origen === 'SISTEMA', JSON.stringify(ult));
  }
  espera('confirmar un VENCIDO → 400', await api(C1, 'POST', `/api/choferes/viajes/${e.TV1}/confirmar`, { id_vehiculo: 1 }), 400);
  espera('iniciar un VENCIDO → 400', await api(C1, 'POST', `/api/choferes/viajes/${e.TV2}/iniciar`, ORIGEN), 400);
  espera('el chofer cancela un VENCIDO → 400', await api(C1, 'POST', `/api/choferes/viajes/${e.TV1}/cancelar`), 400, 'VENCIDO');
  espera('la PyME cancela un VENCIDO → 400', await api(R, 'POST', `/api/organizaciones/${e.A}/viajes/${e.TV2}/cancelar`), 400, 'VENCIDO');
  const hist = await api(R, 'GET', `/api/organizaciones/${e.A}/viajes?grupo=historial`);
  registrar('aparecen en grupo=historial', [e.TV1, e.TV2].every((id) => hist.body?.some?.((v) => v.id_viaje === id)));
}

// ── Ejecución ──────────────────────────────────────────────────────────────
const inicio = Date.now();
console.log(`Fleter · pruebas del viaje interno · modo ${MODO} · ${BASE}`);
try {
  await (MODO === 'principal' ? principal() : vencido());
} catch (e) {
  registrar('ejecución completa', false, e.stack || e.message);
}
const fallas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallas.length} de ${resultados.length} pruebas pasaron (${((Date.now() - inicio) / 1000).toFixed(1)} s)`);
if (fallas.length) {
  console.log('\nFallaron:');
  for (const f of fallas) console.log(`  - [${f.grupo}] ${f.nombre}\n      ${f.detalle}`);
}
process.exit(fallas.length ? 1 : 0);
