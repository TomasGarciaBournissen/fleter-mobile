# Fase 5 — Plan de implementación del pivot a panel de empresa (orientado al backend)

> Estado: propuesta para revisar con quien tenga el backend. Fecha: 2026-09-30.
> Origen: auditoría (fase 1), decisiones (fases 2–3) y prototipo interactivo (`prototype/fleter-empresa-prototype.html`).

## 0. Cómo leer este documento

**El backend no está en este repo.** Todo lo que se dice de tablas, endpoints y reglas sale de `api.md` (contrato) y de `PLAN_DESARROLLO.md`, no del código del servidor. Los nombres de tablas y campos (`viajes`, `conductor_empresa`, `id_conductor`, etc.) hay que **verificarlos contra `schema.prisma`** antes de escribir migraciones. Cualquier cosa marcada con ⚠️ es un supuesto que el dueño del backend tiene que confirmar.

Convenciones: esfuerzo **S** (1–2 días), **M** (~1 semana), **L** (varias semanas). Los términos de UI dicen "fletero"; en la base y en la API siguen siendo `conductor`.

### Decisiones ya cerradas

| # | Decisión |
|---|---|
| 1 | Desaparece el rol CLIENTE. El rol GERENTE pasa a ser una **empresa** con varios usuarios de dashboard. |
| 2 | El sistema es cerrado: cada empresa maneja su propio pool de fleteros. El marketplace queda para más adelante y **su código no se borra**. |
| 3 | El fletero **debe usar la app**. Al iniciar el viaje arranca el tracking (también en segundo plano). |
| 4 | Estados visibles: `PROGRAMADO → EN_CURSO → FINALIZADO`, más `CANCELADO`. |
| 5 | **Solo el fletero puede iniciar y finalizar un viaje, y finalizar exige GPS.** La empresa no puede marcarlo como hecho. |
| 6 | Cada viaje tiene **un solo precio**, para el registro de la empresa. No se cobra por la app ni se paga al fletero desde la app. |
| 7 | El tarifador de Google/zonas queda archivado como decisión de producto: lo define el backend (ver §8). |
| 8 | La app se cobra con una **suscripción mensual fija por empresa**. No hay más fee porcentual. |
| 9 | Un fletero está activo en **una sola empresa a la vez**, pero el modelo de datos sigue siendo N:M. |
| 10 | El fletero se une con un **código de un solo uso con vencimiento (72 h)** o por invitación por email. |
| 11 | Viajes recurrentes: **semanal o mensual, en día fijo**. |
| 12 | Los datos de CLIENTE y sus viajes se **archivan**, no se borran. |
| 13 | Plataforma: dashboard web para la empresa; la app mobile queda para el fletero (y una vista liviana de empresa). |

## 1. Principios de implementación

1. **Todo aditivo.** La base de Neon está compartida con producción: nada de `DROP`, `RENAME` ni cambios destructivos hasta el cutover (ya lo dice `api.md` sobre `qr_token`).
2. **Compatibilidad hacia atrás.** La app mobile actual tiene que seguir funcionando mientras se migra. Los endpoints viejos se apagan con un flag, no se borran.
3. **Feature flags** (variables de entorno o tabla de config): `MARKETPLACE_ENABLED` (default `false`), `EMPRESA_API_ENABLED`, `CLIENTE_LOGIN_ENABLED` (default `false` en el cutover).
4. **Reusar la máquina de estados que ya existe.** Ver §5: casi todo lo que el pivot necesita ya está implementado para los viajes de empresa (reserva, asignación, reasignación, cancelación del fletero que vuelve a `RESERVADO_POR_EMPRESA`).
5. **Toda escritura deja rastro** en `viaje_eventos`, en la misma transacción.
6. **Toda consulta va acotada por empresa.** Nunca se confía en un `id_empresa` del body sin verificar la pertenencia del usuario.

## 2. Modelo de datos

Notación estilo Prisma, solo para comunicar. ⚠️ Verificar contra el schema real.

### 2.1 Enums

```prisma
enum RolUsuario   { CLIENTE CONDUCTOR GERENTE ADMIN EMPRESA }   // + EMPRESA; GERENTE queda como alias legacy
enum RolEmpresa   { ADMIN }                                      // hoy un solo valor; el enum deja lugar a OPERADOR
enum OrigenViaje  { MARKETPLACE EMPRESA }
enum PagoEstado   { SIN_REGISTRAR }                              // reservado: no hay pagos en la app (ver nota)
enum FrecuenciaSerie { SEMANAL MENSUAL }
enum EstadoSuscripcion { ACTIVA VENCIDA SUSPENDIDA }
```

`EstadoViaje` **no cambia**. Los cuatro estados visibles se derivan (ver §5.1).

### 2.2 Tablas nuevas

```prisma
model EmpresaUsuario {                // reemplaza a empresas.id_gerente como fuente de verdad
  id_empresa_usuario Int @id @default(autoincrement())
  id_empresa   Int
  id_usuario   Int
  rol          RolEmpresa @default(ADMIN)
  estado       String     @default("ACTIVO")     // ACTIVO | INVITADO | BAJA
  invitado_por Int?
  creado_en    DateTime   @default(now())
  @@unique([id_empresa, id_usuario])
}

model CodigoInvitacion {              // código de un solo uso, reemplaza a empresas.codigo_afiliacion
  id_codigo    Int @id @default(autoincrement())
  id_empresa   Int
  codigo_hash  String   @unique        // se guarda el hash, el código en claro solo se muestra al crearlo
  email        String?                 // si es invitación por email
  creado_por   Int
  vence_en     DateTime                // now() + 72 h
  usado_en     DateTime?
  usado_por    Int?                    // id_conductor
  revocado_en  DateTime?
}

model ViajeSerie {
  id_serie     Int @id @default(autoincrement())
  id_empresa   Int
  frecuencia   FrecuenciaSerie
  dias_semana  Int[]                    // 0=domingo … 6=sábado (solo SEMANAL)
  dia_mes      Int?                     // 1–31 (solo MENSUAL); en meses cortos se usa el último día
  hora_local   String                   // "09:00", en America/Argentina/Buenos_Aires
  termina_tipo String                   // CANTIDAD | FECHA
  termina_n    Int?
  termina_en   DateTime?
  plantilla    Json                     // snapshot: paradas con coords, cliente, carga, condiciones, id_conductor, etc.
  generado_hasta DateTime               // hasta dónde se materializó
  activa       Boolean @default(true)
  creado_por   Int
  creado_en    DateTime @default(now())
}

model ViajeEvento {                     // auditoría
  id_evento  Int @id @default(autoincrement())
  id_viaje   Int
  id_usuario Int?                       // null si lo hizo el sistema (job de series)
  actor      String                     // EMPRESA | FLETERO | SISTEMA | ADMIN
  tipo       String                     // CREADO, EDITADO, ASIGNADO, REASIGNADO, INICIADO, ETAPA, PARADA_CONFIRMADA, FINALIZADO, CANCELADO, CIERRE_FORZADO…
  antes      Json?
  despues    Json?
  en         DateTime @default(now())
  @@index([id_viaje, en])
}

model Suscripcion {
  id_suscripcion Int @id @default(autoincrement())
  id_empresa   Int @unique
  estado       EstadoSuscripcion @default(ACTIVA)
  monto_mensual Decimal
  vigente_hasta DateTime
  notas        String?
}
```

