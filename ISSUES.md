# Fleter — Issues abiertos

> Problemas de producto y de contrato detectados al revisar el cambio de enfoque
> (`docs/CAMBIO_DE_ENFOQUE.md`, branch `claude/freight-marketplace-pivot-l08445`).
> Última actualización: 2026-10-19

| # | Issue | Prioridad | Dónde se resuelve | Estado |
|---|---|---|---|---|
| 1 | Desvincular a un conductor cancela viajes en curso | Alta | Backend + mobile | Abierto |
| 2 | Avisar antes de que un viaje pase a `VENCIDO` | Media | Backend (push) + mobile | Abierto |

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

## A tener en cuenta (no son issues, son reglas de implementación)

- **Eventos perdidos al reconectar el WebSocket.** Los eventos que se emiten durante un corte no se
  reenvían. Toda pantalla que escucha eventos tiene que volver a pedir el estado por REST al
  reconectar (y al volver la app a primer plano). Aplica a seguimiento en vivo, lista de viajes del
  conductor y viaje activo.
- **Radio de 50 m para iniciar y confirmar paradas:** el valor se va a ajustar. Que el mobile no lo
  tenga hardcodeado; mostrar el mensaje de error que devuelva el backend.
- **Remito con foto:** en desarrollo. Hoy la entrega se confirma por proximidad GPS y se genera el
  remito PDF.
