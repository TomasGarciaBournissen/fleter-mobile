# Fleter — Issues abiertos

> Problemas de producto y de contrato detectados al revisar el cambio de enfoque
> (`docs/CAMBIO_DE_ENFOQUE.md`, branch `claude/freight-marketplace-pivot-l08445`).
> Última actualización: 2026-10-22

| # | Issue | Prioridad | Dónde se resuelve | Estado |
|---|---|---|---|---|
| 1 | Desvincular a un conductor cancela viajes en curso | Alta | Backend + mobile | Abierto |
| 2 | Avisar antes de que un viaje pase a `VENCIDO` | Media | Backend (push) + mobile | Abierto |
| 3 | El conductor no recibe ETA, desvíos ni la ventana de inicio | Media | Backend | Abierto |
| 4 | No hay historial de alertas para la pestaña Alertas de la empresa | Media | Backend + mobile | Abierto |

---

## 1. Desvincular a un conductor cancela viajes en curso

### Qué pasa hoy
Según las pruebas de contrato (`scripts/api-tests/viajes.mjs` y `series.mjs`):

- `DELETE /api/organizaciones/:id/choferes/:idc` (lo hace la PyME) cancela **todos** los viajes no
  finales del conductor con esa PyME, **incluido uno en curso** (`CARGANDO` / `EN_RUTA` /
  `DESCARGANDO`), con `causa_cancelacion = DESVINCULACION`.
- También **borra** sus series activas (`series_borradas`), y con ellas los ~30 días de viajes ya generados.
- `DELETE /api/choferes/mis-organizaciones/:id` (lo hace el conductor) tiene el mismo efecto sobre
  los viajes con esa PyME.
- Es una sola llamada, sin confirmación previa ni forma de ver antes qué se va a cancelar.

### Por qué es un problema
1. **Carga en la calle sin registro.** Si se desvincula a un conductor con la mercadería arriba, el
   viaje queda `CANCELADO`: no hay remito, las paradas que faltan no se confirman y el GPS deja de
   tener un viaje al que asociarse. La PyME pierde la constancia justo cuando más la necesita.
2. **El conductor puede no enterarse.** El aviso es `viaje:cancelado` por WebSocket. Si está sin
   señal (ver "A tener en cuenta"), sigue manejando y confirmando paradas que el backend va a rechazar.
3. **Un toque borra un mes de trabajo.** Las series activas se borran enteras; no hay
   "deshacer", y reasignarlas a otro conductor obliga a crearlas de nuevo.
4. **El conductor puede abandonar a mitad de viaje** desvinculándose él mismo, y el viaje queda
   cancelado en vez de quedar marcado como abandono.

### Propuesta
- **Bloquear la desvinculación mientras haya un viaje en curso:** responder `409 VIAJE_EN_CURSO`
  con la lista de viajes. Para el conductor que se desvincula, siempre bloqueado. Para la PyME,
  permitirlo solo con un `forzar=true` explícito, y que el viaje en curso quede con un estado o una causa
  propia (por ejemplo `INTERRUMPIDO`) que conserve lo medido hasta ese momento y genere un remito parcial.
- **Vista previa antes de confirmar:** un `GET` (o un `DELETE …?simular=true`) que devuelva qué
  viajes y series se cancelarían, para que la app muestre "Se van a cancelar 3 viajes y 1 serie".
- **Series: liberar en vez de borrar.** Dejar los viajes futuros sin conductor asignado (o la serie
  en pausa) para que la PyME los reasigne, en lugar de borrarlos.
- **En mobile:** diálogo de confirmación con el detalle de la vista previa, en los dos lados (PyME y
  conductor).

### A confirmar con el backend
Si la cancelación de un viaje en curso por desvinculación genera remito y guarda lo medido (la
cancelación normal en curso sí guarda `real`, según `viajes.mjs`).

---

## 2. Avisar antes de que un viaje pase a `VENCIDO`

### Qué pasa hoy
Un viaje pasa solo a `VENCIDO` si el conductor no lo confirma, o si no lo inicia en la ventana
(desde 1 h antes hasta 1,5 h después de la hora programada). El cambio lo hace el sistema y no avisa
antes; las notificaciones push todavía no existen (FCM no está integrado).