### 2.3 Cambios sobre tablas existentes

| Tabla | Cambio | Nota |
|---|---|---|
| `viajes` | `id_cliente` → **nullable** | Los viajes de empresa no tienen cliente-usuario. |
| `viajes` | `origen_viaje OrigenViaje @default(MARKETPLACE)` | Los existentes quedan `MARKETPLACE`; los nuevos de empresa, `EMPRESA`. |
| `viajes` | `creado_por Int?`, `cliente_nombre String?`, `cliente_contacto String?` | El "cliente" pasa a ser texto libre. |
| `viajes` | `tipo_vehiculo_requerido String?`, `ventana_fin DateTime?`, `notas String?` | `descripcion` existente se reutiliza como "qué se transporta". |
| `viajes` | `id_serie Int?` + `@@unique([id_serie, fecha_programada])` | La unicidad hace idempotente al job de series. |
| `viajes` | `cierre String?` (`GPS` / `FORZADO_ADMIN`) | Sin valor `MANUAL`: la empresa no puede cerrar. |
| `viajes` | `legacy Boolean @default(false)` | Para archivar los viajes de clientes. |
| `viajes` | `distancia_estimada_km Decimal?` | Hoy solo está `duracion_estimada_horas`; la tabla de estimado vs real lo necesita. |
| `viajes` | `distancia_real_km`, `duracion_real_min` (persistidos al cerrar) | Hoy `duracion_real` se calcula al leer; conviene persistir para reportes. |
| `empresas` | agregar `zona_horaria String @default("America/Argentina/Buenos_Aires")`; `codigo_afiliacion` queda deprecado | |
| `conductor_empresa` | agregar `nota String?`, `activo_desde DateTime?` | El estado `PENDIENTE/ACTIVO` se mantiene. |
| `conductor_empresa` | **índice único parcial**: un conductor con una sola fila `ACTIVO` | `CREATE UNIQUE INDEX … ON conductor_empresa(id_conductor) WHERE estado='ACTIVO' AND eliminado_en IS NULL` ⚠️ (nombre de la columna de soft-delete a confirmar). |
| `usuarios` | acepta rol `EMPRESA` | |
| `vehiculos` | sin cambios | Ver pregunta abierta §12.4. |

> **Sobre pagos.** No hay tabla de pagos ni de fee para el nuevo modelo. `FEE_PORCENTAJE` y `total_fee_app` de `/api/admin/estadisticas` quedan deprecados. `PagoEstado` está en el enum solo como reserva y puede omitirse.

## 3. Autenticación y autorización

### 3.1 Roles

- Los usuarios de dashboard tienen `usuarios.rol = 'EMPRESA'` y una fila en `empresa_usuarios`.
- Los `GERENTE` existentes siguen funcionando: en el cutover se crea su fila en `empresa_usuarios` y se los trata como `EMPRESA` (alias). Después se puede migrar el valor del enum.
- `CONDUCTOR` (fletero) no cambia. `ADMIN` (plataforma/soporte) no cambia.
- `CLIENTE`: `POST /api/auth/login` responde **403** `{ "error": "Las cuentas de cliente ya no están disponibles", "codigo": "CLIENTE_DESHABILITADO" }` cuando `CLIENTE_LOGIN_ENABLED=false`.

### 3.2 Middleware

```
requireRol('EMPRESA')
requireEmpresaMiembro(idEmpresaParam)     // consulta empresa_usuarios; 403 si no pertenece; 404 si no existe
requireFleteroDelViaje                    // conductor asignado
```

Reglas transversales:
- Un usuario `EMPRESA` solo lee y escribe viajes con `viajes.id_empresa` de una empresa donde es miembro.
- Un fletero solo lee sus propios viajes (`id_conductor` propio), de cualquier empresa activa.
- **Nunca** exponer datos de una empresa a otra, aunque el fletero cambie de empresa (mantener el historial por `id_empresa`).
- `POST /api/auth/login` agrega al response `empresas: [{ id_empresa, nombre, rol }]`.

### 3.3 Registro

- **Nuevo:** `POST /api/auth/registro-empresa` (reemplaza a `registro-gerente`): crea usuario `EMPRESA`, la empresa y la fila de `empresa_usuarios`, y una `suscripcion` inicial (⚠️ trial o `ACTIVA` a definir).
- `registro-gerente`: queda como alias apuntando a la misma lógica durante la transición.
- `registro-cliente`: se apaga con `CLIENTE_LOGIN_ENABLED=false` (responde 410).
- Alta de usuarios adicionales: `POST /api/empresas/:id/usuarios` (invita por email, crea `INVITADO`, ver §4.5).
- Firebase sigue siendo el proveedor de identidad. No hacen falta custom claims: el rol y las empresas se resuelven en el backend por cada request.

## 4. Contrato de API

Todo bajo `/api`, con `Authorization: Bearer <Firebase ID token>`, errores `{ "error": "…" }` (agregar `codigo` para los que el front tiene que distinguir). Fechas ISO 8601 UTC.

### 4.1 Viajes de la empresa

**`POST /api/empresas/:id/viajes`** — crea un viaje (o una serie, si trae `repeticion`).

```json
{
  "paradas": [
    { "direccion": "Mercado Central, Autopista Ricchieri km 8", "localidad": "Tapiales, La Matanza", "lat": -34.704, "lng": -58.503 },
    { "direccion": "Av. Presidente Perón 2100", "localidad": "San Justo, La Matanza", "lat": -34.681, "lng": -58.56 },
    { "direccion": "Av. Directorio 500", "localidad": "Caballito, CABA", "lat": -34.623, "lng": -58.436 }
  ],
  "fecha_programada": "2026-10-07T12:00:00.000Z",
  "ventana_fin": "2026-10-07T14:00:00.000Z",
  "cliente_nombre": "Supermercados La Esquina",
  "cliente_contacto": "+54 11 5544-9012",
  "descripcion": "6 pallets de mercadería seca",
  "notas": "Descargar por el portón de calle Díaz Vélez",
  "tipo_vehiculo_requerido": "Camión grande",
  "condiciones_requeridas": ["CARGA_PESADA"],
  "id_conductor": 12,
  "repeticion": {
    "frecuencia": "SEMANAL",
    "dias_semana": [3],
    "termina": { "tipo": "CANTIDAD", "n": 8 }
  }
}
```

