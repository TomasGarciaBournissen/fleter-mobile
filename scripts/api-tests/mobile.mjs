#!/usr/bin/env node
// Prueba de punta a punta de lo que hace la app mobile contra el backend (API.md de develop):
// los mismos pedidos, con los mismos bodies, que mandan `src/services/*` y las pantallas.
// Cubre el pedido del front del 20-10-2026 (motivo y descripción obligatorios, sin condiciones),
// la Tarea 5 (bloque `cierre`, cerrado_por) y la Tarea 6 (errores en JSON, handshake del socket).
//
// Uso:
//   BASE_URL=https://nombre-proyecto-back-staging.up.railway.app FIREBASE_API_KEY=AIza... \
//   NODE_USE_ENV_PROXY=1 node scripts/api-tests/mobile.mjs
//
// Recorre un viaje entero (iniciar → salir → llegar → salir): espera ~2 minutos a que abra la
// ventana de inicio. Crea cuentas y una empresa que no se borran: solo staging o local, nunca
// producción. Usa 1 canje de invitación.

import { createRequire } from 'node:module';

const BASE = (process.env.BASE_URL || '').replace(/\/$/, '');
const KEY = process.env.FIREBASE_API_KEY || '';
if (!BASE) { console.error('Falta BASE_URL'); process.exit(2); }
if (!KEY) { console.error('Falta FIREBASE_API_KEY'); process.exit(2); }
if (/production|prod\./i.test(BASE) && !/staging/i.test(BASE)) { console.error('Esto no se corre contra producción'); process.exit(2); }

// ── Helpers (los mismos que viajes.mjs) ───────────────────────────────────
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
    console.log(`  (error de red en ${method} ${ruta}: ${e.cause?.code || e.message}; reintento)`);
    await dormir(3000);
    res = await pedir();
  }
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
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
  // Mismos campos que RegistroEmpresaScreen / RegistroConductor → Licencia (services/auth.js)
  const base = { nombre: etiqueta, apellido: 'Prueba', dni, email, contrasena: PASS, telefono: '+5491100000000' };
  const alta = () => tipo === 'CLIENTE'
    ? api(null, 'POST', '/api/auth/registro-cliente', base)
    : api(null, 'POST', '/api/auth/registro-conductor', { ...base, nro_licencia: `LIC${dni}`, licencia_vencimiento: '2028-12-31T00:00:00.000Z' });
  let r = await alta();
  if (r.status >= 500) { await dormir(5000); r = await alta(); } // Neon despertando
  if (r.status !== 201) throw new Error(`No se pudo registrar ${etiqueta}: ${r.status} ${JSON.stringify(r.body)}`);
  const u = { etiqueta, email, token: await login(email) };
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
const enMin = (min) => new Date(Date.now() + min * 60000).toISOString();
const sinCondiciones = (v) => v && !('condiciones_requeridas' in v);

// ── Socket (handshake con el token, como services/socket.js) ───────────────
let io = null; let agente;
try {
  const req = createRequire(new URL('../../package.json', import.meta.url));
  io = req('socket.io-client').io;
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxy) { const { HttpsProxyAgent } = req('https-proxy-agent'); agente = new HttpsProxyAgent(proxy); }
} catch (e) { console.log(`(sin prueba de socket: ${e.message})`); }

function conectar(usuario, token = `Bearer ${usuario.token}`) {
  return new Promise((ok) => {
    const s = io(BASE, { auth: { token }, transports: ['websocket'], reconnection: false, agent: agente, timeout: 15000 });
    const eventos = [];
    s.onAny((nombre, data) => eventos.push({ nombre, data }));
    s.on('connect', () => ok({ s, eventos, error: null }));
    s.on('connect_error', (err) => { ok({ s, eventos, error: err }); s.close(); });
  });
}

