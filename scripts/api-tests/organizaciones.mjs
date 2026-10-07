#!/usr/bin/env node
// Pruebas de contrato de la capa de identidad (api.md, sección "Identidad — PyMEs,
// miembros, invitaciones y choferes"): organizaciones, miembros, invitaciones,
// canje, choferes y los campos nuevos de GET /api/auth/me.
//
// Uso:
//   BASE_URL=http://localhost:3000 FIREBASE_API_KEY=xxx node scripts/api-tests/organizaciones.mjs principal
//   (esperar 15 minutos: el canje tiene límite de 5 intentos por IP)
//   BASE_URL=http://localhost:3000 FIREBASE_API_KEY=xxx node scripts/api-tests/organizaciones.mjs extra
//
// Crea usuarios y PyMEs de prueba que no se borran: correr contra local o staging,
// nunca contra la base de producción.

const BASE = (process.env.BASE_URL || '').replace(/\/$/, '');
const KEY = process.env.FIREBASE_API_KEY || '';
const MOCK = process.env.MOCK_AUTH === '1';
const MODO = process.argv[2] || 'principal';

if (!BASE) { console.error('Falta BASE_URL'); process.exit(2); }
if (!MOCK && !KEY) { console.error('Falta FIREBASE_API_KEY'); process.exit(2); }
if (!['principal', 'extra'].includes(MODO)) { console.error('Modo: principal | extra'); process.exit(2); }

// ── Helpers ────────────────────────────────────────────────────────────────
const resultados = [];
let grupo = '';
const seccion = (nombre) => { grupo = nombre; console.log(`\n▸ ${nombre}`); };

function registrar(nombre, ok, detalle = '') {
  resultados.push({ grupo, nombre, ok, detalle });
  console.log(`  ${ok ? '✔' : '✘'} ${nombre}${ok || !detalle ? '' : `\n      ${detalle}`}`);
  return ok;
}