- `id_conductor`: **requerido**; debe ser un fletero `ACTIVO` de esa empresa. (Los viajes pueden quedar sin fletero después, pero no se crean así desde el formulario.)
- El backend fija `origen_viaje = EMPRESA`, `id_empresa`, `creado_por`, calcula distancia/tiempo/precio (§8) y lo deja en `CONDUCTOR_ASIGNADO` (con `id_vehiculo` = vehículo del fletero, ver §12.4).
- **No** emite `viaje:disponible` ni entra al flujo de matching bajo ningún caso.
- Respuesta `201`: el viaje creado (o `{ serie, viajes: [...] }`), más `advertencias`:

```json
{ "advertencias": [
  { "codigo": "SUPERPOSICION", "mensaje": "Carlos Martínez ya tiene VJ-2429 en ese horario", "id_viaje": 2429 },
  { "codigo": "CONDICION_NO_CUMPLIDA", "mensaje": "El vehículo no tiene: Refrigerado" }
] }
```

Las advertencias **no bloquean** (decisión de UX del prototipo); el front las muestra. Errores: `400` validación (fecha pasada, paradas < 2), `403` no es miembro, `409` fletero no activo en la empresa, `402` suscripción vencida (⚠️ ver §9).

**`POST /api/empresas/:id/viajes/estimar`** — misma lógica de cálculo sin crear nada, para la vista previa del formulario. Devuelve `{ distancia_km, duracion_min, precio_estimado }`. (Reemplaza el uso de `POST /api/viajes/estimar-costo`, que exige rol CLIENTE.)

**`GET /api/empresas/:id/viajes`** — ya existe. Agregar filtros y paginación:

| Query | Descripción |
|---|---|
| `estado` | `PROGRAMADO`, `EN_CURSO`, `FINALIZADO`, `CANCELADO` (estado visible; ver §5.1) |
| `id_conductor`, `sin_fletero=true` | Filtra por fletero |
| `desde`, `hasta` | Rango sobre `fecha_programada` |
| `q` | Texto sobre direcciones, cliente y `VJ-…` |
| `orden` | `fecha`, `precio`, `distancia`, `tiempo`, `estado`, `fletero` + `dir=asc|desc` |
| `page`, `limit` | Default 50, máximo 200 (mismo criterio que `/admin`) |

Cada viaje devuelve `estado` (visible), `etapa` (o `null`), `estado_interno`, `sin_fletero` (bool), `cierre`, `serie` (resumen) y los datos de la fila. Además `totales` (`{ cantidad, suma_finalizados, suma_por_hacer }`) para la barra de la tabla.

**`GET /api/empresas/:id/calendario?desde=&hasta=&id_conductor=`** — payload liviano (id, fecha, origen/destino resumidos, estado, fletero, serie) sin paginar, con tope de rango (ej. 62 días). Es el que consume el calendario mes/semana.

**`GET /api/viajes/:id`** — ya existe. Extender la vía de acceso "gerente de la empresa dueña" a "usuario EMPRESA miembro de la empresa dueña". Agregar `eventos` (auditoría, solo para miembros de empresa) y `estimado` vs `real`:

```json
{ "estimado": { "distancia_km": 30.4, "duracion_min": 88, "precio": 18900 },
  "real":     { "distancia_km": 32.0, "duracion_min": 87, "precio": 19050 } }
```

`real` es `null` hasta `FINALIZADO`. En `CANCELADO`, el front muestra "No aplica".

**`PATCH /api/empresas/:id/viajes/:idv`** — edita campos del viaje **solo si está `PROGRAMADO`** (internamente `CONDUCTOR_ASIGNADO` sin iniciar o `RESERVADO_POR_EMPRESA`). Campos editables: fecha/hora, paradas, cliente, carga, notas, condiciones, tipo de vehículo. Si cambian paradas o fecha, se recalcula distancia/tiempo/precio. Con `alcance` (`SOLO_ESTE` | `ESTE_Y_SIGUIENTES` | `TODA_LA_SERIE`) cuando el viaje es de una serie. Notifica al fletero (§6).

**Asignación** — se reutilizan `POST /api/viajes/:id/asignar` y `/reasignar` con estos cambios:
- `id_vehiculo` pasa a ser **opcional**; por defecto se usa el vehículo del fletero (⚠️ §12.4).
- Solo válidas mientras el viaje no esté iniciado (`fecha_inicio IS NULL`). Ya lo hace `reasignar`.
- Devuelven `advertencias` (superposición, condiciones).

**`POST /api/empresas/:id/viajes/:idv/cancelar`** — body `{ "motivo": "…", "alcance": "SOLO_ESTE" }`. `motivo` obligatorio (mínimo 5 caracteres). Válido en `PROGRAMADO` y `EN_CURSO`. Si estaba en curso: corta el tracking (`limpiarViajeActivo`) y avisa al fletero. Es una cancelación **de empresa**: hoy solo el ADMIN puede interrumpir un viaje en marcha (`POST /api/admin/viajes/:id/cancelar`); esta ruta lo habilita para la empresa dueña. Persiste `motivo_cancelacion` (columna existente, hoy solo para admin) y `cancelado_por` (usuario).

### 4.2 Lo que **no** puede hacer la empresa

| Acción | Regla en el backend |
|---|---|
| Iniciar un viaje | Hoy `POST /api/viajes/:id/iniciar` acepta CONDUCTOR **o** GERENTE. **Quitar la rama GERENTE/EMPRESA**: solo el fletero asignado. |
| Cambiar de etapa (`PATCH /estado`) | Ya es solo CONDUCTOR. Mantener. |
| Confirmar paradas / finalizar | Ya es solo CONDUCTOR con proximidad GPS (`RADIO_CONFIRMACION_METROS`). Mantener. |
| Marcar "hecho" a mano | No existe el endpoint. No crearlo. |
| Cierre forzado | Solo ADMIN de plataforma, ver §4.6. |

### 4.3 Series

| Endpoint | Descripción |
|---|---|
| `POST /api/empresas/:id/series` | Alternativa explícita a `repeticion` dentro de `POST …/viajes`. |
| `GET /api/empresas/:id/series` | Lista con la regla en texto ("Cada lunes"), próximas fechas y cantidad de viajes. |
| `PATCH /api/empresas/:id/series/:ids` | Cambia la regla o la plantilla; aplica solo a viajes futuros `PROGRAMADO`. |
| `POST /api/empresas/:id/series/:ids/cancelar` | Cancela los viajes futuros pendientes y desactiva la serie. |

Regla (`repeticion`): `SEMANAL` con `dias_semana: [0..6]`, o `MENSUAL` con `dia_mes: 1..31`; `termina` por `CANTIDAD` (máx. 60) o `FECHA`. Detalle de generación en §7.

### 4.4 Fleteros

