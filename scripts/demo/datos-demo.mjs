#!/usr/bin/env node
// Datos de demo en staging: una empresa con dos conductores vinculados, lugares guardados,
// viajes entregados (con precio pagado en algunos), uno en curso, uno cancelado, uno rechazado,
// viajes por hacer y un viaje repetido. Sirve para recorrer la app con datos que parecen reales.
//
// El backend no acepta viajes con fecha pasada: los «viejos» se hacen de verdad. Se crean para
// dentro de una hora, se espera a que abra la ventana de inicio y cada conductor los recorre.
// Quedan con fecha de hoy. Tarda ~3 minutos. Solo staging (comparte base con producción: carga liviana).
//
// Uso:
//   BASE_URL=https://nombre-proyecto-back-staging.up.railway.app FIREBASE_API_KEY=AIza... \
//   NODE_USE_ENV_PROXY=1 node scripts/demo/datos-demo.mjs
//
// Al final imprime los emails y la contraseña de las tres cuentas.

const BASE = (process.env.BASE_URL || '').replace(/\/$/, '');
const KEY = process.env.FIREBASE_API_KEY || '';
if (!BASE || !KEY) { console.error('Faltan BASE_URL o FIREBASE_API_KEY'); process.exit(2); }
if (!/staging|localhost/i.test(BASE)) { console.error('Esto se corre solo contra staging'); process.exit(2); }

const PASS = 'Fleter2026';
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));
const seg = () => Math.random().toString(36).slice(2, 6);
const enMin = (min) => new Date(Date.now() + min * 60000).toISOString();
const log = (t) => console.log(t);

async function api(u, method, ruta, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (u) headers.Authorization = `Bearer ${u.token}`;
  const pedir = () => fetch(BASE + ruta, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let res;
  try { res = await pedir(); } catch { await dormir(3000); res = await pedir(); }
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}
function ok(r, que, ...esperados) {
  if (!esperados.includes(r.status)) throw new Error(`${que}: ${r.status} ${JSON.stringify(r.body).slice(0, 300)}`);
  return r.body;
}
async function login(email) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASS, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error(`Login falló para ${email}: ${JSON.stringify(j.error?.message)}`);
  return j.idToken;
}
const dni = () => String(20000000 + Math.floor(Math.random() * 25000000));
async function cuenta(tipo, datos) {
  const base = { ...datos, dni: dni(), contrasena: PASS };
  const r = tipo === 'CLIENTE'
    ? await api(null, 'POST', '/api/auth/registro-cliente', base)
    : await api(null, 'POST', '/api/auth/registro-conductor', { ...base, nro_licencia: base.dni, licencia_vencimiento: '2029-08-31T00:00:00.000Z' });
  ok(r, `alta de ${datos.email}`, 201);
  const u = { ...datos, token: await login(datos.email) };
  u.me = ok(await api(u, 'GET', '/api/auth/me'), '/me', 200);
  return u;
}
function cuitValido() {
  const w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  for (;;) {
    const b = '30' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
    let dv = 11 - ([...b].reduce((a, d, i) => a + Number(d) * w[i], 0) % 11);
    if (dv === 11) dv = 0;
    if (dv !== 10) return b + dv;
  }
}

// Direcciones reales del AMBA
const L = {
  pilar:     { nombre: 'Depósito Pilar', direccion: 'Ruta 8 km 52, Pilar, Buenos Aires', lat: -34.4587, lng: -58.9142 },
  mercado:   { nombre: 'Mercado Central', direccion: 'Autopista Ricchieri y Boulogne Sur Mer, Tapiales', lat: -34.6969, lng: -58.5085 },
  palermo:   { nombre: 'Cliente Palermo', direccion: 'Av. Santa Fe 3200, Palermo, CABA', lat: -34.5880, lng: -58.4110 },
  vlopez:    { nombre: 'Sucursal Vicente López', direccion: 'Av. Maipú 1450, Vicente López, Buenos Aires', lat: -34.5266, lng: -58.4728 },
};
const D = {
  flores:    { direccion: 'Av. Rivadavia 6800, Flores, CABA', lat: -34.6294, lng: -58.4633 },
  sanisidro: { direccion: 'Av. Centenario 200, San Isidro, Buenos Aires', lat: -34.4708, lng: -58.5129 },
  laplata:   { direccion: 'Calle 7 y 50, La Plata, Buenos Aires', lat: -34.9214, lng: -57.9545 },
  belgrano:  { direccion: 'Av. Cabildo 2040, Belgrano, CABA', lat: -34.5610, lng: -58.4560 },
  avellaneda:{ direccion: 'Av. Mitre 750, Avellaneda, Buenos Aires', lat: -34.6620, lng: -58.3650 },
};

