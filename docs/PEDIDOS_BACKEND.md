# Pedidos del mobile al backend

> Para: equipo del backend (`SamuelNakab/nombre-proyecto-back`, rama `develop`).
> De: app mobile (`fleter-mobile`, rama `staging`). Fecha: 11 nov 2026.
> Detalle de cada problema en `ISSUES.md` del repo mobile.

## Dónde estamos

- La app mobile está **al día con `develop` hasta `11d2f80`**. Eso incluye el pedido del 20-10 (motivo y
  descripción obligatorios, sin condiciones), la Tarea 5 (cierre sin «Salir») y la Tarea 6 (errores,
  rate limit, handshake del socket).
- `scripts/api-tests/mobile.mjs` hace contra staging **los mismos pedidos que la app**: alta, empresa,
  conductor, viaje, serie, socket y el recorrido entero hasta el remito. Resultado: **41 de 41** el 11 nov
  2026. Gracias por el simulador y por los mensajes de error en castellano: la app los muestra tal cual.
- Todo lo que sigue es lo que la app **no puede hacer sin el backend**. Está ordenado por prioridad.
  Los endpoints y payloads son **propuestas**: si les queda mejor otra forma, la adaptamos.

| # | Pedido | Prioridad | Bloquea en mobile |
|---|---|---|---|
| 1 | Notificaciones push (FCM) | **Alta** | Avisos con la app cerrada, para los dos roles |
| 2 | Desvincular sin cancelar un viaje en curso, con vista previa | **Alta** | Confirmación segura en Conductores y en el perfil del conductor |
| 3 | Historial de alertas por empresa | Media | Pestaña Alertas completa (hoy se pierde lo que pasa con la app cerrada) |
| 4 | Remito con foto | Media | Foto de la entrega en la última parada |
| 5 | ETA, desvíos y ventana de inicio también para el conductor | Media | Llegada actualizada y aviso de desvío en Viaje activo |
| 6 | No mandarle el precio al conductor | ✅ Hecho | Resuelto en `develop` (`c480164`, 13 nov 2026) |
| 7 | Alta con Google | Baja | Botón «Entrar con Google» para cuentas nuevas |
| 8 | Exponer la configuración que el mobile muestra | Baja | Ventana, anticipación y radio sin valores fijos en la app |

---

## 1. Notificaciones push (FCM) — alta