| Endpoint | Estado | Descripción |
|---|---|---|
| `GET /api/empresas/:id/conductores` | **cambia** | Agrega por fletero: `vehiculo`, `finalizados_mes`, `proximo_viaje`, `en_viaje` (bool) para las tarjetas. |
| `GET /api/empresas/:id/conductores/:idc` | **nuevo** | Detalle: datos, licencia y vencimiento, vehículo, próximos viajes, historial, km recorridos, `nota`. |
| `PATCH /api/empresas/:id/conductores/:idc` | **nuevo** | Edita `nota`. |
| `POST /api/empresas/:id/conductores/:idc/aprobar` | existe | Pasa `PENDIENTE → ACTIVO`. **Nuevo:** `409 YA_ACTIVO_EN_OTRA_EMPRESA` si el índice único lo impide. |
| `DELETE /api/empresas/:id/conductores/:idc` | existe | Desafilia. Se mantiene: `400` si tiene un viaje en curso; los `CONDUCTOR_ASIGNADO` sin iniciar vuelven a `RESERVADO_POR_EMPRESA` y quedan "sin fletero". Agregar rechazo de solicitudes `PENDIENTE` con la misma ruta. |
| `POST /api/empresas/:id/invitaciones` | **nuevo** | Crea un código de un solo uso. Body opcional `{ "email": "…" }`. |
| `GET /api/empresas/:id/invitaciones` | **nuevo** | Invitaciones vigentes (para la lista "Invitaciones enviadas"). |
| `DELETE /api/empresas/:id/invitaciones/:idi` | **nuevo** | Revoca; el código deja de funcionar. |
| `POST /api/afiliaciones` | **cambia** | Body `{ "codigo": "FLT-XXXX-XXXX" }`. Ver reglas abajo. |

**Códigos de un solo uso** (`POST …/invitaciones`, respuesta `201`):

```json
{ "id_codigo": 31, "codigo": "FLT-7K3M-92QX", "vence_en": "2026-10-03T14:32:00.000Z", "email": null }
```

- Formato `FLT-XXXX-XXXX` con alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L).
- Se guarda **solo el hash**; el código en claro aparece únicamente en esa respuesta (y en el email, si aplica).
- **Vencimiento a las 72 h** y **un solo uso**: el consumo es transaccional (`UPDATE … SET usado_en=now() WHERE id_codigo=? AND usado_en IS NULL AND revocado_en IS NULL AND vence_en > now()`; si afecta 0 filas → error).
- Generar otro código **no** revoca los anteriores salvo que el cliente lo pida; el front del prototipo dice "el anterior dejó de funcionar", así que **decisión de producto:** ⚠️ recomendamos revocar los anteriores sin uso de esa empresa al generar uno nuevo (mismo criterio que hoy `regenerar-codigo`).
- Al usar el código: se crea `conductor_empresa` en `PENDIENTE` (queda esperando aprobación de la empresa) y se emite `fletero:solicitud` al room de la empresa (§6).
- **Rate limit** en `POST /api/afiliaciones`: por usuario (ej. 5 intentos por hora) y por IP, para que un código filtrado o adivinado no pueda usarse por fuerza bruta.
- Errores de `afiliaciones`: `404 CODIGO_INVALIDO`, `410 CODIGO_VENCIDO`, `409 CODIGO_USADO`, `409 YA_ACTIVO_EN_OTRA_EMPRESA`, `429`.
- **Email:** ⚠️ requiere un proveedor de correo transaccional (SendGrid, Resend, SES…). Es una decisión de infraestructura pendiente. Alternativa v1 sin correo: el dashboard muestra el código y la empresa lo comparte por su cuenta (el flujo "invitar por email" del prototipo se implementa después).

### 4.5 Usuarios del dashboard (multi-usuario)

| Endpoint | Descripción |
|---|---|
| `GET /api/empresas/:id/usuarios` | Lista miembros. |
| `POST /api/empresas/:id/usuarios` | Invita por email (crea `INVITADO`; al registrarse con `registro-empresa` o al aceptar, pasa a `ACTIVO`). |
| `DELETE /api/empresas/:id/usuarios/:idu` | Da de baja. **No permitir dejar a la empresa sin ningún ADMIN.** |

### 4.6 Soporte (ADMIN de plataforma)

- **`POST /api/admin/viajes/:id/cerrar-forzado`** — body `{ "motivo": "…" }` obligatorio. Deja el viaje en `FINALIZADO` con `cierre = 'FORZADO_ADMIN'`, registra el evento y **no** calcula el precio a partir de GPS inexistente (usa el estimado, marcado como tal). Es la salida para un viaje trabado en `EN_CURSO` (teléfono muerto, GPS que nunca queda dentro de 50 m). La empresa lo solicita por soporte; no hay botón en su panel.
- Las rutas `/api/admin/*` existentes se mantienen. `estadisticas` deja de calcular `fee`.

### 4.7 Suscripción

- `GET /api/empresas/:id/suscripcion` → `{ estado, monto_mensual, vigente_hasta }`.
- `PUT /api/admin/empresas/:id/suscripcion` (ADMIN): actualiza estado y vigencia (carga manual en v1, ver §9).

### 4.8 Endpoints de la app del fletero

Ya casi alcanzan. Cambios mínimos:

- `GET /api/viajes/asignados`: hoy devuelve solo `CONDUCTOR_ASIGNADO`. Agregar `?estado=` y devolver también los que están en curso (para retomar el viaje al reabrir la app); incluir `empresa` (nombre), `cliente_nombre`, `cliente_contacto`, `descripcion`, `notas`, paradas con `id_parada`.
- `GET /api/viajes/mis-viajes-conductor`: incluir viajes de empresa (hoy filtra por `id_conductor`, así que ya funciona; verificar que no dependa de `cliente`, que ahora puede ser `null`).
- `POST /api/viajes/:id/iniciar`, `PATCH /estado`, `POST /confirmar-parada`, `POST /cancelar-conductor`: sin cambios de contrato. Ver §5.2 para lo que pasa al cancelar.
- **Bug conocido a corregir de paso:** las cancelaciones no notifican por socket. Ver §6.

### 4.9 Endpoints que se apagan (flag `MARKETPLACE_ENABLED=false`)

Responden `410 Gone` con `{ "error": "El marketplace no está habilitado" }` y siguen en el código:

`POST /api/viajes`, `POST /api/viajes/estimar-costo` (reemplazado por §4.1), `GET /api/viajes/disponibles`, `GET /api/viajes/mis-viajes`, `POST /api/viajes/:id/cancelar-cliente`, `POST /api/viajes/:id/calificacion`, `POST /api/viajes/:id/reservar`, `POST /api/viajes/:id/cancelar-reserva`, `GET /api/empresas/:id/viajes-disponibles`, `POST /api/empresas/:id/regenerar-codigo`, y los eventos de socket de matching (§6).