### Por qué es un problema
La PyME se entera cuando el viaje ya venció y no hay tiempo de reasignarlo. El conductor puede no
haber visto la asignación.

### Propuesta
- **Al conductor:** push cuando se le asigna un viaje; recordatorio si sigue sin confirmar (por
  ejemplo 2 h antes); aviso al abrirse la ventana de inicio ("Ya podés iniciar el viaje VJ-2419").
- **A la PyME:** push y evento `viaje:por_vencer` a `organizacion:{id}` cuando faltan ~30 min para
  que cierre la ventana y el viaje sigue en `ASIGNADO` o `CONFIRMADO`, con acceso directo a reasignar.
- **Al vencer:** push a los dos lados con el motivo (no confirmado / no iniciado).
- Depende de integrar FCM en el backend y de `expo-notifications` en mobile.

---

## 3. El conductor no recibe ETA, desvíos ni la ventana de inicio

### Qué pasa hoy
- `eta:actualizar`, `alerta:desvio`, `alerta:parada` y `ruta:recalculada` van **solo a la empresa**
  (tabla de eventos del viaje interno en API.md). El conductor, que es quien maneja, no se entera de
  un desvío ni ve una ETA actualizada.
- Los viajes no traen los bordes de la ventana de inicio. El mobile los muestra como referencia con
  los defaults del backend (−60 / +90 min, `src/utils/ventana.js`); si el backend cambia esos valores,
  la app muestra una ventana equivocada (igual el que decide es el backend al tocar «Iniciar»).

### Qué hace la app mientras tanto
- En ruta muestra la **llegada estimada** que ya trae cada parada (`llegada_estimada`), sin calcular nada.
- El aviso de desvío del prototipo de la fase 2 queda fuera hasta que el backend lo mande.

### Pedido al backend
- Emitir también al conductor (`usuario:{id}`) `eta:actualizar`, `alerta:desvio` y `ruta:recalculada`.
- Agregar al viaje `ventana_inicio_desde` y `ventana_inicio_hasta`.

---

## 4. No hay historial de alertas para la pestaña Alertas de la empresa

### Qué pasa hoy
- La app de la empresa tiene una pestaña **Alertas** (prototipo de la fase 3): arriba lo que hay que
  resolver (viajes rechazados, sin confirmar cerca de vencer) y abajo lo que pasó en el día (desvíos,
  paradas largas, salidas tarde, entregas, confirmaciones).
- Los cambios de estado se pueden armar desde los viajes y su historial de estados (REST).
- `alerta:desvio` y `alerta:parada` **solo existen como evento de WebSocket** y no se guardan: si la
  app estaba cerrada o sin señal cuando pasaron, la empresa nunca se entera.
- No hay forma de marcar una alerta como vista entre dispositivos ni entre miembros del equipo.

### Qué hace la app mientras tanto
- «Para resolver» y los cambios de estado salen de `GET /organizaciones/:id/viajes` (sin pérdida).
- Desvíos y paradas largas se muestran solo si llegaron con la app abierta, guardados en el teléfono.

### Pedido al backend
- Persistir las alertas por organización (tipo, viaje, mensaje, fecha) y exponer
  `GET /api/organizaciones/:id/alertas?desde=` con paginado, más un `PATCH …/vistas` por usuario.
- Que el push (ISSUES #2) use esas mismas alertas.

---

## A tener en cuenta (no son issues, son reglas de implementación)

- **Eventos perdidos al reconectar el WebSocket.** Los eventos que se emiten durante un corte no se
  reenvían. Toda pantalla que escucha eventos tiene que volver a pedir el estado por REST al
  reconectar (y al volver la app a primer plano). Aplica a seguimiento en vivo, lista de viajes del
  conductor y viaje activo.
- **Radio de 50 m para iniciar y confirmar paradas:** el valor se va a ajustar. Que el mobile no lo
  tenga hardcodeado; mostrar el mensaje de error que devuelva el backend.
- **Remito con foto:** en desarrollo. Hoy la entrega se confirma por proximidad GPS y se genera el
  remito PDF.
