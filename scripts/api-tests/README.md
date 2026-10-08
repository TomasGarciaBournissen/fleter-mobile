# Pruebas de contrato del backend

`organizaciones.mjs` prueba la capa de identidad de `api.md` (PyMEs, miembros, invitaciones, canje,
choferes y los campos nuevos de `GET /api/auth/me`). No necesita dependencias: alcanza con Node 18 o más.

## Antes de correrlo

- Crea cuentas y PyMEs de prueba que **no se borran**. Correrlo contra el backend local o staging,
  nunca contra la base de producción.
- `FIREBASE_API_KEY` es la Web API key del proyecto Firebase (la misma de `EXPO_PUBLIC_FIREBASE_API_KEY`).
- El canje tiene un límite de 5 intentos cada 15 minutos por IP (no por usuario). Por eso hay dos modos: `principal`
  usa exactamente 5 canjes y `extra` insiste hasta recibir `429` (máximo 60 intentos, porque detrás de
  un proxy con IP de salida rotativa cada intento puede salir por otra IP). Entre uno y otro hay que
  esperar 15 minutos.
- Para el `extra`, el servidor tiene que tener configurado el secreto de invitaciones (si no, todo da `503`).

## Cómo correrlo

```bash
export BASE_URL=http://localhost:3000
export FIREBASE_API_KEY=AIza...
node scripts/api-tests/organizaciones.mjs principal
# esperar 15 minutos
node scripts/api-tests/organizaciones.mjs extra
```

Detrás de un proxy (por ejemplo, en el entorno de Claude Code), sumar `NODE_USE_ENV_PROXY=1` para que
`fetch` de Node use `HTTPS_PROXY`. Si el primer registro da `500` con "Can't reach database server", es
la base de Neon despertando: el script reintenta una vez.

Imprime cada prueba con ✔ o ✘, y al final la lista de las que fallaron con lo que se esperaba y lo
que llegó. Sale con código 1 si alguna falló.

## Qué cubre

| Modo | Pruebas |
| --- | --- |
| `principal` | `GET /me` (huérfano, responsable, miembro, chofer) · crear PyME con todas sus validaciones de CUIT · alta concurrente · ver y editar · permisos de responsable y miembro · invitaciones (formato del código, vencimiento a 72 h, el listado no muestra el código) · canje con minúsculas y espacios, código de un solo uso, código del tipo equivocado (y que no se consuma), chofer ya vinculado · listado y desvinculación de choferes · cambio de roles, regla del último responsable, degradación concurrente · eliminar miembro |
| `extra` | Dos cuentas canjeando el mismo código a la vez · salir de la PyME · chofer que se desvincula solo · código revocado · límite de intentos (`429`, tolera IP rotativa) |

No cubre el `503` por falta del secreto de invitaciones ni el vencimiento real a las 72 h (solo
verifica las fechas que devuelve la API).

## Viaje interno de PyME — `viajes.mjs`

Prueba el ciclo nuevo del viaje (Paso 2 de `api.md`): la PyME crea el viaje con un chofer asignado,
el chofer confirma eligiendo vehículo o rechaza, inicia estando en el origen (50 m, dentro de la
ventana) y pasa directo a `CARGANDO`, cierra con remito; además editar, reasignar, cancelar,
desvincular (cancela sus viajes, incluso en curso) y quién ve qué. Usa 5 canjes.

```bash
ESTADO=/tmp/viajes.json node scripts/api-tests/viajes.mjs principal
# cuando cierra la ventana de inicio (fecha programada + 90 min por default):
ESTADO=/tmp/viajes.json node scripts/api-tests/viajes.mjs vencido
```

`principal` deja dos viajes (uno `ASIGNADO` y uno `CONFIRMADO`) y guarda en `ESTADO` lo necesario
para que `vencido` verifique que pasaron solos a `VENCIDO`. Con `SOCKET_IO_CLIENT=<carpeta con
socket.io-client>` suma las pruebas de eventos WebSocket (detrás de un proxy, con `https-proxy-agent`
en la misma carpeta). La anticipación mínima se detecta sola del mensaje de error del servidor.