`POST /api/conductores/mis-vehiculos*` se mantiene: el fletero sigue cargando su vehículo.

## 5. Máquina de estados

### 5.1 Estados visibles vs estados internos

**No se toca el enum `EstadoViaje`.** El backend expone un estado visible derivado en un solo lugar (un serializador), para que la web y la app no repitan la lógica:

| `estado` visible | `estado_interno` | `etapa` | Notas |
|---|---|---|---|
| `PROGRAMADO` | `CONDUCTOR_ASIGNADO` | `null` | Con fletero, sin iniciar. |
| `PROGRAMADO` | `RESERVADO_POR_EMPRESA` | `null` | **Sin fletero** (`sin_fletero: true`). Estado al que vuelve el viaje si el fletero cancela o es desafiliado. |
| `EN_CURSO` | `EN_CAMINO_A_ORIGEN`, `CARGANDO`, `EN_RUTA`, `DESCARGANDO` | igual al interno | |
| `FINALIZADO` | `FINALIZADO` | `null` | `cierre = GPS` (o `FORZADO_ADMIN`). |
| `CANCELADO` | `CANCELADO` | `null` | Con `motivo_cancelacion`. |

`BUSCANDO_CONDUCTOR` **no aparece nunca** en viajes de empresa (`origen_viaje = EMPRESA`). Los viajes `MARKETPLACE` legacy se muestran solo en el archivo (`legacy`).

### 5.2 Transiciones para viajes `EMPRESA`

| Desde (interno) | Hacia | Quién | Endpoint | Cambios respecto de hoy |
|---|---|---|---|---|
| — | `CONDUCTOR_ASIGNADO` | Empresa | `POST …/viajes` | Nuevo camino de creación. |
| — | `RESERVADO_POR_EMPRESA` | Sistema | job de series, desafiliación | Se crea/queda sin fletero. |
| `RESERVADO_POR_EMPRESA` | `CONDUCTOR_ASIGNADO` | Empresa | `asignar` | Igual. |
| `CONDUCTOR_ASIGNADO` | `CONDUCTOR_ASIGNADO` | Empresa | `reasignar` | Igual (solo si no inició). |
| `CONDUCTOR_ASIGNADO` | `EN_CAMINO_A_ORIGEN` | **Solo fletero** | `iniciar` | **Se quita el permiso del gerente/empresa.** Ventana `VENTANA_INICIO_MINUTOS` se mantiene. |
| `CONDUCTOR_ASIGNADO` | `RESERVADO_POR_EMPRESA` | Fletero | `cancelar-conductor` | Igual (ya es el comportamiento para viajes de empresa). Ahora **debe notificar** a la empresa (§6). |
| `EN_CAMINO_A_ORIGEN → CARGANDO → EN_RUTA → DESCARGANDO` | | Fletero | `PATCH /estado` | Igual. |
| `DESCARGANDO` | `FINALIZADO` | Fletero (GPS ≤ 50 m) | `confirmar-parada` | Igual. Sin ninguna otra vía. |
| `RESERVADO_POR_EMPRESA` / `CONDUCTOR_ASIGNADO` | `CANCELADO` | Empresa | `…/cancelar` | **Nuevo** para la empresa (hoy solo cliente/admin). |
| `EN_CAMINO_A_ORIGEN…DESCARGANDO` | `CANCELADO` | Empresa | `…/cancelar` | **Nuevo** (hoy solo admin). |
| cualquier no terminal | `FINALIZADO` | ADMIN | `cerrar-forzado` | **Nuevo**, ver §4.6. |

### 5.3 Efectos secundarios que hay que **apagar** para `origen_viaje = EMPRESA`

Estos ya existen para el flujo de marketplace y son el mayor riesgo de regresión del pivot:

1. **Timeout de reserva** (`RESERVA_TIMEOUT_MINUTOS`, 10 min): hoy un `RESERVADO_POR_EMPRESA` que no se asigna vuelve a `BUSCANDO_CONDUCTOR` y se **republica al mercado**. En viajes de empresa esto tiene que **no ejecutarse jamás**; un viaje sin fletero es una condición normal y persistente. (Chequear `origen_viaje` en el temporizador y en `cancelar-reserva`.)
2. **`viaje:disponible`** y `obtenerGerentesElegibles`: no se llama para viajes de empresa.
3. **Republicación al cancelar el conductor independiente**: la rama "sin `id_empresa`" no aplica.
4. **`viaje:requiere_reasignacion`**: se conserva con el mismo payload, pero se emite al room de la empresa (§6).

## 6. Tiempo real (socket.io)

El pipeline de GPS **no cambia** (`conductor:ubicacion` → Redis → `mapa:actualizar`, `eta:actualizar`, `alerta:*`, `ruta:recalculada`). Lo que cambia es **quién puede escuchar**:

- Al conectar, un usuario `EMPRESA` se une a `empresa:{id_empresa}` por cada empresa de la que es miembro. Un fletero se une a `usuario:{id_usuario}` (como hoy).
- El dashboard se une a `viaje:{id}` **solo** si es miembro de la empresa dueña del viaje (validar en el servidor, no en el cliente). Es la regla que hoy cubre `puedeVerViaje`.
- **Eventos nuevos o cambiados:**

| Evento | Room | Payload | Motivo |
|---|---|---|---|
| `viaje:estado_cambiado` | `empresa:{id}` | `{ id_viaje, estado, etapa, estado_anterior }` | La tabla y el calendario se actualizan sin recargar. Hoy solo llega al room del viaje. |
| `viaje:iniciado` | `empresa:{id}` | `{ id_viaje, fecha_inicio, puntualidad_inicio }` | Hoy solo va al cliente, que ya no existe. |
| `viaje:finalizado` | `empresa:{id}` | `{ id_viaje, precio_real, distancia_real_km, duracion_real_min }` | Idem. |
| `viaje:sin_fletero` | `empresa:{id}` | `{ id_viaje, motivo: 'fletero_cancelo' \| 'fletero_desafiliado' }` | Renombra/complementa `viaje:requiere_reasignacion`. |
| `fletero:solicitud` | `empresa:{id}` | `{ id_conductor, nombre }` | Aviso de una nueva solicitud de afiliación. |
| `viaje:actualizado` | `usuario:{id_fletero}` | `{ id_viaje, campos }` | Avisa al fletero cuando la empresa edita o reasigna un viaje suyo. |
| `viaje:cancelado` | `usuario:{id_fletero}` + `viaje:{id}` | `{ id_viaje, motivo, por: 'EMPRESA' }` | **Hoy las cancelaciones no notifican por socket.** Sin esto un fletero puede seguir manejando hacia un viaje cancelado. |
| `viaje:asignado` | `usuario:{id_fletero}` | (existe) | Sin cambios. |

