# Fleter Mobile — Flujos del código (para el review)

> Rama `staging`. Estado al 27 oct 2026: fases 0, 1 y 2 programadas; la fase 3 (empresa) está
> diseñada en `prototype/fleter-mobile-fase3-empresa.html` y todavía no tiene código.
> Contrato: `API.md` de la rama `develop` del backend.
> Detalle archivo por archivo (documento vivo): [`docs/ARQUITECTURA.md`](ARQUITECTURA.md).

## 1. Cómo arranca la app

```
App.js
 └ SafeAreaProvider
    └ AuthProvider        ← sesión (Firebase + /api/auth/login + /api/auth/me)
       └ ThemeProvider    ← claro / oscuro (default por rol, preferencia guardada)
          └ SocketProvider ← socket.io con el token de Firebase, mientras hay usuario
             └ RootNavigator ← elige qué stack mostrar
```

- [`App.js`](../App.js): carga las 4 tipografías y registra la tarea de GPS en segundo plano
  (`import './src/tasks/locationTask'`) antes de renderizar. Si las fuentes fallan, sigue con las del sistema.
- [`src/config.js:3`](../src/config.js#L3): `DEV_MODE` está **prendido salvo** que
  `EXPO_PUBLIC_DEV_MODE=false`. En DEV los servicios devuelven datos de ejemplo y no se llama al backend.

### El router por sesión — [`RootNavigator.js:39`](../src/navigation/RootNavigator.js#L39)

| Situación | Stack |
|---|---|
| Sin usuario, o un alta en curso (`altaEnCurso`) | `AuthStack` |
| `CLIENTE` con `organizacion === null` | `OnboardingEmpresaStack` |
| `CLIENTE` con empresa | `PymeStack` (fase 3; ver `docs/ARQUITECTURA.md` §4.14) |
| `CONDUCTOR` | `ConductorStack` |
| `FLETERO` / `GERENTE` | stacks del marketplace, dormidos |
| Otro rol | pantalla «Acceso no disponible» |

No hay navegación manual entre stacks: cambia `user` en el contexto y el router muestra otro stack.
Por eso las pantallas de alta usan `altaEnCurso` para que el router no salte antes de tiempo.

## 2. Sesión — [`AuthContext.js`](../src/context/AuthContext.js)

1. Firebase abre la sesión (email/contraseña o Google) → dispara `onAuthStateChanged`
   ([línea 61](../src/context/AuthContext.js#L61)).
2. `cargarUsuario` ([línea 49](../src/context/AuthContext.js#L49)): `POST /api/auth/login` (confirma que
   existe en la base) + `GET /api/auth/me` (suma `organizacion` del CLIENTE u `organizaciones` del CONDUCTOR).
   Si `/me` falla, sigue con lo de `/login`.
3. Si `/login` da **404** (cuenta de Google sin registro en Fleter) se cierra Firebase y se muestra
   `errorSesion` en el login ([línea 69](../src/context/AuthContext.js#L69)).
4. `refrescarUsuario` ([línea 84](../src/context/AuthContext.js#L84)) se llama después de crear la empresa
   o canjear un código: vuelve a pedir el perfil y, con eso, el router cambia de stack.

**Tokens:** [`api.js`](../src/services/api.js#L14) pide el ID token de Firebase en **cada** request
(Firebase lo renueva solo). [`socket.js:11`](../src/services/socket.js#L11) lo pide **una vez** al conectar.

## 3. Flujo de entrada y alta (fase 1) — [`AuthStack.js`](../src/navigation/AuthStack.js)

```
Splash ─► Login ──(email/Google)──► onAuthStateChanged ─► router
            ├─► RecuperarContrasena (sendPasswordResetEmail, reenvío con cuenta regresiva)
            └─► TipoCuenta ─┬─ Empresa ─► RegistroEmpresa
                            └─ Conductor ─► RegistroConductor ─► LicenciaConductor ─► VehiculoConductor
                                                                     ─► CodigoConductor ─► ConductorListo
```

**Empresa**
- `TipoCuenta` guarda `rolEnAlta` (define el tema del alta: el conductor la ve en oscuro).
- `RegistroEmpresa` → `registroCliente()` ([`auth.js`](../src/services/auth.js)): `POST /api/auth/registro-cliente`
  y después `signInWithEmailAndPassword`. Con la sesión abierta y `organizacion: null`, el router muestra
  `OnboardingEmpresaStack`. Los errores de email/DNI del backend se pegan al campo correspondiente.
- [`OnboardingEmpresaStack`](../src/navigation/OnboardingEmpresaStack.js): `SinEmpresa` → elegir
  - **Registrar** → `CrearEmpresa` (`POST /api/organizaciones`, CUIT validado) → `EmpresaRegistrada`
    → «Empezar» llama `refrescarUsuario` → router → stack de empresa.
  - **Tengo un código** → `CodigoMiembro` (`POST /api/invitaciones/canjear`) → `refrescarUsuario`.

**Conductor**
- `RegistroConductor` y `LicenciaConductor` solo juntan datos y los pasan por `route.params`
  (todavía no se crea nada).
- `VehiculoConductor` ([`VehiculoConductorScreen.js:21`](../src/screens/auth/VehiculoConductorScreen.js#L21)) es
  donde se crea la cuenta:
  1. `setAltaEnCurso(true)` para que el router no salte al stack del conductor.
  2. `registroConductor()` → `POST /api/auth/registro-conductor` + login de Firebase.
  3. Si cargó vehículo, `crearVehiculoPropio()`. Si la cuenta se creó pero el vehículo falló, el
     reintento **no** vuelve a crear la cuenta (`cuentaCreada`).
  4. `navigation.reset` a `CodigoConductor`.
- `CodigoConductor`: canjea el código de la empresa (o «Lo hago después»).
- `ConductorListo` ([línea 27](../src/screens/auth/ConductorListoScreen.js#L27)): `refrescarUsuario()` y
  `setAltaEnCurso(false)` → el router muestra `ConductorStack`.

## 4. Flujo del conductor (fase 2) — [`ConductorStack.js`](../src/navigation/ConductorStack.js)

Pestañas: **Viajes · Historial · Perfil**. Las pantallas de un viaje van encima de las pestañas.
El conductor **nunca ve el precio** (ningún componente de `components/viaje/` lo muestra).

### Ciclo del viaje

```
ASIGNADO ──confirmar(vehículo)──► CONFIRMADO ──iniciar (en el origen)──► CARGANDO
   │                                                                      │ salir
   └─rechazar─► RECHAZADO                                                  ▼
                            DESCARGANDO ◄──llegué a la parada── EN_RUTA ◄──┘
                                 │ salir (si es la última) ─► FINALIZADO (remito)
  Finales sin hacerse: RECHAZADO · VENCIDO (no confirmó / no inició a tiempo) · CANCELADO
```

Etiquetas y colores por estado: [`utils/estados.js`](../src/utils/estados.js).

| Pantalla | Qué hace | Backend |
|---|---|---|
| [`ViajesScreen`](../src/screens/conductor/ViajesScreen.js) | Viaje en curso fijo arriba; después «Para confirmar», «Hoy», «Próximos» | `GET /api/choferes/viajes` |
| [`DetalleViajeScreen`](../src/screens/conductor/DetalleViajeScreen.js) | Confirmar (hoja de vehículos aptos; con uno solo, directo) o rechazar | `POST …/confirmar`, `…/rechazar` |
| [`ViajeActivoScreen`](../src/screens/conductor/ViajeActivoScreen.js) | Una acción grande según el estado: Iniciar / Llegué / Salir; cancelar | `…/iniciar`, `/api/viajes/:id/confirmar-parada`, `…/salir`, `…/cancelar` |
| [`ViajeTerminadoScreen`](../src/screens/conductor/ViajeTerminadoScreen.js) | Estimado vs. real (tiempos, km) y remito | `GET …/viajes/:id` |
| [`HistorialScreen`](../src/screens/conductor/HistorialScreen.js) | Viajes finales agrupados por mes, con filtros | `?grupo=historial` |
| [`PerfilScreen`](../src/screens/conductor/PerfilScreen.js) | Sus empresas, sus vehículos, apariencia, cerrar sesión | `mis-organizaciones`, `mis-vehiculos` |
| `EmpresaConductor` / `SumarEmpresa` / `NuevoVehiculo` | Desvincularse, canjear otro código, agregar vehículo | `DELETE mis-organizaciones/:id`, `canjear`, vehículos |

Todas las llamadas están en [`services/viajesConductor.js`](../src/services/viajesConductor.js), con su mock al final.

**Acciones del viaje activo.** `ejecutar()` ([`ViajeActivoScreen.js:71`](../src/screens/conductor/ViajeActivoScreen.js#L71))
envuelve cada acción: llama al backend, si responde `FINALIZADO` va al cierre, si falla muestra el mensaje
**del backend** tal cual (por ejemplo «estás a más de 50 m») y ante un `409` recarga el viaje.
Iniciar y «Llegué» mandan la posición precisa del momento (`gps.posicionActual()`). La app no valida
distancias ni ventanas: lo decide el backend.

### GPS — [`useGpsViaje.js`](../src/hooks/useGpsViaje.js) + [`tasks/locationTask.js`](../src/tasks/locationTask.js)

- Antes del pedido del sistema, una pantalla explica para qué es el permiso
  ([`ViajeActivoScreen.js:117`](../src/screens/conductor/ViajeActivoScreen.js#L117)). Se pide primero el de primer
  plano y después «Permitir siempre».
- La posición en pantalla se sigue con `watchPositionAsync` (cada 3 s / 5 m).
- **Compartir con la empresa** arranca solo con el viaje en curso (`compartir = EN_CURSO`, o sea después
  del 200 de `/iniciar`) ([línea 48](../src/hooks/useGpsViaje.js#L48)): tarea en segundo plano cada 15 s que emite
  `conductor:ubicacion` por el socket. Si la tarea no arranca, emite desde primer plano cada 15 s.
- Se apaga al salir de la pantalla o cuando el viaje deja de estar en curso.

### Tiempo real — [`useEnVivo.js`](../src/hooks/useEnVivo.js)

El socket **solo avisa** que algo cambió; el REST es la fuente de verdad. El hook vuelve a pedir los datos cuando:
llega un evento (filtrable por `id_viaje`), el socket se reconecta, o la app vuelve a primer plano.
Así no se pierde nada si hubo un corte (los eventos no se reenvían).

## 5. Piezas compartidas

- **Kit de UI** — [`src/components/ui/`](../src/components/ui/index.js): `Pantalla` (zona segura, scroll, pie fijo para
  la acción principal, volver), `Boton` (primario / borde / fantasma / peligro), `Campo`, `CampoCodigo`, `Opcion`,
  `HojaInferior`, `HojaCalendario`, `Nota` (gris por defecto), `Pasos`, `Chip`, textos.
- **Tema** — [`ThemeContext.js`](../src/context/ThemeContext.js): `useThemedStyles(createStyles)` recalcula los estilos
  solo cuando cambia la paleta. Ningún color fijo en pantallas: todo sale de [`theme.js`](../src/theme.js).
  La preferencia (Claro / Oscuro / Sistema) se guarda en AsyncStorage; sin preferencia, conductor oscuro y empresa clara.
- **Viaje** — [`src/components/viaje/`](../src/components/viaje/): `ChipEstado`, `Recorrido`, `DatosViaje`
  («A confirmar» si falta un dato), `TarjetaViaje`, `MapaRecorrido` (en web es un recuadro:
  [`MapViewWrapper.web.js`](../src/components/MapViewWrapper.web.js)).
- **Utilidades** — `fechas.js` (formatos es-AR), `formularios.js` (DNI, CUIT, patente, código),
  `errores.js` (`mensajeDeError`: el texto del backend o uno genérico), `ventana.js` (ventana de inicio).

## 6. Puntos para discutir en el review

Riesgos reales, de mayor a menor:

1. **`DEV_MODE` prendido por defecto** ([`config.js:3`](../src/config.js#L3)). Un build sin
   `EXPO_PUBLIC_DEV_MODE=false` sale con datos de ejemplo. Conviene invertirlo (prendido solo con `=true`)
   o fallar el build de producción si no está definido.
2. **La sesión no sobrevive a cerrar la app**: Firebase usa `inMemoryPersistence`
   ([`firebase.js:26`](../src/services/firebase.js#L26)) para andar en Expo Go. Para el build nativo hay que pasar a
   una persistencia segura. CLAUDE.md pide Keychain para los tokens; hoy no se guarda ningún token a mano.
3. **Token del socket**: se pide una sola vez al conectar ([`socket.js:11`](../src/services/socket.js#L11)). El ID
   token de Firebase vence a la hora; si el socket se reconecta después, usa el token viejo. Hay que pasar
   `auth` como función para que lo renueve en cada intento.
4. **GPS con la app cerrada**: la tarea de segundo plano emite con una función guardada en memoria
   ([`locationTask.js:9`](../src/tasks/locationTask.js#L9)). Si el sistema mata la app, la tarea despierta sin
   socket ni emisor y no manda nada. Para viajes largos hace falta mandar la ubicación por REST desde la
   tarea (o reconectar ahí). Probar en un teléfono real.
5. **Ventana de inicio fija** en el mobile (−60 / +90 min, [`ventana.js`](../src/utils/ventana.js)). Es solo para
   mostrar; decide el backend. Pedido abierto: ISSUES.md #3.
6. **La empresa ya usa `PymeStack`** (fase 3); el `ClienteStack` del marketplace quedó sin uso.
7. **Filtrado de vehículos aptos en el mobile** ([`DetalleViajeScreen.js:58`](../src/screens/conductor/DetalleViajeScreen.js#L58)):
   compara condiciones para ofrecer solo los que sirven. El backend igual valida al confirmar.
8. **Sin tests automáticos**. Lo probado: recorridos completos en Expo web con datos de ejemplo, en los dos
   temas. Falta contra el backend de staging y en un teléfono.
9. **Código del marketplace archivado** (`screens/cliente`, `fletero`, `gerente`, `auth/_marketplace`): no está en
   uso (desde la fase 3 tampoco `ClienteStack`); borrarlo es decisión del dueño.

Issues de producto y de contrato ya anotados: [`ISSUES.md`](../ISSUES.md) (#1 desvincular cancela viajes en curso,
#2 aviso antes de vencer, #3 eventos que no le llegan al conductor, #4 historial de alertas).

## 7. Cómo probarlo

```bash
npm install
npx expo start --web          # DEV_MODE prendido: datos de ejemplo, sin backend
```
En el login, en DEV: un email con «conductor» o «martin» entra como conductor; cualquier otro, como empresa.
Para staging: `.env` con `EXPO_PUBLIC_DEV_MODE=false`, `EXPO_PUBLIC_API_URL` y las claves de Firebase.
El socket se conecta a la misma `EXPO_PUBLIC_API_URL` (la variable `EXPO_PUBLIC_SOCKET_URL` que nombra
PROGRESO.md no se usa).