// ── Pruebas ────────────────────────────────────────────────────────────────
async function main() {
  seccion('Backend');
  const h = await api(null, 'GET', '/health');
  registrar(`/health ok (versión ${h.body?.version ?? '—'})`, h.status === 200 && h.body?.capacidades?.includes('viaje-interno'), JSON.stringify(h.body));
  espera('ruta inexistente → 404 en JSON', await api(null, 'GET', '/api/no-existe'), 404, 'No encontrado');

  seccion('Alta (fase 1)');
  const E = await crearUsuario('CLIENTE', 'Empresa');
  registrar('cuenta de empresa sin organización', E.me.rol === 'CLIENTE' && !E.me.organizacion, JSON.stringify(E.me).slice(0, 200));
  const org = await api(E, 'POST', '/api/organizaciones', { nombre: `Fleter Mobile ${seg()}`, cuit: cuitValido() });
  espera('crear la empresa', org, 201);
  const A = org.body.id_organizacion;
  const me2 = await api(E, 'GET', '/api/auth/me');
  registrar('/me trae la organización con rol RESPONSABLE', me2.body?.organizacion?.id_organizacion === A && me2.body.organizacion.rol === 'RESPONSABLE', JSON.stringify(me2.body?.organizacion));

  const C = await crearUsuario('CONDUCTOR', 'Conductor');
  registrar('cuenta de conductor', C.me.rol === 'CONDUCTOR', C.me.rol);
  // Vehículo sin condiciones (son opcionales y del marketplace)
  const veh = await api(C, 'POST', '/api/conductores/mis-vehiculos', { patente: patente(), marca: 'Ford', modelo: 'Transit', anio: 2022, color: 'Blanco', tipo_vehiculo: 'utilitario' });
  espera('vehículo sin condiciones', veh, 201);
  const VEH = veh.body?.id_vehiculo;
  const inv = await api(E, 'POST', `/api/organizaciones/${A}/invitaciones`, { tipo: 'CHOFER' });
  espera('código para un conductor', inv, 201);
  espera('el conductor canjea el código', await api(C, 'POST', '/api/invitaciones/canjear', { codigo: inv.body?.codigo }), 200);
  const ch = await api(E, 'GET', `/api/organizaciones/${A}/choferes`);
  const IDC = ch.body?.find?.((c) => c.id_usuario === C.me.id_usuario)?.id_conductor ?? ch.body?.[0]?.id_conductor;
  registrar('la empresa ve al conductor con su vehículo', !!IDC && (ch.body?.[0]?.vehiculos?.length ?? 0) > 0, JSON.stringify(ch.body).slice(0, 300));

  seccion('Nuevo viaje (fase 3)');
  const est = await api(E, 'POST', '/api/viajes/estimar-costo', { paradas: [ORIGEN, DESTINO], fecha_programada: enMin(120) });
  registrar('estimar-costo devuelve precio, estimado y tramos', est.status === 200 && typeof est.body?.precio_estimado === 'number' && !!est.body?.estimado && Array.isArray(est.body?.tramos), `${est.status} ${JSON.stringify(est.body).slice(0, 200)}`);
  const cuerpo = { id_conductor: IDC, fecha_programada: enMin(120), paradas: [ORIGEN, DESTINO] };
  espera('sin motivo → 400', await api(E, 'POST', `/api/organizaciones/${A}/viajes`, { ...cuerpo, descripcion: 'x' }), 400, 'motivo es requerido');
  espera('sin indicaciones → 400', await api(E, 'POST', `/api/organizaciones/${A}/viajes`, { ...cuerpo, motivo: 'x' }), 400, 'descripcion es requerida');
  espera('motivo de 121 caracteres → 400', await api(E, 'POST', `/api/organizaciones/${A}/viajes`, { ...cuerpo, motivo: 'm'.repeat(121), descripcion: 'x' }), 400, '120');
  const v1 = await api(E, 'POST', `/api/organizaciones/${A}/viajes`, { ...cuerpo, motivo: 'Reposición sucursal', descripcion: 'Portón azul, tocar timbre' });
  espera('crear el viaje como la app', v1, 201);
  const T1 = v1.body?.id_viaje;
  registrar('trae motivo y descripcion', v1.body?.motivo === 'Reposición sucursal' && v1.body?.descripcion === 'Portón azul, tocar timbre', JSON.stringify({ m: v1.body?.motivo, d: v1.body?.descripcion }));
  registrar('no trae condiciones_requeridas', sinCondiciones(v1.body), JSON.stringify(v1.body?.condiciones_requeridas));
  const lista = await api(E, 'GET', `/api/organizaciones/${A}/viajes`, undefined);
  const enLista = (lista.body ?? []).find?.((v) => v.id_viaje === T1);
  registrar('aparece en la lista con motivo', enLista?.motivo === 'Reposición sucursal', JSON.stringify(enLista).slice(0, 200));
  const ed = await api(E, 'PUT', `/api/organizaciones/${A}/viajes/${T1}`, { motivo: 'Reposición sucursal Pilar' });
  registrar('editar solo el motivo', ed.status === 200 && ed.body?.motivo === 'Reposición sucursal Pilar', `${ed.status} ${JSON.stringify(ed.body).slice(0, 200)}`);
  espera('editar con motivo vacío → 400', await api(E, 'PUT', `/api/organizaciones/${A}/viajes/${T1}`, { motivo: '  ' }), 400, 'motivo');
  espera('id de viaje no numérico → 400', await api(E, 'GET', `/api/organizaciones/${A}/viajes/abc`), 400, 'invalido');

  seccion('Lugar guardado y viaje repetido');
  const lug = await api(E, 'POST', `/api/organizaciones/${A}/lugares`, { nombre: 'Depósito', ...ORIGEN });
  espera('crear un lugar', lug, 201);
  const manana = new Date(Date.now() + 86400000 + 3 * 3600000).toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });
  const sr = await api(E, 'POST', `/api/organizaciones/${A}/series`, {
    id_conductor: IDC, frecuencia: 'DIARIA', hora: '09:00', fecha_desde: manana, fecha_hasta: manana,
    paradas: [{ id_lugar: lug.body?.id_lugar }, DESTINO], motivo: 'Reparto diario', descripcion: 'Entrar por el portón de atrás',
  });
  registrar('crear la serie con motivo', sr.status === 201 && sr.body?.serie?.motivo === 'Reparto diario' && sr.body?.viajes?.[0]?.motivo === 'Reparto diario', `${sr.status} ${JSON.stringify(sr.body).slice(0, 300)}`);
  espera('serie sin motivo → 400', await api(E, 'POST', `/api/organizaciones/${A}/series`, { id_conductor: IDC, frecuencia: 'DIARIA', hora: '10:00', fecha_desde: manana, fecha_hasta: manana, paradas: [ORIGEN, DESTINO], descripcion: 'x' }), 400, 'motivo');

  seccion('El conductor (fase 2)');
  let sock = null;
  if (io) {
    const malo = await conectar(C, 'Bearer token-roto');
    registrar('socket con token inválido → connect_error', !!malo.error, malo.error?.message ?? 'conectó');
    sock = await conectar(C);
    registrar('socket con el token de Firebase conecta', !sock.error, sock.error?.message ?? '');
  }
  const mis = await api(C, 'GET', '/api/choferes/viajes');
  const visto = (mis.body ?? []).find?.((v) => v.id_viaje === T1);
  registrar('ve el viaje con motivo e indicaciones', visto?.motivo === 'Reposición sucursal Pilar' && !!visto?.descripcion && sinCondiciones(visto), JSON.stringify(visto).slice(0, 200));
  // El conductor nunca ve el precio: hoy el backend lo manda igual y la app no lo muestra
  if (visto?.precio_estimado !== undefined) console.log(`  (nota: /api/choferes/viajes trae precio_estimado=${visto.precio_estimado}; la app no lo muestra)`);
  espera('confirmar con un vehículo sin condiciones', await api(C, 'POST', `/api/choferes/viajes/${T1}/confirmar`, { id_vehiculo: VEH }), 200);

  // Un viaje que se pueda iniciar ya: la ventana abre 60 min antes de la hora programada
  const v2 = await api(E, 'POST', `/api/organizaciones/${A}/viajes`, { ...cuerpo, fecha_programada: enMin(62), motivo: 'Viaje de punta a punta', descripcion: 'Prueba del mobile' });
  espera('crear un viaje para recorrer', v2, 201);
  const T2 = v2.body?.id_viaje;
  const ps = v2.body?.paradas ?? [];
  espera('confirmarlo', await api(C, 'POST', `/api/choferes/viajes/${T2}/confirmar`, { id_vehiculo: VEH }), 200);
  console.log('  (esperando a que abra la ventana de inicio…)');
  let ini;
  for (let i = 0; i < 12; i++) {
    await dormir(20000);
    ini = await api(C, 'POST', `/api/choferes/viajes/${T2}/iniciar`, { lat: ORIGEN.lat, lng: ORIGEN.lng });
    if (ini.status === 200 || !/ventana|todavia|a partir de/i.test(ini.body?.error ?? '')) break;
  }
  espera('iniciar en el origen → CARGANDO', ini, 200);
  espera('iniciar otro viaje con uno en curso → 409', await api(C, 'POST', `/api/choferes/viajes/${T1}/iniciar`, { lat: ORIGEN.lat, lng: ORIGEN.lng }), 409, 'viaje en curso');
  const s1 = await api(C, 'POST', `/api/choferes/viajes/${T2}/salir`);
  registrar('salir del origen → EN_RUTA (con origen_salida)', s1.status === 200 && s1.body?.estado === 'EN_RUTA' && s1.body?.origen_salida === 'CHOFER', `${s1.status} ${JSON.stringify(s1.body)}`);
  const lleg = await api(C, 'POST', `/api/viajes/${T2}/confirmar-parada`, { id_parada: ps[1]?.id_parada, lat: DESTINO.lat, lng: DESTINO.lng });
  registrar('llegar a la última → DESCARGANDO', lleg.status === 200 && lleg.body?.estado === 'DESCARGANDO', `${lleg.status} ${JSON.stringify(lleg.body)}`);
  const det = await api(C, 'GET', `/api/choferes/viajes/${T2}`);
  const c = det.body?.cierre;
  registrar('el detalle trae el bloque cierre (hora prevista y cierre automático)', !!c && !!c.hora_prevista_fin && !!c.cierre_automatico_en && c.cierre_manual_habilitado === false, JSON.stringify(c));
  const dE = await api(E, 'GET', `/api/organizaciones/${A}/viajes/${T2}`);
  registrar('la empresa ve el mismo cierre', dE.body?.cierre?.hora_prevista_fin === c?.hora_prevista_fin, JSON.stringify(dE.body?.cierre));
  espera('la empresa no puede finalizar antes de tiempo → 409', await api(E, 'POST', `/api/organizaciones/${A}/viajes/${T2}/finalizar`), 409, 'todavia no se puede finalizar');
  const fin = await api(C, 'POST', `/api/choferes/viajes/${T2}/salir`);
  registrar('salir de la última → FINALIZADO con remito', fin.status === 200 && fin.body?.viaje_finalizado === true && !!fin.body?.remito_url, `${fin.status} ${JSON.stringify(fin.body).slice(0, 300)}`);
  const det2 = await api(C, 'GET', `/api/choferes/viajes/${T2}`);
  registrar('queda cerrado_por CHOFER', (det2.body?.cierre?.cerrado_por ?? det2.body?.cerrado_por) === 'CHOFER', JSON.stringify(det2.body?.cierre));
  if (sock && !sock.error) {
    await dormir(2000);
    const fins = sock.eventos.filter((e) => e.nombre === 'viaje:finalizado' && Number(e.data?.id_viaje) === T2);
    registrar('el conductor recibe viaje:finalizado por socket', fins.length === 1, sock.eventos.map((e) => e.nombre).join(', '));
    sock.s.close();
  }

  seccion('Cancelar');
  const cc = await api(E, 'POST', `/api/organizaciones/${A}/viajes/${T1}/cancelar`, { motivo: 'Prueba del mobile' });
  registrar('cancelar con motivo', cc.status === 200, `${cc.status} ${JSON.stringify(cc.body).slice(0, 200)}`);
}

main()
  .catch((e) => registrar('la prueba no pudo seguir', false, e.message))
  .finally(() => {
    const fallas = resultados.filter((r) => !r.ok);
    console.log(`\n${resultados.length - fallas.length}/${resultados.length} pruebas bien.`);
    fallas.forEach((f) => console.log(`  ✘ [${f.grupo}] ${f.nombre}\n      ${f.detalle}`));
    process.exit(fallas.length ? 1 : 0);
  });