async function main() {
  const s = seg();
  log('▸ Cuentas');
  const E = await cuenta('CLIENTE', { nombre: 'Laura', apellido: 'Benítez', email: `fleterdemo.empresa.${s}@example.com`, telefono: '+5491145678901' });
  const M = await cuenta('CONDUCTOR', { nombre: 'Martín', apellido: 'Gómez', email: `fleterdemo.martin.${s}@example.com`, telefono: '+5491155554444' });
  const C = await cuenta('CONDUCTOR', { nombre: 'Lucía', apellido: 'Fernández', email: `fleterdemo.lucia.${s}@example.com`, telefono: '+5491166667777' });
  const org = ok(await api(E, 'POST', '/api/organizaciones', {
    nombre: 'Distribuidora del Sur', cuit: cuitValido(), razon_social: 'Distribuidora del Sur SRL', direccion: 'Ruta 8 km 52, Pilar',
  }), 'crear la empresa', 201);
  const O = `/api/organizaciones/${org.id_organizacion}`;
  log(`  empresa ${org.id_organizacion}: Distribuidora del Sur`);

  const vehM = ok(await api(M, 'POST', '/api/conductores/mis-vehiculos', { patente: `AE${String(Math.floor(Math.random() * 900) + 100)}KL`, marca: 'Ford', modelo: 'Transit', anio: 2021, color: 'Blanco', tipo_vehiculo: 'utilitario' }), 'vehículo de Martín', 201);
  const vehC = ok(await api(C, 'POST', '/api/conductores/mis-vehiculos', { patente: `AF${String(Math.floor(Math.random() * 900) + 100)}PD`, marca: 'Iveco', modelo: 'Daily', anio: 2020, color: 'Gris', tipo_vehiculo: 'camion_chico' }), 'vehículo de Lucía', 201);
  for (const u of [M, C]) {
    const inv = ok(await api(E, 'POST', `${O}/invitaciones`, { tipo: 'CHOFER' }), 'código de conductor', 201);
    ok(await api(u, 'POST', '/api/invitaciones/canjear', { codigo: inv.codigo }), `vincular a ${u.nombre}`, 200);
  }
  const choferes = ok(await api(E, 'GET', `${O}/choferes`), 'lista de conductores', 200);
  M.idc = choferes.find((c) => c.id_usuario === M.me.id_usuario).id_conductor;
  C.idc = choferes.find((c) => c.id_usuario === C.me.id_usuario).id_conductor;
  M.veh = vehM.id_vehiculo; C.veh = vehC.id_vehiculo;
  log('  Martín y Lucía vinculados, con vehículo');

  log('▸ Lugares guardados');
  const lugar = {};
  for (const [k, l] of Object.entries(L)) lugar[k] = ok(await api(E, 'POST', `${O}/lugares`, { nombre: l.nombre, direccion: l.direccion, lat: l.lat, lng: l.lng }), `lugar ${l.nombre}`, 201);
  const P = (k) => (lugar[k] ? { id_lugar: lugar[k].id_lugar } : D[k]);
  const coords = (k) => (L[k] ?? D[k]);

  const crear = async (u, min, ruta, motivo, descripcion) => {
    const v = ok(await api(E, 'POST', `${O}/viajes`, { id_conductor: u.idc, fecha_programada: enMin(min), paradas: ruta.map(P), motivo, descripcion }), `viaje ${motivo}`, 201);
    v.ruta = ruta;
    return v;
  };

  log('▸ Viajes de hoy (se hacen de verdad)');
  const hoyM = [
    await crear(M, 61, ['pilar', 'vlopez', 'palermo'], 'Reparto zona norte', 'Avisar 10 minutos antes de llegar a Palermo.'),
    await crear(M, 62, ['mercado', 'flores'], 'Reposición de lácteos', 'Mercadería refrigerada: descargar primero.'),
    await crear(M, 63, ['pilar', 'laplata'], 'Entrega a cliente La Plata', 'Pedir firma del encargado de depósito.'),
    await crear(M, 64, ['palermo', 'belgrano'], 'Devolución de envases', 'Son 12 cajones vacíos.'),
  ];
  const hoyC = [
    await crear(C, 61, ['mercado', 'avellaneda'], 'Reposición sucursal Avellaneda', 'Entrar por la calle de atrás.'),
    await crear(C, 62, ['pilar', 'sanisidro'], 'Pedido mayorista San Isidro', 'Tocar timbre en el portón verde.'),
    await crear(C, 63, ['vlopez', 'palermo', 'flores'], 'Reparto oeste', 'Dos paradas con carga frágil.'),
  ];
  for (const v of hoyM) ok(await api(M, 'POST', `/api/choferes/viajes/${v.id_viaje}/confirmar`, { id_vehiculo: M.veh }), 'Martín confirma', 200);
  for (const v of hoyC) ok(await api(C, 'POST', `/api/choferes/viajes/${v.id_viaje}/confirmar`, { id_vehiculo: C.veh }), 'Lucía confirma', 200);

  log('▸ Viajes por hacer, cancelado, rechazado y repetido');
  const dia = 24 * 60;
  const futM1 = await crear(M, 2 * dia + 30, ['pilar', 'palermo'], 'Reparto zona norte', 'Avisar 10 minutos antes de llegar.');
  ok(await api(M, 'POST', `/api/choferes/viajes/${futM1.id_viaje}/confirmar`, { id_vehiculo: M.veh }), 'Martín confirma el futuro', 200);
  await crear(M, 3 * dia + 90, ['mercado', 'vlopez'], 'Reposición Vicente López', 'Carga de 20 bultos.'); // queda sin confirmar
  const cancel = await crear(M, dia + 120, ['pilar', 'avellaneda'], 'Entrega Avellaneda', 'Cliente nuevo.');
  ok(await api(E, 'POST', `${O}/viajes/${cancel.id_viaje}/cancelar`, { motivo: 'El cliente reprogramó la entrega' }), 'cancelar un viaje', 200);
  const rech = await crear(C, dia + 180, ['mercado', 'belgrano'], 'Entrega Belgrano', 'Horario de recepción hasta las 12.');
  ok(await api(C, 'POST', `/api/choferes/viajes/${rech.id_viaje}/rechazar`), 'Lucía rechaza', 200);
  const fecha = (dias) => new Date(Date.now() + dias * 86400000).toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });
  const serie = ok(await api(E, 'POST', `${O}/series`, {
    id_conductor: C.idc, frecuencia: 'DIARIA', hora: '07:00', fecha_desde: fecha(1), fecha_hasta: fecha(10),
    paradas: [P('mercado'), P('flores')], motivo: 'Reposición diaria Flores', descripcion: 'Mercadería refrigerada: el local la recibe hasta las 9.',
  }), 'viaje repetido', 201);
  log(`  serie ${serie.serie?.id_serie} con ${serie.viajes?.length ?? '?'} viajes`);

  log('▸ Esperando que abra la ventana de inicio (hasta ~6 min)…');
  const hacer = async (u, lista, dejarUltimoEnCurso) => {
    for (const [n, v] of lista.entries()) {
      const id = v.id_viaje;
      const o = coords(v.ruta[0]);
      let ini;
      for (let i = 0; i < 20; i++) {
        ini = await api(u, 'POST', `/api/choferes/viajes/${id}/iniciar`, { lat: o.lat, lng: o.lng });
        if (ini.status === 200) break;
        if (!/ventana|todavia|a partir de|curso/i.test(ini.body?.error ?? '')) break;
        await dormir(20000);
      }
      ok(ini, `${u.nombre} inicia VJ-${id}`, 200);
      const paradas = v.paradas;
      await dormir(6000);
      for (let k = 1; k < paradas.length; k++) {
        ok(await api(u, 'POST', `/api/choferes/viajes/${id}/salir`), `${u.nombre} sale de la parada ${k}`, 200);
        if (dejarUltimoEnCurso && n === lista.length - 1) { log(`  ${u.nombre}: VJ-${id} queda en ruta`); return; }
        await dormir(8000);
        const c = coords(v.ruta[k]);
        ok(await api(u, 'POST', `/api/viajes/${id}/confirmar-parada`, { id_parada: paradas[k].id_parada, lat: c.lat, lng: c.lng }), `${u.nombre} llega a la parada ${k + 1}`, 200);
        await dormir(5000);
      }
      ok(await api(u, 'POST', `/api/choferes/viajes/${id}/salir`), `${u.nombre} termina VJ-${id}`, 200);
      log(`  ${u.nombre}: VJ-${id} entregado`);
    }
  };
  await Promise.all([hacer(M, hoyM, false), hacer(C, hoyC, true)]);

  log('▸ Precio pagado en algunos');
  const pagos = [[hoyM[0], 165000, 'TRANSFERENCIA'], [hoyM[1], 92000, 'EFECTIVO'], [hoyC[0], 88000, 'TRANSFERENCIA']];
  for (const [v, monto, metodo] of pagos) {
    ok(await api(E, 'PUT', `${O}/viajes/${v.id_viaje}/precio-pagado`, { monto, incluye_iva: false, metodo_pago: metodo, comentario: 'Pagado al conductor' }), 'precio pagado', 200, 201);
  }

  console.log('\n✔ Listo. Contraseña de las tres cuentas:', PASS);
  console.log(`  Empresa (Laura, dueña de Distribuidora del Sur): ${E.email}`);
  console.log(`  Conductor (Martín Gómez, Ford Transit):          ${M.email}`);
  console.log(`  Conductora (Lucía Fernández, Iveco Daily):        ${C.email}`);
}

main().catch((e) => { console.error('\n✘', e.message); process.exit(1); });