async function api(usuario, method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (usuario) headers.Authorization = `Bearer ${usuario.token}`;
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

// Compara status y, si se pasa, que el mensaje de error contenga el texto.
function espera(nombre, r, status, textoError) {
  let ok = r.status === status;
  if (ok && textoError) ok = typeof r.body?.error === 'string' && r.body.error.toLowerCase().includes(textoError.toLowerCase());
  return registrar(nombre, ok, `esperaba ${status}${textoError ? ` "${textoError}"` : ''}, llegó ${r.status} ${JSON.stringify(r.body)}`);
}

const seg = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

async function login(email, pass) {
  if (MOCK) return `mock:${email}`;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error(`Login Firebase falló para ${email}: ${JSON.stringify(j)}`);
  return j.idToken;
}

async function crearUsuario(tipo, etiqueta) {
  const email = `fleter-test-${etiqueta.toLowerCase()}-${seg()}@example.com`;
  const pass = 'Prueba1234';
  const dni = String(10000000 + Math.floor(Math.random() * 89999999));
  const base = { nombre: etiqueta, apellido: 'Prueba', dni, email, contrasena: pass, telefono: '+5491100000000' };
  const registrar = () => tipo === 'CLIENTE'
    ? api(null, 'POST', '/api/auth/registro-cliente', base)
    : api(null, 'POST', '/api/auth/registro-conductor', { ...base, nro_licencia: `LIC${dni}`, licencia_vencimiento: '2028-12-31T00:00:00.000Z' });
  let r = await registrar();
  // Neon suspende la base sin uso: el primer request puede dar 500 mientras despierta.
  if (r.status >= 500) { await new Promise((ok) => setTimeout(ok, 5000)); r = await registrar(); }
  if (r.status !== 201) throw new Error(`No se pudo registrar ${etiqueta} (${tipo}): ${r.status} ${JSON.stringify(r.body)}`);
  const u = { etiqueta, tipo, email };
  u.token = await login(email, pass);
  const me = await api(u, 'GET', '/api/auth/me');
  if (me.status !== 200) throw new Error(`GET /api/auth/me falló para ${etiqueta}: ${me.status} ${JSON.stringify(me.body)}`);
  u.id_usuario = me.body.id_usuario;
  u.me = me.body;
  return u;
}

// CUIT con dígito verificador válido (prefijo 30: persona jurídica).
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
const conGuiones = (c) => `${c.slice(0, 2)}-${c.slice(2, 10)}-${c[10]}`;
const dvMalo = (c) => c.slice(0, 10) + String((Number(c[10]) + 1) % 10);
// Alfabeto sin ambiguos: sin 0/O ni 1/I/L.
const FORMATO_CODIGO = /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{5}-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{5}$/;
const sorted = (a) => [...a].sort((x, y) => x - y);

// ── Modo principal ─────────────────────────────────────────────────────────
// Usa exactamente 5 canjes (el límite por IP es 5 cada 15 minutos).
async function principal() {
  seccion('Preparación: usuarios de prueba');
  const A = await crearUsuario('CLIENTE', 'Ana');      // responsable
  const B = await crearUsuario('CLIENTE', 'Beto');     // miembro
  const C = await crearUsuario('CLIENTE', 'Carla');    // ajena, queda huérfana
  const F = await crearUsuario('CLIENTE', 'Fede');     // creación concurrente
  const D = await crearUsuario('CONDUCTOR', 'Diego');  // chofer
  registrar('5 cuentas registradas y logueadas', true);

  seccion('GET /api/auth/me — campos nuevos');
  registrar('CLIENTE sin PyME: organizacion es null', A.me.organizacion === null, JSON.stringify(A.me));
  registrar('CONDUCTOR sin vínculos: organizaciones es []', Array.isArray(D.me.organizaciones) && D.me.organizaciones.length === 0, JSON.stringify(D.me));

  seccion('POST /api/organizaciones — crear PyME');
  const cuitA = cuitValido();
  espera('sin nombre → 400', await api(A, 'POST', '/api/organizaciones', { cuit: cuitA }), 400, 'nombre es requerido');
  espera('sin cuit → 400', await api(A, 'POST', '/api/organizaciones', { nombre: 'X' }), 400, 'cuit es requerido');
  espera('CUIT con formato inválido → 400', await api(A, 'POST', '/api/organizaciones', { nombre: 'X', cuit: '123' }), 400, 'formato invalido');
  espera('CUIT con dígito verificador inválido → 400', await api(A, 'POST', '/api/organizaciones', { nombre: 'X', cuit: dvMalo(cuitA) }), 400, 'digito verificador');
  espera('un CONDUCTOR no puede crear PyME → 403', await api(D, 'POST', '/api/organizaciones', { nombre: 'X', cuit: cuitValido() }), 403, 'Acceso denegado');
  const nombreOrg = `Distribuidora Test ${seg()}`;
  const crear = await api(A, 'POST', '/api/organizaciones', { nombre: nombreOrg, cuit: conGuiones(cuitA), razon_social: 'Distribuidora Test SRL', direccion: 'Av. Siempreviva 742' });
  if (!espera('datos válidos (CUIT con guiones) → 201', crear, 201)) throw new Error('Sin PyME no se puede seguir');
  const org = crear.body;
  const id = org.id_organizacion;
  registrar('mi_rol es RESPONSABLE', org.mi_rol === 'RESPONSABLE', JSON.stringify(org));
  registrar('estado inicial es TRIAL', org.estado === 'TRIAL', JSON.stringify(org));
  registrar('CUIT vuelve normalizado sin guiones', org.cuit === cuitA, `esperaba ${cuitA}, llegó ${org.cuit}`);
  espera('crear una segunda PyME → 409', await api(A, 'POST', '/api/organizaciones', { nombre: 'Otra', cuit: cuitValido() }), 409, 'Ya perteneces a una PyME');
  espera('CUIT repetido (sin guiones) por otra cuenta → 409', await api(C, 'POST', '/api/organizaciones', { nombre: 'Copia', cuit: cuitA }), 409, 'Ya existe una PyME con ese CUIT');

  seccion('Concurrencia: dos altas simultáneas de la misma cuenta');
  const [r1, r2] = await Promise.all([
    api(F, 'POST', '/api/organizaciones', { nombre: `Concurrente 1 ${seg()}`, cuit: cuitValido() }),
    api(F, 'POST', '/api/organizaciones', { nombre: `Concurrente 2 ${seg()}`, cuit: cuitValido() }),
  ]);
  registrar('una 201 y una 409 (nunca dos PyMEs)', JSON.stringify(sorted([r1.status, r2.status])) === '[201,409]', `llegaron ${r1.status} y ${r2.status}`);
  const cuitF = (r1.status === 201 ? r1 : r2).body?.cuit;

  seccion('GET /api/organizaciones/:id');
  const ver = await api(A, 'GET', `/api/organizaciones/${id}`);
  espera('responsable la ve → 200', ver, 200);
  registrar('trae mi_rol RESPONSABLE', ver.body?.mi_rol === 'RESPONSABLE', JSON.stringify(ver.body));
  espera('cuenta ajena → 403', await api(C, 'GET', `/api/organizaciones/${id}`), 403, 'No perteneces a esta PyME');
  espera('PyME inexistente → 403 (mismo error)', await api(C, 'GET', '/api/organizaciones/999999999'), 403, 'No perteneces a esta PyME');
  espera('id no numérico → 400', await api(A, 'GET', '/api/organizaciones/abc'), 400, 'id de PyME invalido');
  espera('CONDUCTOR → 403', await api(D, 'GET', `/api/organizaciones/${id}`), 403, 'Acceso denegado');

  seccion('PUT /api/organizaciones/:id');
  espera('body vacío → 400', await api(A, 'PUT', `/api/organizaciones/${id}`, {}), 400, 'al menos un campo');
  const put1 = await api(A, 'PUT', `/api/organizaciones/${id}`, { razon_social: 'Distribuidora Test SA' });
  espera('cambiar razón social → 200', put1, 200);
  registrar('razón social actualizada', put1.body?.razon_social === 'Distribuidora Test SA', JSON.stringify(put1.body));
  const put2 = await api(A, 'PUT', `/api/organizaciones/${id}`, { direccion: null });
  espera('borrar dirección con null → 200', put2, 200);
  registrar('dirección queda null', put2.body?.direccion === null, JSON.stringify(put2.body));
  espera('CUIT inválido → 400', await api(A, 'PUT', `/api/organizaciones/${id}`, { cuit: dvMalo(cuitA) }), 400, 'digito verificador');
  if (cuitF) espera('CUIT de otra PyME → 409', await api(A, 'PUT', `/api/organizaciones/${id}`, { cuit: cuitF }), 409, 'Ya existe una PyME con ese CUIT');
  espera('re-guardar el CUIT propio con guiones → 200', await api(A, 'PUT', `/api/organizaciones/${id}`, { cuit: conGuiones(cuitA) }), 200);

  seccion('GET /api/auth/me — responsable');
  const meA = await api(A, 'GET', '/api/auth/me');
  const o = meA.body?.organizacion;
  registrar('organizacion = { id, nombre, estado TRIAL, rol RESPONSABLE }', o && o.id_organizacion === id && o.nombre === nombreOrg && o.estado === 'TRIAL' && o.rol === 'RESPONSABLE', JSON.stringify(o));

  seccion('POST/GET /api/organizaciones/:id/invitaciones');
  espera('tipo inválido → 400', await api(A, 'POST', `/api/organizaciones/${id}/invitaciones`, { tipo: 'JEFE' }), 400, 'tipo debe ser');
  const invM = await api(A, 'POST', `/api/organizaciones/${id}/invitaciones`, { tipo: 'MIEMBRO' });
  if (!espera('responsable genera código de MIEMBRO → 201', invM, 201)) throw new Error('Sin invitación no se puede seguir');
  const codigoM = invM.body.codigo;
  registrar('formato XXXXX-XXXXX sin caracteres ambiguos', FORMATO_CODIGO.test(codigoM || ''), `llegó "${codigoM}"`);
  const horas = (Date.parse(invM.body.fecha_vencimiento) - Date.parse(invM.body.fecha_creacion)) / 3600000;
  registrar('vence a las 72 h', Math.abs(horas - 72) < 0.1, `diferencia de ${horas.toFixed(2)} h`);
  const lista1 = await api(A, 'GET', `/api/organizaciones/${id}/invitaciones`);
  espera('listar pendientes → 200', lista1, 200);
  const items1 = Array.isArray(lista1.body) ? lista1.body : [];
  registrar('la invitación nueva aparece', items1.some((i) => i.id_invitacion === invM.body.id_invitacion), JSON.stringify(items1));
  registrar('el listado nunca incluye el código', items1.every((i) => !('codigo' in i)), JSON.stringify(items1));
  registrar('trae creada_por con el id de quien la generó', items1.find((i) => i.id_invitacion === invM.body.id_invitacion)?.creada_por?.id_usuario === A.id_usuario, JSON.stringify(items1));

  seccion('POST /api/invitaciones/canjear — miembro (canjes 1 y 2 de 5)');
  const canje1 = await api(B, 'POST', '/api/invitaciones/canjear', { codigo: `  ${codigoM.toLowerCase().replace('-', ' - ')} ` });
  espera('[canje 1] código con minúsculas, espacios y guion → 200', canje1, 200);
  registrar('devuelve tipo MIEMBRO y rol MIEMBRO', canje1.body?.tipo === 'MIEMBRO' && canje1.body?.organizacion?.rol === 'MIEMBRO' && canje1.body?.organizacion?.id_organizacion === id, JSON.stringify(canje1.body));
  const meB = await api(B, 'GET', '/api/auth/me');
  registrar('GET /me del nuevo miembro: rol MIEMBRO', meB.body?.organizacion?.rol === 'MIEMBRO', JSON.stringify(meB.body?.organizacion));
  const lista2 = await api(A, 'GET', `/api/organizaciones/${id}/invitaciones`);
  registrar('la invitación usada deja de estar pendiente', Array.isArray(lista2.body) && !lista2.body.some((i) => i.id_invitacion === invM.body.id_invitacion), JSON.stringify(lista2.body));
  espera('[canje 2] mismo código otra vez (un solo uso) → 400', await api(C, 'POST', '/api/invitaciones/canjear', { codigo: codigoM }), 400, 'Codigo invalido');

  seccion('Permisos de un MIEMBRO');
  espera('generar código de MIEMBRO → 403', await api(B, 'POST', `/api/organizaciones/${id}/invitaciones`, { tipo: 'MIEMBRO' }), 403, 'Solo un responsable puede invitar miembros');
  espera('editar la PyME → 403', await api(B, 'PUT', `/api/organizaciones/${id}`, { nombre: 'Hackeada' }), 403, 'Solo un responsable puede hacer esto');
  const invC1 = await api(B, 'POST', `/api/organizaciones/${id}/invitaciones`, { tipo: 'CHOFER' });
  espera('generar código de CHOFER → 201', invC1, 201);
  const verB = await api(B, 'GET', `/api/organizaciones/${id}`);
  registrar('ve la PyME con mi_rol MIEMBRO', verB.status === 200 && verB.body?.mi_rol === 'MIEMBRO', JSON.stringify(verB.body));
  const miembros = await api(B, 'GET', `/api/organizaciones/${id}/miembros`);
  espera('lista miembros → 200', miembros, 200);
  registrar('2 miembros, el más antiguo (responsable) primero', Array.isArray(miembros.body) && miembros.body.length === 2 && miembros.body[0].id_usuario === A.id_usuario && miembros.body[0].rol === 'RESPONSABLE' && miembros.body[1].rol === 'MIEMBRO', JSON.stringify(miembros.body));

  seccion('Canje de chofer (canjes 3, 4 y 5 de 5)');
  espera('[canje 3] CLIENTE con código de CHOFER → 400', await api(C, 'POST', '/api/invitaciones/canjear', { codigo: invC1.body?.codigo }), 400, 'Codigo invalido');
  const canje4 = await api(D, 'POST', '/api/invitaciones/canjear', { codigo: invC1.body?.codigo });
  espera('[canje 4] CONDUCTOR con ese mismo código → 200 (el intento cruzado no lo consumió)', canje4, 200);
  registrar('devuelve tipo CHOFER y la PyME', canje4.body?.tipo === 'CHOFER' && canje4.body?.organizacion?.id_organizacion === id, JSON.stringify(canje4.body));
  const invC2 = await api(A, 'POST', `/api/organizaciones/${id}/invitaciones`, { tipo: 'CHOFER' });
  espera('[canje 5] chofer ya vinculado → 409', await api(D, 'POST', '/api/invitaciones/canjear', { codigo: invC2.body?.codigo }), 409, 'Ya estas vinculado a esta PyME');
  const lista3 = await api(A, 'GET', `/api/organizaciones/${id}/invitaciones`);
  registrar('ese código no se consumió (sigue pendiente)', Array.isArray(lista3.body) && lista3.body.some((i) => i.id_invitacion === invC2.body?.id_invitacion), JSON.stringify(lista3.body));

  seccion('Choferes');
  const misOrgs = await api(D, 'GET', '/api/choferes/mis-organizaciones');
  espera('chofer lista sus PyMEs → 200', misOrgs, 200);
  registrar('aparece la PyME con fecha_alta', Array.isArray(misOrgs.body) && misOrgs.body.some((x) => x.id_organizacion === id && x.fecha_alta), JSON.stringify(misOrgs.body));
  const meD = await api(D, 'GET', '/api/auth/me');
  registrar('GET /me del chofer: organizaciones incluye la PyME', Array.isArray(meD.body?.organizaciones) && meD.body.organizaciones.some((x) => x.id_organizacion === id), JSON.stringify(meD.body?.organizaciones));
  espera('un CLIENTE no usa /choferes/mis-organizaciones → 403', await api(A, 'GET', '/api/choferes/mis-organizaciones'), 403, 'Acceso denegado');
  const choferes = await api(B, 'GET', `/api/organizaciones/${id}/choferes`);
  espera('un miembro lista los choferes → 200', choferes, 200);
  const ch = Array.isArray(choferes.body) ? choferes.body.find((x) => x.id_usuario === D.id_usuario) : null;
  registrar('aparece el chofer con nombre, teléfono y vehículos', !!ch && ch.nombre === 'Diego' && 'telefono' in ch && Array.isArray(ch.vehiculos), JSON.stringify(choferes.body));
  registrar('metodo_cobro es CALCULO_PLATAFORMA', ch?.metodo_cobro === 'CALCULO_PLATAFORMA', JSON.stringify(ch));
  registrar('no expone otras PyMEs del chofer', !!ch && !Object.keys(ch).some((k) => k.startsWith('organizacion')), JSON.stringify(ch));

  seccion('Revocar invitaciones');
  const invM2 = await api(A, 'POST', `/api/organizaciones/${id}/invitaciones`, { tipo: 'MIEMBRO' });
  espera('un miembro no revoca una de MIEMBRO → 403', await api(B, 'DELETE', `/api/organizaciones/${id}/invitaciones/${invM2.body?.id_invitacion}`), 403, 'Solo un responsable puede revocar');
  espera('un miembro revoca una de CHOFER → 200', await api(B, 'DELETE', `/api/organizaciones/${id}/invitaciones/${invC2.body?.id_invitacion}`), 200);
  espera('el responsable revoca la de MIEMBRO → 200', await api(A, 'DELETE', `/api/organizaciones/${id}/invitaciones/${invM2.body?.id_invitacion}`), 200);
  espera('revocar de nuevo → 409', await api(A, 'DELETE', `/api/organizaciones/${id}/invitaciones/${invM2.body?.id_invitacion}`), 409, 'ya no esta pendiente');
  espera('invitación inexistente → 404', await api(A, 'DELETE', `/api/organizaciones/${id}/invitaciones/999999999`), 404, 'Invitacion no encontrada');
  espera('id no numérico → 400', await api(A, 'DELETE', `/api/organizaciones/${id}/invitaciones/abc`), 400, 'id de invitacion invalido');
  const lista4 = await api(A, 'GET', `/api/organizaciones/${id}/invitaciones`);
  registrar('las revocadas ya no figuran como pendientes', Array.isArray(lista4.body) && !lista4.body.some((i) => [invM2.body?.id_invitacion, invC2.body?.id_invitacion].includes(i.id_invitacion)), JSON.stringify(lista4.body));

  seccion('Roles de miembros');
  const rolUrl = (u) => `/api/organizaciones/${id}/miembros/${u.id_usuario}/rol`;
  espera('rol inválido → 400', await api(A, 'PUT', rolUrl(B), { rol: 'JEFE' }), 400, 'rol debe ser');
  espera('el último responsable no puede degradarse → 409', await api(A, 'PUT', rolUrl(A), { rol: 'MIEMBRO' }), 409, 'al menos un responsable');
  espera('un miembro no cambia roles → 403', await api(B, 'PUT', rolUrl(A), { rol: 'MIEMBRO' }), 403, 'Solo un responsable');
  espera('miembro inexistente → 404', await api(A, 'PUT', `/api/organizaciones/${id}/miembros/999999999/rol`, { rol: 'MIEMBRO' }), 404, 'Miembro no encontrado');
  espera('id de usuario no numérico → 400', await api(A, 'PUT', `/api/organizaciones/${id}/miembros/abc/rol`, { rol: 'MIEMBRO' }), 400, 'id de usuario invalido');
  espera('promover al miembro → 200', await api(A, 'PUT', rolUrl(B), { rol: 'RESPONSABLE' }), 200);
  espera('pedir el rol que ya tiene es no-op → 200', await api(A, 'PUT', rolUrl(B), { rol: 'RESPONSABLE' }), 200);

  seccion('Concurrencia: dos responsables se degradan a la vez');
  const [d1, d2] = await Promise.all([
    api(A, 'PUT', rolUrl(A), { rol: 'MIEMBRO' }),
    api(B, 'PUT', rolUrl(B), { rol: 'MIEMBRO' }),
  ]);
  registrar('una 200 y una 409 (siempre queda un responsable)', JSON.stringify(sorted([d1.status, d2.status])) === '[200,409]', `llegaron ${d1.status} y ${d2.status}`);
  const resp = d1.status === 200 ? B : A;   // quien sigue como responsable
  const degradado = resp === A ? B : A;
  const m2 = await api(resp, 'GET', `/api/organizaciones/${id}/miembros`);
  registrar('queda exactamente un responsable', Array.isArray(m2.body) && m2.body.filter((m) => m.rol === 'RESPONSABLE').length === 1, JSON.stringify(m2.body));
  espera('el degradado ya no puede editar la PyME → 403', await api(degradado, 'PUT', `/api/organizaciones/${id}`, { nombre: 'X' }), 403, 'Solo un responsable');

  seccion('Eliminar miembro y salir');
  espera('eliminar al degradado → 200', await api(resp, 'DELETE', `/api/organizaciones/${id}/miembros/${degradado.id_usuario}`), 200);
  const meDeg = await api(degradado, 'GET', '/api/auth/me');
  registrar('el eliminado queda huérfano (organizacion null)', meDeg.body?.organizacion === null, JSON.stringify(meDeg.body?.organizacion));
  espera('el eliminado ya no ve la PyME → 403', await api(degradado, 'GET', `/api/organizaciones/${id}`), 403, 'No perteneces');
  espera('eliminarlo de nuevo → 404', await api(resp, 'DELETE', `/api/organizaciones/${id}/miembros/${degradado.id_usuario}`), 404, 'Miembro no encontrado');
  espera('el último responsable no puede salir → 409', await api(resp, 'POST', `/api/organizaciones/${id}/salir`), 409, 'al menos un responsable');
  espera('ni eliminarse a sí mismo → 409', await api(resp, 'DELETE', `/api/organizaciones/${id}/miembros/${resp.id_usuario}`), 409, 'al menos un responsable');
  espera('un huérfano no puede salir → 403', await api(degradado, 'POST', `/api/organizaciones/${id}/salir`), 403, 'No perteneces');

  seccion('Desvincular choferes (desde la PyME)');
  espera('id no numérico → 400', await api(resp, 'DELETE', `/api/organizaciones/${id}/choferes/abc`), 400, 'id de conductor invalido');
  espera('chofer no vinculado → 404', await api(resp, 'DELETE', `/api/organizaciones/${id}/choferes/999999999`), 404, 'No hay un vinculo activo');
  espera('desvincular al chofer → 200', await api(resp, 'DELETE', `/api/organizaciones/${id}/choferes/${ch?.id_conductor}`), 200);
  espera('desvincularlo de nuevo → 404', await api(resp, 'DELETE', `/api/organizaciones/${id}/choferes/${ch?.id_conductor}`), 404, 'No hay un vinculo activo');
  const misOrgs2 = await api(D, 'GET', '/api/choferes/mis-organizaciones');
  registrar('el chofer ya no ve la PyME', Array.isArray(misOrgs2.body) && !misOrgs2.body.some((x) => x.id_organizacion === id), JSON.stringify(misOrgs2.body));
  const ch2 = await api(resp, 'GET', `/api/organizaciones/${id}/choferes`);
  registrar('la PyME ya no lo lista', Array.isArray(ch2.body) && !ch2.body.some((x) => x.id_usuario === D.id_usuario), JSON.stringify(ch2.body));
  espera('el chofer se desvincula de una PyME a la que no pertenece → 404', await api(D, 'DELETE', `/api/choferes/mis-organizaciones/${id}`), 404, 'No hay un vinculo activo');
  espera('id de PyME no numérico → 400', await api(D, 'DELETE', '/api/choferes/mis-organizaciones/abc'), 400, 'id de PyME invalido');
}

// ── Modo extra ─────────────────────────────────────────────────────────────
// Correrlo al menos 15 minutos después del principal. Usa 6 canjes: el sexto
// tiene que dar 429.
async function extra() {
  seccion('Preparación');
  const X = await crearUsuario('CLIENTE', 'Xime');
  const Y = await crearUsuario('CLIENTE', 'Yago');
  const Z = await crearUsuario('CLIENTE', 'Zoe');
  const W = await crearUsuario('CONDUCTOR', 'Walter');
  const crear = await api(X, 'POST', '/api/organizaciones', { nombre: `PyME Extra ${seg()}`, cuit: cuitValido() });
  if (!espera('PyME creada → 201', crear, 201)) throw new Error('Sin PyME no se puede seguir');
  const id = crear.body.id_organizacion;
  const m1 = await api(X, 'POST', `/api/organizaciones/${id}/invitaciones`, { tipo: 'MIEMBRO' });
  const c1 = await api(X, 'POST', `/api/organizaciones/${id}/invitaciones`, { tipo: 'CHOFER' });
  const m2 = await api(X, 'POST', `/api/organizaciones/${id}/invitaciones`, { tipo: 'MIEMBRO' });
  registrar('3 invitaciones generadas', [m1, c1, m2].every((r) => r.status === 201));

  seccion('Concurrencia: dos cuentas con el mismo código (canjes 1 y 2)');
  const [a, b] = await Promise.all([
    api(Y, 'POST', '/api/invitaciones/canjear', { codigo: m1.body?.codigo }),
    api(Z, 'POST', '/api/invitaciones/canjear', { codigo: m1.body?.codigo }),
  ]);
  registrar('una 200 y una 400 "Codigo invalido"', JSON.stringify(sorted([a.status, b.status])) === '[200,400]', `llegaron ${a.status} ${JSON.stringify(a.body)} y ${b.status} ${JSON.stringify(b.body)}`);
  const ganador = a.status === 200 ? Y : Z;
  const perdedor = ganador === Y ? Z : Y;

  seccion('Salir de la PyME');
  const salir = await api(ganador, 'POST', `/api/organizaciones/${id}/salir`);
  espera('un miembro sale → 200', salir, 200);
  registrar('responde con el id de la PyME', salir.body?.id_organizacion === id, JSON.stringify(salir.body));
  const meG = await api(ganador, 'GET', '/api/auth/me');
  registrar('queda huérfano', meG.body?.organizacion === null, JSON.stringify(meG.body?.organizacion));

  seccion('Chofer que se desvincula solo (canje 3)');
  espera('[canje 3] chofer se vincula → 200', await api(W, 'POST', '/api/invitaciones/canjear', { codigo: c1.body?.codigo }), 200);
  const desv = await api(W, 'DELETE', `/api/choferes/mis-organizaciones/${id}`);
  espera('se desvincula → 200', desv, 200);
  registrar('responde con el id de la PyME', desv.body?.id_organizacion === id, JSON.stringify(desv.body));
  espera('desvincularse de nuevo → 404', await api(W, 'DELETE', `/api/choferes/mis-organizaciones/${id}`), 404, 'No hay un vinculo activo');
  const lista = await api(W, 'GET', '/api/choferes/mis-organizaciones');
  registrar('su lista queda vacía', Array.isArray(lista.body) && lista.body.length === 0, JSON.stringify(lista.body));

  seccion('Código revocado y límite de intentos (canjes 4, 5 y 6)');
  espera('revocar → 200', await api(X, 'DELETE', `/api/organizaciones/${id}/invitaciones/${m2.body?.id_invitacion}`), 200);
  espera('[canje 4] código revocado → 400', await api(perdedor, 'POST', '/api/invitaciones/canjear', { codigo: m2.body?.codigo }), 400, 'Codigo invalido');
  espera('[canje 5] código inventado → 400', await api(perdedor, 'POST', '/api/invitaciones/canjear', { codigo: 'ABCDE-FGHJK' }), 400, 'Codigo invalido');
  espera('[canje 6] sexto intento en 15 min → 429', await api(perdedor, 'POST', '/api/invitaciones/canjear', { codigo: 'ABCDE-FGHJK' }), 429, 'Demasiados intentos');
}

// ── Ejecución ──────────────────────────────────────────────────────────────
const inicio = Date.now();
console.log(`Fleter · pruebas de identidad · modo ${MODO} · ${BASE}`);
try {
  await (MODO === 'principal' ? principal() : extra());
} catch (e) {
  registrar('ejecución completa', false, e.message);
}
const fallas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallas.length} de ${resultados.length} pruebas pasaron (${((Date.now() - inicio) / 1000).toFixed(1)} s)`);
if (fallas.length) {
  console.log('\nFallaron:');
  for (const f of fallas) console.log(`  - [${f.grupo}] ${f.nombre}\n      ${f.detalle}`);
}
process.exit(fallas.length ? 1 : 0);