- Los eventos de matching (`viaje:disponible`, `viaje:aceptar`, `viaje:ya_asignado`, `viaje:reservado`, `viaje:reserva_cancelada`, `viaje:conductor_asignado`) se apagan con `MARKETPLACE_ENABLED=false` pero el código se conserva.
- **CORS y transporte:** el dashboard web es un origen nuevo. Habilitarlo en Express y en socket.io. Nota de `PROGRESO.md`: la conexión desde Railway funciona con `websocket` puro.
- **Fallback sin GPS** (teléfono sin señal): el emisor de ETA ya se autodetiene a los 300 s. Agregar `ultima_senal` (timestamp del último ping) al detalle del viaje `EN_CURSO` para que el panel muestre "sin señal hace X min".

## 7. Viajes recurrentes

**Enfoque: materializar viajes reales** (filas en `viajes`), no calcular ocurrencias virtuales. Así el calendario, la tabla, la asignación y el GPS funcionan igual para un viaje de serie que para uno suelto.

**Generador** (función pura + job):

```
generarOcurrencias(regla, plantilla, desde, hasta, zonaHoraria) → [fecha_programada UTC]
```

- `SEMANAL`: los días de `dias_semana` cada semana, a `hora_local`.
- `MENSUAL`: el `dia_mes` de cada mes; **si el mes no lo tiene, el último día** (31 → 30, 28 o 29).
- Fin por `CANTIDAD` (tope 60) o por `FECHA`.
- Horizonte de materialización: **90 días adelante**. Al crear la serie se generan los viajes dentro de ese horizonte y se guarda `generado_hasta`.
- **Job diario** (⚠️ Redis existe: BullMQ con repeatable job, o `node-cron`): extiende cada serie activa hasta `hoy + 90 días`.
- **Idempotencia:** `@@unique([id_serie, fecha_programada])` + `INSERT … ON CONFLICT DO NOTHING`, para que un reintento o dos instancias del job no dupliquen viajes.
- **Zona horaria:** guardar todo en UTC, pero **calcular** las ocurrencias en la hora local de la empresa (`America/Argentina/Buenos_Aires`), para que "09:00" siga siendo 09:00 aunque cambie el offset. Argentina hoy no tiene horario de verano; igual usar una librería con base tz (Luxon o date-fns-tz), nunca sumar `24 h` a mano.
- **Al materializar**, cada viaje: `origen_viaje = EMPRESA`, calcula distancia/tiempo/precio (§8), copia paradas y datos desde `plantilla`, y se asigna al `id_conductor` de la plantilla **solo si sigue `ACTIVO` en la empresa**; si no, se crea `RESERVADO_POR_EMPRESA` (sin fletero) y se registra un evento `SISTEMA`.
- **Ediciones:**
  - `SOLO_ESTE`: edita esa fila y la separa (`id_serie` se mantiene; se marca `excepcion = true` para que el job no la pise).
  - `ESTE_Y_SIGUIENTES`: actualiza la plantilla y todos los viajes futuros `PROGRAMADO` de la serie sin `excepcion`.
  - `TODA_LA_SERIE`: lo mismo, incluyendo los anteriores que sigan `PROGRAMADO`.
  - Nunca se tocan viajes `EN_CURSO`, `FINALIZADO` o `CANCELADO`.
- **Cancelación por alcance:** mismos tres alcances; los viajes cancelados quedan en la base con motivo, no se borran.
- **Llamadas a Google:** cada ocurrencia con la misma ruta produce la misma distancia y tiempo, así que hay que **calcular una vez por serie** y copiar (o cachear por hash de coordenadas), no una llamada por viaje.

## 8. Precio del viaje

Decisión de producto: hay **un solo precio por viaje**, solo informativo. Cómo se calcula lo decide el backend. Para no bloquear al front, se define la interfaz y se difiere la implementación:

```
calcularEstimacion(paradas, fecha_programada, empresa) → { distancia_km, duracion_min, precio_estimado, desglose }
```

- Se llama al crear el viaje, al editar paradas o fecha, y desde `POST …/viajes/estimar` (vista previa del formulario).
- **Implementación por defecto (v1):** reutilizar el tarifador actual (Google Distance Matrix + zonas CABA/Provincia/Mixto + hora pico) tal como funciona hoy. Es lo que ya está probado.
- **Configuración por empresa (opcional, v2):** ⚠️ `tarifa_config` en `empresas` (tarifa por hora, por km, activar o no zonas) para no depender de variables de entorno globales (`TARIFA_*`).
- **Precio real** (al finalizar): se sigue calculando con el GPS acumulado, como hoy. `viaje:finalizado` lo emite.
- Se **elimina** el fee: `precio_real` es el número final. `admin/viajes/:id` deja de devolver `fee`.
- ⚠️ **Decisión pendiente del dueño del backend:** si el precio de la empresa debe salir del tarifador de la plataforma o de una tarifa propia de cada empresa. La respuesta cambia el modelo (§2) pero no el contrato de API.

## 9. Suscripción mensual

- **Modelo:** `suscripciones` (§2.2). Un monto fijo por empresa y una fecha de vigencia.
- **Cobro v1 propuesto:** manual (ADMIN carga estado y vigencia). Evita construir facturación antes de validar el producto. El plan del proyecto menciona MercadoPago; no está integrado y la app mobile nunca lo integró.
- **Qué pasa si se vence** ⚠️ (decisión de producto, no la tomamos nosotros): opciones posibles son (a) solo lectura, (b) bloquear la creación de viajes nuevos pero mantener los ya programados, (c) suspender todo. Recomendamos **(b)**: nunca cortar viajes en curso ni el acceso de los fleteros, que dependen de la app para trabajar. Implementar como una guarda en `POST …/viajes` (`402 SUSCRIPCION_VENCIDA`) y **nunca** en el pipeline de GPS ni en `confirmar-parada`.
- Sin datos de facturación real en esta fase, es una tabla y un check.

## 10. Seguridad y privacidad

- **Aislamiento entre empresas:** todos los endpoints con `:id` verifican pertenencia. Agregar tests que intenten leer, editar y suscribirse a sockets de otra empresa.
- **Códigos:** hash en base, un solo uso transaccional, TTL, rate limit, revocación (§4.4). No loguear el código en claro.
- **Fletero en varias empresas:** el modelo lo permite, pero un solo `ACTIVO` a la vez (índice único parcial). Cada empresa ve solo el historial de sus propios viajes con ese fletero.
- **Tracking:** ya limitado al conductor asignado (`conductor:ubicacion` valida al conductor del viaje). Mantener; el dashboard solo recibe la posición de viajes `EN_CURSO` de su empresa.
- **Secretos:** la API key de Google Maps está comprometida en `app.json` (el repo mobile) y coincide con la key de Firebase según `PROGRESO.md`. Rotarla y **restringirla por app/bundle** antes de publicar el dashboard web.
- **Consentimiento de tracking:** se pospone (decisión tuya). Queda anotado como pendiente legal antes de salir a producción.
- **Auditoría:** `viaje_eventos` para toda escritura de empresa; incluye edición, reasignación y cancelación.