**Hoy.** No hay push. Si la app está cerrada, el conductor no se entera de que le asignaron un viaje y
la empresa no se entera de un rechazo hasta abrirla. Los viajes vencen sin que nadie lo vea venir
(`ISSUES.md` #2).

**Pedido.**
- **Registrar el token del dispositivo.** La app lo saca de `expo-notifications`; puede ser el token FCM
  nativo o el `ExponentPushToken`, ustedes eligen:
  - `POST /api/auth/push-token` `{ "token": "…", "plataforma": "android" | "ios" }`, que guarda o
    actualiza (un usuario puede tener varios teléfonos);
  - `DELETE /api/auth/push-token` `{ "token": "…" }` al cerrar sesión.
- **Cuándo mandar push:**

  | A quién | Cuándo |
  |---|---|
  | Conductor | Le asignan un viaje o una serie (`viaje:asignado`, `serie:asignada`) |
  | Conductor | Le editan, reasignan o cancelan un viaje |
  | Conductor | Recordatorio si sigue sin confirmar (por ejemplo, 2 h antes) |
  | Conductor | Se abre la ventana de inicio («Ya podés iniciar VJ-2419») |
  | Conductor | `parada:salida_detectada` («Parece que ya saliste: tocá Salir») |
  | Empresa (miembros) | El conductor confirma o rechaza |
  | Empresa (miembros) | Faltan ~30 min para que cierre la ventana y sigue `ASIGNADO`/`CONFIRMADO` (evento nuevo `viaje:por_vencer`) |
  | Empresa (miembros) | Vence |
  | Empresa (miembros) | `viaje:cierre_habilitado` |
  | Empresa (miembros) | Desvío y parada larga |

- **Payload de datos** (además del título y el texto), para que la app abra la pantalla correcta al
  tocarla: `{ "tipo": "viaje:asignado", "id_viaje": 2419, "id_organizacion": 7 }`.
- **Textos:** voseo y sin precio para el conductor. Por ejemplo: «Distribuidora Norte te asignó un viaje
  para mañana 08:00».

**Mientras tanto.** Alertas y las listas se actualizan por socket y con REST al volver a la app.

## 2. Desvincular sin cancelar un viaje en curso — alta

**Hoy.** `DELETE /api/organizaciones/:id/choferes/:idc` y `DELETE /api/choferes/mis-organizaciones/:id`
cancelan **todos** los viajes no finales del conductor con esa empresa, **incluido uno en curso**. También
borran sus series activas, y es una sola llamada sin vista previa (`ISSUES.md` #1). Si la carga está
arriba del camión, el viaje queda cancelado, sin remito y sin GPS.

**Pedido.**
- **Vista previa:** `GET /api/organizaciones/:id/choferes/:idc/desvinculacion` (o `DELETE …?simular=true`)
  que devuelva `{ "viajes_a_cancelar": [ids], "en_curso": id | null, "series_a_cancelar": [ids] }`.
  Lo mismo para el lado del conductor.
- **Bloquear si hay un viaje en curso:** `409` con `{ "error": "…", "en_curso": 2419 }`. Para el conductor
  que se desvincula solo, siempre bloqueado. Para la empresa, permitirlo solo con `forzar=true` y que ese
  viaje quede con una causa propia (por ejemplo `INTERRUMPIDO`) y un remito parcial con lo medido.
- **Series:** dejarlas sin conductor (o en pausa) para reasignar, en vez de borrarlas.

**Mientras tanto.** La app arma la lista de lo que se va a cancelar con los viajes que ya tiene y la
muestra antes de confirmar. No puede impedir la cancelación de un viaje en curso.

## 3. Historial de alertas — media

**Hoy.** `alerta:desvio` y `alerta:parada` existen solo como eventos de socket. Si la app estaba cerrada,
la empresa nunca se entera. Tampoco hay forma de marcar una alerta como vista entre teléfonos ni entre
miembros (`ISSUES.md` #4).

**Pedido.**
- Guardar las alertas por organización: tipo, viaje, parada, mensaje y fecha.
- `GET /api/organizaciones/:id/alertas?desde=&cursor=`, paginado y más nuevas primero.
- `PATCH /api/organizaciones/:id/alertas/vistas` `{ "hasta": "<fecha>" }`, por usuario.
- Que el push (pedido 1) use estas mismas alertas.

**Mientras tanto.**
- «Para resolver» y los cambios de estado salen de `GET …/viajes`, sin pérdida.
- Desvíos y paradas largas se ven solo si llegaron con la app abierta.
- Lo visto se guarda en el teléfono.

## 4. Remito con foto — media

**Hoy.** En el contrato figura «en desarrollo»: la entrega se confirma por proximidad GPS y el remito
PDF sale sin foto.

**Pedido:** definir cómo se sube la foto. La app puede:
- sacar la foto con la cámara;
- comprimirla a ~1600 px JPEG (< 500 KB);
- mandarla como `multipart/form-data`.

Una propuesta:
- `POST /api/choferes/viajes/:id/paradas/:idParada/foto` en `DESCARGANDO`, antes de «Salir»;
- respuesta `{ "foto_url": "…" }`;
- que aparezca en el remito y en el detalle de la parada (`foto_url`).

Nos sirve saber:
- si la foto es **obligatoria** para salir de la última parada;
- si se permite **más de una** foto;
- el tamaño máximo (hoy el body tiene un límite de 100 KB, así que la foto necesitaría su propio límite).

## 5. ETA, desvíos y ventana de inicio para el conductor — media

**Hoy.**
- `eta:actualizar`, `alerta:desvio` y `ruta:recalculada` van solo a la empresa: el que maneja no se
  entera.
- El viaje no trae los bordes de la ventana de inicio. La app los muestra con los defaults (−60 / +90
  min) y, si cambian en el backend, muestra una ventana equivocada (`ISSUES.md` #3).

**Pedido.**
- Emitir también a `usuario:{id}` del conductor `eta:actualizar`, `alerta:desvio` y `ruta:recalculada`.
- Sumar al viaje `ventana_inicio_desde` y `ventana_inicio_hasta` (ISO).

## 6. No mandarle el precio al conductor — hecho

> **Resuelto** en `develop` (`c480164`, «Precio v2», 13 nov 2026): el conductor ya no recibe precios, tarifas,
> desglose ni datos personales del creador por ningún canal. Probado con `scripts/api-tests/precio-v2.mjs`.

**Hoy.** `GET /api/choferes/viajes` trae `precio_estimado` (visto en staging: `1338.88…`). Es probable
que el detalle también traiga `precio_real` y `desglose`. La regla del producto es que **el conductor
nunca ve el precio** (el pago es entre la empresa y el conductor, por fuera de la app). Hoy la cumple
solo la app, porque no lo muestra.

**Pedido:** sacar `precio_estimado`, `precio_real`, `desglose`, `tarifa_*` y `costo:actualizar` de todo
lo que recibe el rol `CONDUCTOR` en los viajes de PyME: listas, detalle, `salir` (respuesta) y eventos
de socket, incluido `viaje:finalizado` cuando va al conductor.

## 7. Alta con Google — baja

**Hoy.** Una cuenta de Google nueva entra a Firebase pero `POST /api/auth/login` da `404`, y no hay
registro sin contraseña. La app le pide crear la cuenta con email y contraseña primero.

**Pedido:** que `registro-cliente` y `registro-conductor` acepten un usuario ya autenticado en Firebase
(Bearer token de Google, sin `contrasena`), con los mismos datos personales.

## 8. Exponer la configuración que el mobile muestra — baja

La app muestra valores que hoy tiene fijos y que en el backend son variables:

| Variable | Valor hoy | Dónde la usa la app |
|---|---|---|
| `ANTICIPACION_MINIMA_MINUTOS` | 60 | Primer horario que se ofrece al crear un viaje |
| Ventana de inicio | −60 / +90 min | «Lo podés iniciar de 07:00 a 09:30» |
| `RADIO_CONFIRMACION_METROS` | 200 en staging y production | Texto de ayuda al iniciar o confirmar parada |
| `MAX_PARADAS_POR_VIAJE` | 10 | Tope de paradas |
| `LICENCIA_OPCIONAL` | `false` | Si el paso de licencia del alta se puede saltear |

**Pedido:** sumarlas a `/health` (o a `GET /api/config`, sin auth). Si cambian, la app se acomoda sola.
Mientras tanto, si no coinciden, igual decide el backend y la app muestra su mensaje.

---

## Notas del contrato (no bloquean, para que el `API.md` diga lo que pasa)

- **Ventana de inicio:** el `400` de iniciar dice «el viaje solo puede iniciarse a partir de las 12:27»,
  pero la sección de errores de iniciar en `API.md` no tiene ese texto.
- **CORS:** la app de React Native no manda `Origin`, así que no le afecta cerrar CORS en production. La
  versión web de Expo (solo para desarrollo) sí lo manda.
- **`condiciones` del vehículo:** la app las sigue mandando al registrar un vehículo (opcionales, para el
  marketplace). Si prefieren que deje de mandarlas, avisen.