## 11. Migración de datos (base compartida con producción)

**Antes de empezar:** crear una **rama de Neon** (copia) y ejecutar todo ahí primero. Sacar un snapshot de producción y definir el plan de vuelta atrás.

Orden, todo idempotente (`IF NOT EXISTS`, `WHERE … IS NULL`):

1. **Schema aditivo** (M1): tablas nuevas, columnas nuevas nullable, índices. Sin backfill todavía. Deploy con todo apagado por flags. *La app actual sigue funcionando.*
2. `viajes.origen_viaje = 'MARKETPLACE'` para todas las filas existentes (default) y `legacy = true` donde `id_empresa IS NULL` **y** el viaje está `FINALIZADO` o `CANCELADO` (historial de clientes). Los viajes de empresa ya existentes (`id_empresa IS NOT NULL`) quedan como `origen_viaje = EMPRESA`, `legacy = false`. Los viajes activos de marketplace se dejan terminar o se cancelan con `motivo`.
3. `empresa_usuarios` ← una fila por cada `empresas.id_gerente` (rol `ADMIN`, estado `ACTIVO`). Pasar `usuarios.rol GERENTE → EMPRESA` se hace en un paso posterior; mientras tanto ambos valores se aceptan.
4. **`conductor_empresa`:** detectar fleteros con más de una fila `ACTIVO`. Es el paso que exige decisión humana: listar y resolver (dejar una, pasar las otras a `INACTIVO`) **antes** de crear el índice único parcial. Si no hay ninguno, crear el índice directamente.
5. `codigo_afiliacion` existentes: no se migran como invitaciones. Quedan sin uso; las empresas generan códigos nuevos. `regenerar-codigo` se apaga.
6. `suscripciones`: una fila por empresa existente, en `ACTIVA` con una vigencia inicial acordada (⚠️ período de gracia).
7. **Clientes:** sus filas en `usuarios`/`clientes` **no se tocan**. `CLIENTE_LOGIN_ENABLED=false` corta el acceso. Sus viajes quedan `legacy`, de solo lectura (visibles desde `/api/admin` y opcionalmente en un archivo de la empresa si el viaje tuvo `id_empresa`).
8. **Cutover:** activar `EMPRESA_API_ENABLED`, apagar `MARKETPLACE_ENABLED` y `CLIENTE_LOGIN_ENABLED`. La app mobile actualizada (versión sin pantallas de cliente ni de marketplace) tiene que estar publicada antes; para la ventana de transición conviene un mínimo de versión soportada (`X-App-Version`) ⚠️.
9. **Verificación** (queries de control): cantidad de viajes antes/después, todo `viaje` con `id_empresa` tiene su `empresa_usuarios` con al menos un ADMIN, ningún fletero con dos `ACTIVO`, ningún viaje `EMPRESA` en `BUSCANDO_CONDUCTOR`.
10. **Vuelta atrás:** los flags se pueden revertir sin tocar datos porque nada se borró. Las columnas nuevas nullable no afectan al código viejo.

Lo que **no** se migra ni se borra en esta fase: `qr_token` (columna muerta), tabla `clientes`, tablas de calificaciones, `zona`/tarifas de viajes históricos.

## 12. Preguntas abiertas para el dueño del backend

1. **Precio (§8):** ¿el tarifador sale de la plataforma o hay tarifas por empresa? ¿Se mantiene Google Distance Matrix?
2. **Vencimiento de la suscripción (§9):** ¿qué se bloquea? Proponemos solo la creación de viajes nuevos.
3. **Correo transaccional (§4.4):** ¿qué proveedor? Sin él, las invitaciones por email quedan para después.
4. **Vehículo del viaje:** hoy `asignar` exige un vehículo **de la flota de la empresa** (`vehiculos.id_empresa`). En el nuevo modelo cada fletero trae **su** vehículo. Confirmar si `asignar` debe aceptar el vehículo propio del fletero (`vehiculos.id_conductor`) por defecto. La flota de empresa puede seguir existiendo como opción.
5. **Columna de soft-delete** de `conductor_empresa` y nombre real de las tablas, para el índice único parcial (§2.3).
6. **Job scheduler:** ¿BullMQ sobre el Redis existente o cron? ¿Hay un worker separado o corre en la misma instancia de Railway (riesgo de doble ejecución)?
7. **Versión mínima de la app** durante la transición (§11.8).
8. **Zona horaria por empresa** o fija en Buenos Aires: recomendamos una columna con default fijo.
9. **Superposiciones:** ¿advertencia (lo asumido en el prototipo) o rechazo `409` en el servidor? Recomendamos advertencia.

## 13. Del prototipo al contrato

| Pantalla del prototipo | Endpoints |
|---|---|
| Login | `POST /api/auth/login` (con `empresas` en la respuesta) |
| Nuevo viaje | `GET …/conductores`, `POST …/viajes/estimar`, `POST …/viajes` |
| Calendario | `GET …/calendario`, socket `empresa:{id}` |
| Viajes (tabla) | `GET …/viajes` (filtros y `totales`), exportación en el cliente |
| Detalle de viaje | `GET /api/viajes/:id`, `PATCH …/viajes/:idv`, `POST …/asignar`, `POST …/reasignar`, `POST …/cancelar`, `GET /api/viajes/:id/remito`, sockets `viaje:{id}` |
| Fleteros (lista, detalle) | `GET …/conductores`, `GET …/conductores/:idc`, `PATCH …/conductores/:idc`, `DELETE …/conductores/:idc` |
| Agregar fletero (código, email) | `POST/GET/DELETE …/invitaciones` |
| Aprobar / rechazar | `POST …/conductores/:idc/aprobar`, `DELETE …/conductores/:idc` |
| Simulación de GPS (solo demo) | En producción la hace la app del fletero con los endpoints de §4.8 |

## 14. Plan de trabajo ordenado por dependencia

Cada hito puede desplegarse solo, con flags apagados.

### M0 — Preparación (S)
| Id | Tarea | Esf. | Depende de |
|---|---|---|---|
| B0.1 | Rama de Neon + snapshot + entorno de staging | S | — |
| B0.2 | Flags `MARKETPLACE_ENABLED`, `EMPRESA_API_ENABLED`, `CLIENTE_LOGIN_ENABLED` | S | — |
| B0.3 | Rotar y restringir la API key de Google | S | — |
| B0.4 | Confirmar el schema real y responder §12 | S | — |

### M1 — Datos y autorización (M)
| Id | Tarea | Esf. | Depende de |
|---|---|---|---|
| B1.1 | Migración aditiva (§2): tablas y columnas nuevas | M | B0.1, B0.4 |
| B1.2 | `empresa_usuarios` + backfill desde `id_gerente` | S | B1.1 |
| B1.3 | Rol `EMPRESA`, middleware `requireEmpresaMiembro` | M | B1.2 |
| B1.4 | `viaje_eventos` y helper que registra en la transacción | S | B1.1 |
| B1.5 | `registro-empresa`; `login` devuelve `empresas`; bloqueo de CLIENTE | S | B1.3 |
| B1.6 | Serializador de estado visible (§5.1) | S | B1.1 |

### M2 — API de viajes de empresa (L)
| Id | Tarea | Esf. | Depende de |
|---|---|---|---|
| B2.1 | Interfaz `calcularEstimacion` (envuelve el tarifador actual) y `POST …/viajes/estimar` | M | B1.1 |
| B2.2 | `POST …/viajes` (un viaje) + advertencias | M | B1.3, B1.4, B2.1 |
| B2.3 | Apagar los efectos de marketplace para `origen_viaje = EMPRESA` (§5.3) | M | B1.1 |
| B2.4 | `GET …/viajes` con filtros, orden, paginación y `totales`; `GET …/calendario` | M | B1.6 |
| B2.5 | `GET /api/viajes/:id` con acceso de empresa, `estimado/real`, `eventos` | S | B1.3, B1.4 |
| B2.6 | `PATCH …/viajes/:idv` (solo `PROGRAMADO`) | M | B2.2 |
| B2.7 | `asignar`/`reasignar` con vehículo del fletero por defecto + advertencias | S | B2.2 |
| B2.8 | `iniciar` solo fletero; `…/cancelar` de empresa; `cerrar-forzado` (admin) | M | B2.2 |
| B2.9 | Persistir `distancia_real_km`/`duracion_real_min` al cerrar | S | B1.1 |

### M3 — Fleteros e invitaciones (M)
| Id | Tarea | Esf. | Depende de |
|---|---|---|---|
| B3.1 | Índice único parcial (tras resolver duplicados, §11.4) | S | B1.1 |
| B3.2 | `CodigoInvitacion`: crear, listar, revocar, consumir transaccional, rate limit | M | B1.3 |
| B3.3 | `POST /api/afiliaciones` con código de un solo uso y vencimiento | S | B3.2, B3.1 |
| B3.4 | Detalle y nota de fletero; lista con `finalizados_mes`, `proximo_viaje`, `en_viaje` | S | B1.3 |
| B3.5 | Invitación por email | M | B3.2 + decisión de proveedor |
| B3.6 | Usuarios del dashboard (`GET/POST/DELETE …/usuarios`) | S | B1.3 |

### M4 — Series recurrentes (L)
| Id | Tarea | Esf. | Depende de |
|---|---|---|---|
| B4.1 | Generador de ocurrencias (función pura) con tests de fin de mes y zona horaria | M | B1.1 |
| B4.2 | Alta de serie y materialización a 90 días (con un solo cálculo de ruta por serie) | M | B4.1, B2.2 |
| B4.3 | Job diario idempotente que extiende el horizonte | M | B4.2 |
| B4.4 | Edición y cancelación por alcance (`SOLO_ESTE` / `ESTE_Y_SIGUIENTES` / `TODA_LA_SERIE`) | M | B4.2, B2.6 |

### M5 — Tiempo real para el dashboard (M)
| Id | Tarea | Esf. | Depende de |
|---|---|---|---|
| B5.1 | Rooms `empresa:{id}` y validación de pertenencia al unirse a `viaje:{id}` | M | B1.3 |
| B5.2 | Eventos nuevos (§6) incluyendo `viaje:cancelado` y `viaje:sin_fletero` | M | B5.1 |
| B5.3 | CORS/socket para el origen del dashboard; `ultima_senal` en el detalle | S | B5.1 |

### M6 — Suscripción (S–M)
| Id | Tarea | Esf. | Depende de |
|---|---|---|---|
| B6.1 | Tabla, endpoints de lectura y edición admin | S | B1.1 |
| B6.2 | Guarda `402` en la creación de viajes | S | B6.1 |
| B6.3 | Cobro automático (si se decide) | L | B6.1 + proveedor de pagos |

### M7 — Migración y cutover (M)
| Id | Tarea | Esf. | Depende de |
|---|---|---|---|
| B7.1 | Backfills (§11.2–11.6) y queries de verificación, ensayo completo en la rama de Neon | M | M1, M3 |
| B7.2 | Apagado de endpoints y eventos de marketplace con `410` | S | M2 |
| B7.3 | Publicar la app mobile del fletero y fijar versión mínima | S | apps del frente |
| B7.4 | Cutover con los flags y plan de vuelta atrás | M | todo lo anterior |

### Lo que desbloquea a los frentes que no son backend
- **Web dashboard:** puede empezar con contrato mockeado apenas exista este documento; necesita **M1 + M2 (B2.2, B2.4)** para funcionar de punta a punta, **M3** para la pestaña Fleteros y **M5** para verlo en vivo.
- **App del fletero:** necesita **B2.8**, **B5.2** (`viaje:cancelado`) y `asignados` extendido (§4.8). Además, cambiar la persistencia de sesión de Firebase (hoy en memoria) para que el tracking sobreviva a un reinicio.

## 15. Estrategia de pruebas (backend)

- **Autorización:** una matriz rol × endpoint × pertenencia. Casos: usuario de la empresa A contra recursos de la B (HTTP y socket), fletero contra viaje ajeno, cliente logueando, empresa intentando iniciar o finalizar.
- **Máquina de estados:** cada transición permitida y cada prohibida de §5.2, incluida "la empresa no puede llegar a `FINALIZADO`".
- **Marketplace apagado:** un viaje `EMPRESA` sin fletero **nunca** pasa a `BUSCANDO_CONDUCTOR` ni emite `viaje:disponible` (test de regresión del §5.3, el más importante).
- **Series:** meses cortos, 31 de cada mes, cruce de año, idempotencia del job (correrlo dos veces), edición por alcance, fletero desafiliado al materializar.
- **Códigos:** uso concurrente del mismo código (solo uno gana), vencido, revocado, rate limit.
- **Concurrencia:** doble asignación y doble cancelación (el patrón `UPDATE … WHERE estado=…` ya existe; reutilizarlo).
- **Migración:** ensayo completo sobre una rama de Neon con datos reales anonimizados; comparar conteos antes y después.
- **Carga liviana:** `GET …/calendario` y `GET …/viajes` con miles de viajes por empresa.

## 16. Fuera de alcance de esta fase

- Cobro automático de la suscripción y facturación.
- Pagos a fleteros y cualquier movimiento de dinero por la app.
- Consentimiento legal del tracking (pospuesto por decisión del producto; pendiente antes de producción).
- Reactivación del marketplace (el código se conserva pero no se toca).
- Rol `OPERADOR` (solo el enum lo deja preparado).
- Notificaciones push (FCM no está integrado hoy).
