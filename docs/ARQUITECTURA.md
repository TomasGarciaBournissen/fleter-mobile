# Fleter Mobile — Arquitectura y archivos

> **Documento vivo.** Se actualiza en el mismo commit que cualquier cambio de código que agregue, borre o
> cambie la responsabilidad de un archivo, un endpoint, un evento o un flujo (regla en `CLAUDE.md`).
> Última actualización: 29 oct 2026 · rama `staging` · fases 0, 1, 2 y 3 programadas (la 4 es el cierre).
>
> Otros documentos: `PROGRESO.md` (estado y commits), `ISSUES.md` (problemas abiertos con el backend),
> `docs/FLUJOS_MOBILE.md` (resumen para el review), `UXUI.md` (sistema de diseño), `API.md` del backend
> en la rama `develop` (contrato).

## Índice
1. [Qué es la app](#1-qué-es-la-app)
2. [Mapa de carpetas](#2-mapa-de-carpetas)
3. [Cómo se conectan las piezas](#3-cómo-se-conectan-las-piezas)
4. [Archivo por archivo](#4-archivo-por-archivo)
5. [Flujos de punta a punta](#5-flujos-de-punta-a-punta)
6. [Endpoints y eventos que usa la app](#6-endpoints-y-eventos-que-usa-la-app)
7. [Reglas para escribir código nuevo](#7-reglas-para-escribir-código-nuevo)
8. [Código heredado del marketplace](#8-código-heredado-del-marketplace)
9. [Cómo se cumple el plan, fase por fase](#9-cómo-se-cumple-el-plan-fase-por-fase)
10. [Registro de cambios de este documento](#10-registro-de-cambios-de-este-documento)

---

## 1. Qué es la app

App de React Native + Expo (SDK 54) para iOS, Android y web. Herramienta B2B: una **empresa** carga viajes y se
los asigna a sus **conductores** de confianza; el conductor los confirma, los hace parada por parada con GPS y
los cierra con un remito.

Tres principios que explican casi todas las decisiones del código:

- **El backend decide todo.** Precios, distancias, tiempos, ventanas de inicio, radio de 50 m y validaciones viven
  en el backend. La app manda datos (acciones, posición) y muestra lo que vuelve.
- **La sesión elige la pantalla.** No hay navegación manual entre las zonas de la app: cuando cambia el usuario en
  el contexto, el router muestra otro stack.
- **REST es la fuente de verdad.** El socket solo avisa que algo cambió; la pantalla vuelve a pedir los datos.

## 2. Mapa de carpetas

```
App.js                     entrada: fuentes, providers, tarea de GPS
src/
  config.js                DEV_MODE
  theme.js                 paletas clara y oscura, tipografías, escalas
  context/                 estado global (sesión, tema, socket, empresa y alertas)
  navigation/              router y stacks
  services/                todas las llamadas al backend y a Firebase
  hooks/                   lógica reutilizable (tiempo real, GPS)
  tasks/                   tarea de ubicación en segundo plano
  utils/                   funciones puras (fechas, formatos, estados, errores)
  components/
    ui/                    kit del sistema Fleter (botones, campos, hojas…)
    viaje/                 piezas de un viaje (estado, recorrido, tarjeta, mapa)
    empresa/               piezas del lado de la empresa (tarjeta con precio, tabla de paradas, hojas)
    *.js                   componentes sueltos (isotipo, mapa, formulario de vehículo…)
  screens/
    auth/                  entrada y alta (fase 1)
    onboarding/            cuenta de empresa sin empresa (fase 1)
    conductor/             app del conductor (fase 2)
    empresa/               app de la empresa (fase 3)
    cliente/ fletero/ gerente/ auth/_marketplace/   heredado, ver sección 8
  mocks/                   stubs de Firebase nativo para web / Expo Go
prototype/                 prototipos HTML aprobados por fase
docs/                      documentación
```

## 3. Cómo se conectan las piezas

```
App.js
 └ SafeAreaProvider
    └ AuthProvider ─────────── user, altaEnCurso, refrescarUsuario, logout
       └ ThemeProvider ─────── lee user.rol / rolEnAlta → colors, isDark, setMode
          └ SocketProvider ─── lee user → conecta/desconecta socket.io
             └ RootNavigator ─ lee user + altaEnCurso → elige el stack
                 ├ AuthStack ─────────────── screens/auth
                 ├ OnboardingEmpresaStack ── screens/onboarding
                 ├ PymeStack ─────────────── EmpresaProvider (idOrg, rol, alertas) → screens/empresa
                 └ ConductorStack ────────── screens/conductor

Pantalla ──usa──► services/*  ──axios──► api.js (token de Firebase) ──► backend REST
   │                                                        ▲
   ├──usa──► hooks/useEnVivo ──escucha──► socket ───────────┘ (solo avisa; se vuelve a pedir por REST)
   ├──usa──► hooks/useGpsViaje ──► expo-location + tasks/locationTask ──emite──► socket
   └──arma con──► components/ui + components/viaje + utils/*  (estilos desde useThemedStyles)
```

Dependencias entre capas (de arriba hacia abajo, nunca al revés):

| Capa | Puede usar | No usa |
|---|---|---|
| `screens/` | `components/`, `hooks/`, `services/`, `utils/`, `context/` | axios directo, colores fijos |
| `components/` | `components/ui`, `utils/`, `context/ThemeContext` | `services/` (salvo `FormVehiculo`, que lee las listas de `vehiculos.js`) |
| `hooks/` | `context/`, `services/`, `tasks/` | pantallas |
| `services/` | `api.js`, `firebase.js`, `config.js`, `utils/` | React |
| `utils/` | nada del proyecto (funciones puras) | React, red |

## 4. Archivo por archivo

### 4.1 Entrada y configuración

**`App.js`** — Carga las cuatro familias tipográficas (Archivo Black, Manrope, JetBrains Mono, Josefin Sans)
con `useFonts`; si fallan, sigue con las del sistema. Importa `src/tasks/locationTask` **antes** de renderizar,
porque `TaskManager.defineTask` tiene que correr a nivel de módulo. Arma el árbol de providers de la sección 3.

**`src/config.js`** — Exporta `DEV_MODE = EXPO_PUBLIC_DEV_MODE !== 'false'`. Con DEV_MODE prendido no se usa
Firebase ni el backend: cada servicio devuelve datos de ejemplo, el login entra sin contraseña (un email con
«conductor» o «martin» entra como conductor) y el GPS usa una posición fija. ⚠️ Está prendido por defecto; ver
`docs/FLUJOS_MOBILE.md` §6.

**`app.json` / `package.json`** — Configuración de Expo (permisos de ubicación, ícono, splash) y dependencias.
`package.json` redirige `@react-native-firebase/*` a `src/mocks/` para que el código heredado compile en web.

**`src/theme.js`** — Única fuente de colores. `palettes.light` y `palettes.dark` tienen las mismas claves:
fondos (`bg`, `surface`, `surface2`, `surface3`), bordes (`line`, `lineStrong`), tintas (`ink`…`ink4`, `onInk`),
naranja (`accent`, `accentPress`, `accentInk` para texto, `accentSoft`, `onAccent` = tinta sobre naranja),
estados (`success`/`warning`/`error`/`info` en base, ink y soft) y `scrim`. `conAliases()` suma los nombres
viejos (`background`, `textPrimary`, `primary`…) para el código heredado. También exporta `fonts` (roles fijos),
`fontSize`, `spacing` y `radius`. El export `colors` (paleta clara fija) es solo para código no migrado.

### 4.2 Contextos (`src/context/`)

**`AuthContext.js`** — La sesión.
- Estado: `user`, `loading`, `errorSesion`, `altaEnCurso`, `rolEnAlta`.
- `onAuthStateChanged` de Firebase → `cargarUsuario()`: `POST /api/auth/login` (confirma que existe en la base)
  más `GET /api/auth/me` (suma `organizacion` del CLIENTE u `organizaciones` del CONDUCTOR). Si `/me` falla,
  queda lo de `/login`.
- 404 en `/login` = cuenta sin registro en Fleter (típico con Google): cierra Firebase y llena `errorSesion`.
- `refrescarUsuario()`: vuelve a pedir el perfil; se usa después de crear la empresa o canjear un código.
- `altaEnCurso`: mientras está en `true`, el router deja montado el `AuthStack` aunque haya sesión.
- `rolEnAlta`: rol elegido en «Tipo de cuenta», antes de tener sesión; define el tema del alta.
- `mockLogin(rol)` y `DEV_USERS`: usuarios de prueba para DEV_MODE. `DEV_ROL` permite arrancar logueado.
- `logout()`: cierra Firebase y limpia todo.

**`ThemeContext.js`** — El tema.
- Lee la preferencia guardada en AsyncStorage (`@fleter/apariencia`: `light` | `dark` | `system`).
- Sin preferencia: conductor oscuro, todos los demás claro (usa `user.rol` o `rolEnAlta`).
- `useTheme()` → `{ colors, isDark, mode, setMode }`.
- `useThemedStyles(createStyles)`: memoriza `createStyles(colors)`, así los `StyleSheet` se recalculan solo cuando
  cambia la paleta. Toda pantalla nueva arma sus estilos así.

**`SocketContext.js`** — Conecta socket.io cuando hay `user` y lo desconecta cuando no. Expone `{ socket }`
solo cuando está conectado (en `disconnect` vuelve a `null`). Lo consumen `useEnVivo`, `useGpsViaje`,
`EmpresaContext` y las pantallas de seguimiento de la empresa. Una cuenta `CLIENTE` entra sola a la sala
`organizacion:{id}` de su empresa (lo hace el backend al conectar).

**`EmpresaContext.js`** — Estado compartido del lado de la empresa (lo monta `PymeStack`).
- `idOrg`, `organizacion` (de `user.organizacion`) y `esResponsable` (`rol === 'RESPONSABLE'`).
- `viajes` + `recargar()`: la lista de viajes de la empresa (`GET /organizaciones/:id/viajes`), que se vuelve a
  pedir con los eventos del viaje (`useEnVivo`), al reconectar y al volver al frente. Inicio y Más la leen de acá.
- `pendientes` («Para resolver», contador de la pestaña Alertas): se **deriva del REST**, así sobrevive a cortes y
  reinicios: rechazados que todavía se pueden reasignar, sin confirmar a menos de 24 h del fin de su ventana, y
  viajes con `cierre.cierre_manual_habilitado` (el conductor no tocó «Salir»). Cuando se resuelven, salen solos.
- `hoy` («Hoy» en Alertas): avisos del socket (`alerta:desvio`, `alerta:parada`, `viaje:confirmado`,
  `viaje:vencido`, `viaje:cancelado` del conductor, `viaje:finalizado`, `parada:salida_detectada` y la salida tarde
  que se arma al recibir `viaje:estado_cambiado` → `EN_RUTA`). No hay historial de alertas en el backend
  (ISSUES.md #4): viven en memoria. `marcarVistas()` saca el punto de «nueva».
- `resolverRechazo(idViaje)`: un rechazado ya reasignado deja de pedir acción (se guarda en AsyncStorage,
  `@fleter/rechazos-resueltos`; no es un dato sensible).
- En DEV arranca con avisos de ejemplo (`mock.alertasDelDia()`), porque no hay socket.

### 4.3 Navegación (`src/navigation/`)

**`RootNavigator.js`** — Muestra el `SplashScreen` hasta que termina la animación **y** se resolvió la sesión.
Después, `Stacks()` elige:

| Condición | Stack |
|---|---|
| sin `user` o `altaEnCurso` | `AuthStack` |
| `CLIENTE` con `organizacion === null` | `OnboardingEmpresaStack` |
| `CLIENTE` con empresa | `PymeStack` (fase 3) |
| `CONDUCTOR` | `ConductorStack` |
| `FLETERO` / `GERENTE` | stacks heredados |
| otro rol | «Acceso no disponible» (solo web) |

También arma el tema de React Navigation desde la paleta activa, para que no haya destellos blancos.

**`AuthStack.js`** — Login, RecuperarContrasena, TipoCuenta, RegistroEmpresa, RegistroConductor,
LicenciaConductor, VehiculoConductor, CodigoConductor, ConductorListo. Sin encabezado nativo.

**`OnboardingEmpresaStack.js`** — SinEmpresa, CrearEmpresa, CodigoMiembro, EmpresaRegistrada.

**`ConductorStack.js`** — Un stack con las pestañas (`Pestanas`: Viajes, Historial, Perfil) y, encima, las
pantallas de un viaje y del perfil (DetalleViaje, ViajeActivo, ViajeTerminado, EmpresaConductor, SumarEmpresa,
NuevoVehiculo), que se abren sin barra de pestañas. Pestaña activa: ícono naranja y texto en tinta.

**`PymeStack.js`** — La app de la empresa, envuelta en `EmpresaProvider`. Pestañas (prototipo de la fase 3,
variante B aprobada): **Inicio · Viajes · Nuevo · Alertas · Más**. «Nuevo» es un botón naranja que no tiene
pantalla propia: su `tabPress` abre `NuevoViaje` sobre las pestañas. «Alertas» muestra un contador rojo con
`pendientes.length`. Encima de las pestañas, sin barra: NuevoViaje, Viaje, Conductores, Conductor, Invitar,
Lugares, Lugar, Series, Serie, Equipo, DatosEmpresa, MisDatos. Mismo estilo de pestaña que el conductor.

### 4.4 Servicios (`src/services/`)

Toda llamada al backend o a Firebase pasa por acá. Cada función tiene su rama `if (DEV_MODE)` con datos de ejemplo.

**`api.js`** — Instancia de axios con `baseURL = EXPO_PUBLIC_API_URL` y timeout de 30 s. Un interceptor pide el
ID token de Firebase en **cada** request (`getIdToken()`; Firebase lo renueva solo) y lo manda como `Bearer`.

**`firebase.js`** — Inicializa Firebase con las variables `EXPO_PUBLIC_FIREBASE_*` (en DEV, con una clave falsa
para que no falle). Usa `inMemoryPersistence`: la sesión no sobrevive a cerrar la app (pendiente para el build nativo).

**`auth.js`** — `loginEmail`, `loginGoogle(idToken)`, `recuperarContrasena`, `registroCliente`,
`registroConductor` (los dos registran en el backend y después abren sesión en Firebase), `obtenerPerfil`
(`/api/auth/me`), `logout`. `registroGerente` es heredado.

**`google.js`** — `useGoogleLogin({ onError })`: hook que abre el selector de Google con `expo-auth-session`, recibe
el `id_token` y llama a `loginGoogle`. `GOOGLE_CONFIGURADO` es `false` mientras no estén los client IDs
(`EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`); el botón lo avisa.

**`organizaciones.js`** — `crearOrganizacion` (`POST /api/organizaciones`, CUIT solo dígitos) y
`canjearCodigo` (`POST /api/invitaciones/canjear`; mismo endpoint para miembro y para conductor).

**`vehiculos.js`** — Listas `TIPOS_VEHICULO` (utilitario, camión chico, camión grande; texto libre en el backend)
y `CONDICIONES` (frágil, refrigerado, carga pesada, peligroso, voluminoso). `crearVehiculoPropio` →
`POST /api/conductores/mis-vehiculos`.

**`viajesConductor.js`** — Todo el viaje del lado del conductor: `listarViajes`, `obtenerViaje`,
`confirmarViaje(id, idVehiculo)`, `rechazarViaje`, `cancelarViaje`, `iniciarViaje(id, {lat, lng})`,
`salirDeParada`, `confirmarLlegada(id, idParada, {lat, lng})`, `misVehiculos`, `misOrganizaciones`,
`desvincularme`. Al final está el `mock`: cinco viajes de ejemplo en memoria que las acciones modifican, así el
recorrido completo se puede probar sin backend.

**`viajesEmpresa.js`** — Los viajes del lado de la empresa, todos bajo `/api/organizaciones/:id`:
`listarViajes(idOrg, { grupo | estado })`, `obtenerViaje`, `estimarViaje` (`POST /api/viajes/estimar-costo`: precio,
`estimado` y `tramos` con la hora de cada parada; acá las paradas van solo con coordenadas), `crearViaje`,
`editarViaje` (solo ASIGNADO o CONFIRMADO), `reasignarViaje`, `cancelarViaje(motivo)` (también en curso),
`finalizarViaje` (cierre a mano de la Tarea 5), `obtenerRemito`. `paradaParaApi(p)` manda un lugar guardado como
`{ id_lugar }` y una dirección suelta como `{ lat, lng, direccion }`. `asignarRechazadoA(idOrg, viaje, idConductor)`:
un RECHAZADO es final y `reasignar` no lo acepta, así que «Asignar a otro conductor» **crea un viaje nuevo** con el
mismo recorrido, hora, condiciones y nota. Series: `crearSerie`, `listarSeries`, `obtenerSerie`, `cancelarSerie`.
`vivoDeEjemplo(viaje)`: en DEV, posición, llegada y desvío de ejemplo para el seguimiento (con backend llegan solo
por socket).

**`empresa.js`** — La organización y su gente: `obtenerOrganizacion` / `editarOrganizacion` (solo responsable;
razón social y dirección vacías van como `null`), `listarMiembros`, `cambiarRol`, `eliminarMiembro`,
`salirDeEmpresa`, `crearInvitacion(idOrg, 'CHOFER' | 'MIEMBRO')` (el `codigo` viene **solo** en esa respuesta),
`listarInvitaciones`, `revocarInvitacion`, `listarConductores` (con sus vehículos), `desvincularConductor`
(devuelve `viajes_cancelados` y `series_borradas`), lugares guardados (`listarLugares`, `guardarLugar` crea o
edita, `borrarLugar`) y `editarPerfil` (`PUT /api/auth/perfil`).

**`mockEmpresa.js`** — El backend de mentira de DEV para la empresa: Distribuidora Norte con 3 conductores
(Martín, Juan, Lucía), 3 personas en el equipo, 4 lugares, 2 series y viajes en todos los estados (uno en ruta
con salida tarde, sin confirmar, confirmado, rechazado, entregados, cancelado, vencido), con horas relativas a
ahora. Las acciones lo modifican (crear, editar, reasignar, cancelar, series, desvincular) y validan lo mismo que
el contrato (10 paradas, vehículo compatible, 30 días, nombre de lugar único). Sus precios son inventados: con
backend los calcula el servidor.

**`direcciones.js`** — Búsqueda de direcciones con Google Places (API v1, la misma que usaba
`LocationPickerModal`): `buscarDirecciones(texto)` → sugerencias, `resolverDireccion(sug)` → `{ direccion, lat, lng }`.
Sin `EXPO_PUBLIC_GOOGLE_PLACES_KEY`, en DEV busca en una lista de ejemplo.

**`socket.js`** — `conectarSocket()` abre socket.io contra `EXPO_PUBLIC_API_URL` con el token de Firebase
(se pide **una vez**, al conectar), solo transporte websocket. `getSocket`, `desconectarSocket`.

### 4.5 Hooks (`src/hooks/`)

**`useEnVivo(eventos, recargar, { filtro })`** — Llama a `recargar()` cuando llega alguno de los `eventos` del
socket (opcionalmente filtrado, por ejemplo por `id_viaje`), cuando el socket se reconecta y cuando la app vuelve
a primer plano. Guarda `recargar` en un `ref` para no re-suscribirse en cada render.

**`useGpsViaje(idViaje, { compartir })`** — Devuelve `{ posicion, permiso, pedirPermiso, posicionActual, compartiendo }`.
- Consulta el permiso al entrar; `pedirPermiso()` pide primer plano y después «Permitir siempre».
- Sigue la posición en pantalla con `watchPositionAsync` (cada 3 s o 5 m).
- Con `compartir` en `true` (el viaje está en curso), arranca la tarea de segundo plano y emite
  `conductor:ubicacion` cada 15 s; si la tarea no arranca, emite desde primer plano con un intervalo.
- `posicionActual()`: lectura precisa para iniciar o confirmar una parada.
- En DEV, posición fija en el origen de los viajes de ejemplo.

**`useMiEmpresa.js`** — Heredado del marketplace (`/api/empresas/mias`). No lo usa ninguna pantalla nueva.

### 4.6 Tareas (`src/tasks/`)

**`locationTask.js`** — Define la tarea `conductor-ubicacion` con `TaskManager`. `startLocationTracking()` pide
actualizaciones cada 15 s con servicio en primer plano (la notificación de Android «Fleter: viaje en curso»).
La función que emite se registra en memoria con `setLocationEmitter`; si el sistema mata la app, la tarea no la tiene
y no emite (pendiente).

### 4.7 Utilidades (`src/utils/`)

| Archivo | Qué hace |
|---|---|
| `estados.js` | `ESTADOS`: etiqueta y familia de color de cada estado del viaje; `EN_CURSO`, `FINALES`; `coloresFamilia(familia, colors)`; `motivoFinal(viaje)` (por qué terminó sin hacerse, contado al conductor) y `motivoFinalEmpresa(viaje)` (lo mismo, contado a la empresa: «Lucía lo rechazó»). |
| `fechas.js` | Formatos es-AR: `hora` (14:30), `diaCorto` (mié 22 oct), `cuando` (Hoy, 14:30), `cuandoLargo` (Hoy / Mañana / Ayer, mié 28 oct, 09:00), `mesAnio`, `mesAlta`, `duracionMin`/`duracionHoras` (1 h 20 min), `transcurrido` (cronómetro), `km`. Lo que falta devuelve «A confirmar». |
| `formularios.js` | Formato al tipear y limpieza para la API: DNI, CUIT, código de invitación (XXXXX-XXXXX), patente (AE 421 KL), email, fecha corta. El backend vuelve a validar. |
| `errores.js` | `mensajeDeError(err, porDefecto)`: traduce códigos de Firebase y mensajes del backend a texto en voseo; los 400 del backend se muestran tal cual. Ninguna pantalla muestra códigos técnicos. |
| `ventana.js` | Ventana de inicio de referencia (−60 / +90 min de `fecha_programada`). Solo para mostrar (ISSUES #3). |
| `dinero.js` | `pesos(v)`: precio es-AR ($12.500, sin decimales). Solo del lado de la empresa (fase 3); el conductor nunca ve precios. |
| `series.js` | Viajes repetidos (fase 3): `FRECUENCIAS`, `LETRAS_DIAS`, `DIAS_MAXIMOS_SERIE` (30), `textoFrecuencia(serie)` («Lun, mié y vie a las 07:00»), `etiquetaFrecuencia(serie)` (marca corta de las cards: «Diario», «L, M y V»), `contarViajes(...)` (aviso previo; el número real lo da el backend), `fechaIso`/`desdeIso`, `diaSemanaIso` (1 = lunes). |
| `format.js`, `vehiculo.js` | Heredados del marketplace; sin uso en las fases nuevas. |

### 4.8 Kit de UI (`src/components/ui/`)

Todo se importa desde `components/ui` (`index.js`). Usarlos antes de crear estilos nuevos.

| Componente | Para qué |
|---|---|
| `Pantalla` | Esqueleto de toda pantalla: zona segura, barra de estado del tema, scroll, botón de volver (`onVolver`), algo a la derecha (`derecha`), pie fijo para la acción principal (`pie`, `pieConLinea`), `refreshControl`. |
| `Boton` | Variantes `primario` (naranja, texto en tinta; uno por vista), `borde`, `fantasma`, `peligro`. Props `cargando`, `deshabilitado`, `icono`. |
| `Campo` | Campo con label arriba, foco naranja con halo, `hint`, `error` (texto o `true` para solo marcar el borde), `secreto` (ojito), `mono` (solo con valor cargado), `icono`, y modo selector con `onPress`. Con `editable={false}` se ve como dato fijo (fondo `surface2`). |
| `CampoCodigo` | Código de invitación grande, se formatea solo y tiene botón «Pegar». |
| `Opcion` | Tarjeta de opción única (tipo de cuenta, tipo de vehículo). |
| `HojaInferior` | Hoja desde abajo para elegir o confirmar algo que no se deshace. |
| `HojaCalendario` | Calendario propio (sin picker nativo), semana desde el lunes, `minimo`. |
| `HojaHora` | Hora en franjas de 15 min con grilla propia (sin picker nativo); `desde` apaga las que ya pasaron. Fase 3. |
| `Listas.js` | Fase 3. `Lista` (caja con filas separadas por línea), `Fila` (izquierda, título, bajada, chevron o acción en texto; sin `onPress` es una vista, así la acción de adentro se puede tocar), `Avatar` (iniciales o ícono, 36×36), `Seccion` (título en Archivo Black 14 + nota), `Vacio` (estado vacío con ícono, título y qué va a aparecer), `Filtros` (opción única: Activos / En curso / Terminados), `iniciales()`. |
| `IsotipoAnimado` | El isotipo se estiba caja por caja; respeta «reducir movimiento». Splash y cierres. |
| `Texto.js` | `Titulo`, `Bajada`, `Meta`, `Etiqueta`, `Eslogan`, `Enlace`. |
| `Varios.js` | `Marca`, `Pasos`, `Nota` (gris por defecto; `aviso`, `error`, `ok`), `Chip`, `Separador`, `ProximosPasos`, `Pastilla` (`aviso`, `info`, `ok`, `error`, `neutra`: rol de una persona, estado de una serie). |

### 4.9 Componentes del viaje (`src/components/viaje/`)

| Componente | Para qué |
|---|---|
| `ChipEstado` | Badge del estado con los colores de su familia; los estados en curso tienen un punto que late. |
| `Recorrido` | Lista de paradas con los marcadores del sistema (origen naranja, parada gris, destino cuadrado). Las hechas en verde con horas reales; la actual resaltada. `partirDireccion()` separa calle y localidad. |
| `DatosViaje` | Grilla de dato y valor en dos columnas («A confirmar» si falta). `datosBasicos(v)` arma condiciones, distancia y tiempo **sin precio**. |
| `TarjetaViaje` | Card de viaje del conductor, compacta (una línea con todo) o completa (recorrido y datos). Nunca muestra precio. |
| `MapaRecorrido` | Mapa con la ruta planeada (o las paradas unidas), marcadores y la posición del conductor. |

### 4.9 bis Componentes de la empresa (`src/components/empresa/`)

| Componente | Para qué |
|---|---|
| `TarjetaViajeEmpresa` | Card de viaje de la empresa con los **9 datos y el precio** (`pesos()`, el real si terminó): estado, ID, cuándo, conductor y vehículo, marca del viaje repetido si es de una serie, y una línea con origen → destino, paradas, condiciones, distancia, tiempo y motivo si terminó sin hacerse. `conTabla` cambia la línea por la `TablaParadas` (viaje en curso del Inicio). Exporta `nombreConductor`, `textoParadas`, `resumenViaje`. |
| `TablaParadas` | Tabla Parada / Estim. / Real del viaje en curso: hechas en verde, la próxima resaltada con la llegada estimada del socket (`eta`), llegada tarde en ámbar según `diferencia_min` del backend. Exporta `tituloParada(p)` (la empresa ve el **nombre del lugar guardado**; el conductor nunca), `paradaActual(v)`, `MIN_DEMORA` (5) y `MIN_TARDE` (10). |
| `HojaConductor` | `ListaConductores`: conductores para elegir; el que no tiene un vehículo que cumpla las condiciones queda visible y apagado, con el motivo. `HojaConductor`: la misma lista en una hoja, para reasignar o asignar a otro, con «Invitar a un conductor nuevo». `aptitud(conductor, condiciones)` y `resumenConductor(c)` («Ford Transit. Frágil y voluminoso.»). Solo ordena y explica: el backend vuelve a validar. |
| `HojaParada` | Hoja para elegir una dirección: búsqueda con Places (`direcciones.js`) y los lugares guardados de la empresa como chips a un toque. Devuelve `{ direccion, lat, lng, id_lugar?, nombre? }`. Reemplaza a `LocationPickerModal` en lo nuevo. |

### 4.10 Componentes sueltos (`src/components/`)

| Archivo | Para qué |
|---|---|
| `Isotipo.js` | El isotipo «Carga» en SVG (seis cajas que forman la F). |
| `GoogleLogo.js` | Logo de Google para el botón de login. |
| `FormVehiculo.js` | `useFormVehiculo()` (estado y validación del vehículo) y `CamposVehiculo` (los campos). Lo usan el alta y «Agregar vehículo». |
| `SelectorApariencia.js` | Claro / Oscuro / Sistema; guarda con `setMode`. |
| `MapViewWrapper.js` | Carga `react-native-maps` si existe; si no, muestra un recuadro. En iOS usa Apple Maps hasta tener la clave de Google. |
| `MapViewWrapper.web.js` | Misma API para web, sin importar `react-native-maps` (rompería el bundle). |
| `LocationPickerModal.js` | Heredado del marketplace (elegir dirección con Places). La fase 3 no lo usa: lo reemplazan `HojaParada` + `services/direcciones.js` con el estilo del sistema. |

### 4.11 Pantallas de entrada y alta (`src/screens/auth/`)

| Pantalla | Qué hace | Llama a |
|---|---|---|
| `SplashScreen` | Naranja con el isotipo animado mientras se resuelve la sesión; avisa con `onTerminar`. | — |
| `LoginScreen` | Email y contraseña o Google. Muestra `errorSesion`. En DEV entra sin contraseña. | `loginEmail`, `useGoogleLogin` |
| `RecuperarContrasenaScreen` | Manda el link; «Volver a enviar» con cuenta regresiva. | `recuperarContrasena` |
| `TipoCuentaScreen` | Empresa o conductor; guarda `rolEnAlta`. | — |
| `RegistroEmpresaScreen` | Datos de la persona. Al crearla, Firebase abre la sesión y el router pasa al onboarding. Errores de email/DNI van al campo. | `registroCliente` |
| `RegistroConductorScreen` | Datos personales; solo valida y pasa al siguiente paso. | — |
| `LicenciaConductorScreen` | Número y vencimiento (calendario). Solo pasa datos. | — |
| `VehiculoConductorScreen` | **Crea la cuenta**: prende `altaEnCurso`, registra, abre sesión y, si cargó, crea el vehículo. Si el vehículo falla, el reintento no repite la cuenta. | `registroConductor`, `crearVehiculoPropio` |
| `CodigoConductorScreen` | Canjea el código de la empresa (opcional). | `canjearCodigo` |
| `ConductorListoScreen` | Resumen; «Empezar» refresca el perfil y apaga `altaEnCurso`. | `refrescarUsuario` |
| `CamposPersonales.js` + `useDatosPersonales.js` | Los seis campos personales y su validación, compartidos por los dos registros. | — |

### 4.12 Pantallas de empresa sin empresa (`src/screens/onboarding/`)

| Pantalla | Qué hace | Llama a |
|---|---|---|
| `SinEmpresaScreen` | Pregunta si la empresa ya usa Fleter: registrarla o sumarse con un código. | — |
| `CrearEmpresaScreen` | Nombre, CUIT (validado), razón social y dirección opcionales. | `crearOrganizacion` |
| `CodigoMiembroScreen` | Canjea el código de miembro y refresca el perfil. | `canjearCodigo`, `refrescarUsuario` |
| `EmpresaRegistradaScreen` | Cierre con el isotipo animado y próximos pasos; al salir refresca el perfil. | `refrescarUsuario` |

### 4.13 Pantallas del conductor (`src/screens/conductor/`)

| Pantalla | Qué hace | Llama a | Escucha |
|---|---|---|---|
| `ViajesScreen` | Viaje en curso fijo arriba; «Para confirmar», «Hoy», «Próximos»; estado vacío. | `listarViajes` | asignado, serie, editado, desasignado, cancelado, vencido |
| `DetalleViajeScreen` | Detalle; confirmar (hoja de vehículos aptos; con uno solo, directo) o rechazar. Si el viaje ya está en curso, pasa a `ViajeActivo`. | `obtenerViaje`, `misVehiculos`, `confirmarViaje`, `rechazarViaje` | editado, desasignado, cancelado, vencido |
| `ViajeActivoScreen` | Una acción grande según el estado: Iniciar (CONFIRMADO), Salir de la parada (CARGANDO/DESCARGANDO), Llegué (EN_RUTA). Pide permiso de ubicación con explicación previa. «Cómo llegar» abre Google/Apple Maps. Cancelar con hoja. `ejecutar()` centraliza llamada, error y recarga. | `iniciarViaje`, `salirDeParada`, `confirmarLlegada`, `cancelarViaje` + `useGpsViaje` | editado, desasignado, cancelado, vencido |
| `ViajeTerminadoScreen` | Estimado contra real (manejo, carga y descarga, distancia, total) y remito. | `obtenerViaje` | — |
| `HistorialScreen` | Viajes finales agrupados por mes con filtros. | `listarViajes({ grupo: 'historial' })` | — |
| `PerfilScreen` | Datos, sus empresas, sus vehículos, apariencia, cerrar sesión. | `misOrganizaciones`, `misVehiculos` | — |
| `EmpresaConductorScreen` | Una empresa; desvincularse con aviso de lo que cancela (ISSUES #1). | `desvincularme` | — |
| `SumarEmpresaScreen` | Canjear el código de otra empresa. | `canjearCodigo` | — |
| `NuevoVehiculoScreen` | Agregar un vehículo con `FormVehiculo`. | `crearVehiculoPropio` | — |

### 4.14 Pantallas de la empresa (`src/screens/empresa/`)

Todas en claro (default de la empresa) y oscuro, con tokens. La empresa **sí** ve precios.

| Pantalla | Qué hace | Llama a | Escucha |
|---|---|---|---|
| `InicioScreen` | El día de un vistazo: nombre de la empresa, «Hoy, jue 29 oct», tres números (viajes hoy, en curso, estimado del día = suma de los `precio_estimado` que ya dio el backend), «En curso» con la tabla de paradas estimado/real y la llegada estimada, «Próximos de hoy», «Terminados hoy», estado vacío con «Cargar un viaje». Sin alertas (tienen su pestaña). | `EmpresaContext.viajes` | `eta:actualizar` + los de `EmpresaContext` |
| `AlertasScreen` | «Para resolver» con la acción a un toque: rechazado → **Asignar a otro** (hoja de conductores) / Ver viaje; por vencer → **Llamar** / Reasignar; cierre habilitado → **Finalizar el viaje**. «Hoy» con lo que avisó el socket y un punto en lo no visto (se marca visto al salir de la pestaña). Estado vacío «Todo en orden». | `asignarRechazadoA`, `reasignarViaje`, `finalizarViaje`, `listarConductores` | vía `EmpresaContext` |
| `ViajesScreen` | Viajes agrupados por día («Hoy, jue 29 oct · 4 viajes») con filtros Activos / En curso / Terminados (`grupo` del backend). Los de una serie llevan su marca («Diario», «L, M y V»). Tirar para abajo recarga. | `listarViajes`, `listarSeries` | asignado, serie, editado, confirmado, rechazado, iniciado, estado_cambiado, finalizado, cancelado, vencido |
| `NuevoViajeScreen` | Alta en 4 pasos cortos + revisión. 1 **Recorrido**: origen, paradas y destino (hasta 10), cada una con `HojaParada`; los lugares guardados llevan su etiqueta. 2 **Cuándo**: fecha (`HojaCalendario`), hora (`HojaHora`) y «¿Se repite?» (una vez, todos los días, algunos días, semanal, mensual) con «Hasta» (máx. 30 días) y cuántos viajes salen. 3 **Carga**: condiciones y nota para el conductor. 4 **Conductor**: solo los vinculados; los no aptos apagados con el motivo; «Invitar a un conductor». **Revisar**: precio grande, distancia, tiempo, manejo y carga/descarga, y la hora estimada de cada parada, todo de `estimar-costo`; el botón dice qué pasa («Asignar 7 viajes a Martín»). Crea un viaje o una serie. Con `params.editar` edita un viaje programado (sin repetición ni conductor) y avisa si el conductor lo tiene que reconfirmar; con `params.copiar` arranca con los datos de otro viaje. | `listarLugares`, `listarConductores`, `estimarViaje`, `crearViaje`, `crearSerie`, `editarViaje` | — |
| `ViajeScreen` | Detalle que cambia según el estado. **En curso**: mapa con la posición del conductor (`mapa:actualizar`), aviso de desvío, «Llega a Av. Mitre 1450 a las 15:12» (`eta:actualizar`), conductor con **Llamar**, recorrido con horas reales y salida tarde; Cancelar (la hoja explica que se corta con la carga arriba) y **Finalizar el viaje** si el conductor no tocó «Salir». **Programado**: ventana de inicio o aviso de sin confirmar; **Editar**, **Reasignar** (hoja de conductores) y **Cancelar** (motivo opcional, lo ve el conductor). **Rechazado**: «Lucía lo rechazó a las 11:20» + **Asignar a otro conductor** o cargarlo de nuevo cambiando datos. **Terminado**: tabla estimado vs. real con precio (el `*` marca la descarga no medida), quién lo cerró, puntualidad en cada parada y **Ver remito**. Vencido o cancelado: el motivo y «Cargarlo de nuevo». | `obtenerViaje`, `cancelarViaje`, `reasignarViaje`, `asignarRechazadoA`, `finalizarViaje`, `obtenerRemito`, `listarConductores` | editado, confirmado, rechazado, iniciado, estado_cambiado, finalizado, cancelado, vencido, cierre_habilitado, salida_detectada; en vivo `mapa:actualizar`, `eta:actualizar`, `alerta:desvio`, `ruta:recalculada` |
| `MasScreen` | La empresa (estado y si sos responsable) y la lista: Conductores (cuántos y cuántos en ruta), Lugares guardados, Viajes repetidos (activos), Equipo, Datos de la empresa, Mis datos; Apariencia (Claro / Oscuro / Sistema) y Cerrar sesión. | `listarConductores`, `listarLugares`, `listarSeries`, `listarMiembros` | — |
| `ConductoresScreen` | Conductores con su vehículo y, si están en un viaje, su estado; invitaciones de conductor pendientes con **Revocar**; «Invitar conductor». | `listarConductores`, `listarInvitaciones`, `revocarInvitacion` | — |
| `ConductorScreen` | Un conductor: Llamar, sus vehículos con patente y condiciones, sus viajes por hacer (hasta 5). **Desvincular** con vista previa de lo que cancela (sus viajes por hacer, incluido uno en curso, y sus viajes repetidos; ISSUES.md #1). | `desvincularConductor`, `listarSeries` | — |
| `InvitarScreen` | Genera un código de un solo uso (`CHOFER` o `MIEMBRO`) y lo muestra **una única vez**, grande en mono, con vencimiento, Copiar (`expo-clipboard`) y Compartir (`Share`, listo para WhatsApp), y la nota de que no se puede volver a ver. | `crearInvitacion` | — |
| `LugaresScreen` / `LugarScreen` | Lista de lugares guardados; crear o editar (nombre único + dirección con `HojaParada`) y borrar con confirmación. Aclara que cambiar un lugar no toca los viajes que ya lo usan. | `listarLugares`, `guardarLugar`, `borrarLugar` | — |
| `SeriesScreen` / `SerieScreen` | Viajes repetidos: frecuencia, recorrido, conductor, hasta cuándo y cuántos viajes quedan por hacer (`resumen_viajes`). Detalle con la regla, el recorrido, todos sus viajes y **Cancelar el viaje repetido** (no toca los viajes ya creados). Al crear una serie, avisa cuántos se crearon y cuántos se saltearon. | `listarSeries`, `obtenerSerie`, `cancelarSerie` | — |
| `EquipoScreen` | Miembros con su rol; un responsable invita (código `MIEMBRO`), revoca, cambia roles y saca personas; cualquiera se puede ir de la empresa. El 409 del último responsable se explica en criollo. | `listarMiembros`, `cambiarRol`, `eliminarMiembro`, `salirDeEmpresa`, `listarInvitaciones`, `revocarInvitacion` | — |
| `DatosEmpresaScreen` | Nombre, CUIT (con formato), razón social y dirección; editable solo por un responsable (los demás los ven fijos). | `obtenerOrganizacion`, `editarOrganizacion` | — |
| `MisDatosScreen` | Nombre, apellido y teléfono; el email es el de la cuenta. | `editarPerfil` | — |

## 5. Flujos de punta a punta

### 5.1 Abrir la app
`App.js` carga fuentes → `RootNavigator` muestra `SplashScreen` → `AuthProvider` espera `onAuthStateChanged`
→ con sesión: `/login` + `/me` → `user` → el router elige el stack. Sin sesión: `AuthStack` (Login).

### 5.2 Login
`LoginScreen` → `loginEmail` (Firebase) → `onAuthStateChanged` → `cargarUsuario` → `user` → stack.
Con Google: `useGoogleLogin` → `id_token` → `loginGoogle` → mismo camino. 404 en `/login` → `errorSesion`.

### 5.3 Alta de empresa
`TipoCuenta` (rolEnAlta = CLIENTE) → `RegistroEmpresa` → `registroCliente` (backend + Firebase) → `user` con
`organizacion: null` → `OnboardingEmpresaStack` → `SinEmpresa` →
- `CrearEmpresa` → `crearOrganizacion` → `EmpresaRegistrada` → «Empezar» → `refrescarUsuario` → stack de empresa.
- `CodigoMiembro` → `canjearCodigo` → `refrescarUsuario` → stack de empresa.

### 5.4 Alta de conductor
`TipoCuenta` (rolEnAlta = CONDUCTOR, tema oscuro) → `RegistroConductor` → `LicenciaConductor` (solo datos) →
`VehiculoConductor`: `altaEnCurso = true` → `registroConductor` → `crearVehiculoPropio` → `CodigoConductor`
(opcional) → `ConductorListo` → `refrescarUsuario` + `altaEnCurso = false` → `ConductorStack`.

### 5.5 Viaje del conductor
```
ASIGNADO ─confirmar(vehículo)→ CONFIRMADO ─iniciar(lat,lng)→ CARGANDO ─salir→ EN_RUTA
EN_RUTA ─llegué(id_parada, lat,lng)→ DESCARGANDO ─salir→ EN_RUTA … ─salir en la última→ FINALIZADO
ASIGNADO ─rechazar→ RECHAZADO · sistema → VENCIDO · cualquiera no final → CANCELADO
```
`ViajesScreen` → `DetalleViajeScreen` (confirmar/rechazar) → `ViajeActivoScreen` (iniciar, paradas; el GPS se
comparte desde el 200 de `/iniciar`) → `ViajeTerminadoScreen`. Los errores del backend (fuera del radio, fuera de
la ventana) se muestran tal cual; ante un 409 se recarga el viaje.

### 5.6 Tiempo real
Evento del socket / reconexión / volver al frente → `useEnVivo` → `recargar()` → GET por REST → pantalla.
Además, cada pantalla recarga al enfocarse (`useFocusEffect`) y al tirar para abajo. Las únicas cosas que se pintan
directo desde el evento son las que **solo** existen por socket: la posición (`mapa:actualizar`), la llegada estimada
(`eta:actualizar`), el aviso de desvío y la ruta recalculada.

### 5.7 Nuevo viaje de la empresa
`NuevoViaje` paso 1 (paradas con `HojaParada`: Places o lugar guardado) → 2 (fecha, hora, repetición) → 3
(condiciones, nota) → 4 (conductor apto) → Revisar: `estimarViaje` → precio y horas del backend →
- una vez: `crearViaje` → `viaje:asignado` al conductor → `Viaje` (ASIGNADO).
- se repite: `crearSerie` (todos los viajes de hasta 30 días de una vez; el conductor recibe **un** `serie:asignada`)
  → `Serie` con cuántos se crearon y cuántos se saltearon.

### 5.8 Seguir y resolver un viaje
```
ASIGNADO ──editar / reasignar──► ASIGNADO   (si estaba CONFIRMADO, el conductor reconfirma)
ASIGNADO / CONFIRMADO / en curso ──cancelar(motivo)──► CANCELADO
RECHAZADO ──«Asignar a otro»──► viaje NUEVO con los mismos datos (el rechazado queda como está)
en curso, llegó a la última y no tocó «Salir» ──finalizar──► FINALIZADO (cerrado_por ORGANIZACION)
FINALIZADO ──► estimado vs. real + remito
```
`Viaje` reacciona a los eventos del viaje (refetch) y a los de seguimiento (posición, llegada, desvío). Un 409
(carrera con el conductor) se muestra tal cual y la pantalla recarga.

### 5.9 Alertas
`EmpresaContext` deriva «Para resolver» de la lista de viajes (REST) y arma «Hoy» con los avisos del socket.
El contador de la pestaña es `pendientes.length`. Resolver (reasignar, asignar a otro, finalizar) recarga la lista y
la alerta desaparece sola.

## 6. Endpoints y eventos que usa la app

| Método y ruta | Servicio | Desde |
|---|---|---|
| `POST /api/auth/login` | `AuthContext.cargarUsuario` | toda sesión |
| `GET /api/auth/me` | `auth.obtenerPerfil` | toda sesión, `refrescarUsuario` |
| `POST /api/auth/registro-cliente` | `auth.registroCliente` | RegistroEmpresa |
| `POST /api/auth/registro-conductor` | `auth.registroConductor` | VehiculoConductor |
| `POST /api/organizaciones` | `organizaciones.crearOrganizacion` | CrearEmpresa |
| `POST /api/invitaciones/canjear` | `organizaciones.canjearCodigo` | CodigoMiembro, CodigoConductor, SumarEmpresa |
| `POST /api/conductores/mis-vehiculos` | `vehiculos.crearVehiculoPropio` | VehiculoConductor, NuevoVehiculo |
| `GET /api/conductores/mis-vehiculos` | `viajesConductor.misVehiculos` | DetalleViaje, Perfil |
| `GET /api/choferes/viajes` | `listarViajes` | Viajes, Historial |
| `GET /api/choferes/viajes/:id` | `obtenerViaje` | Detalle, Activo, Terminado |
| `POST /api/choferes/viajes/:id/confirmar` | `confirmarViaje` | Detalle |
| `POST /api/choferes/viajes/:id/rechazar` | `rechazarViaje` | Detalle |
| `POST /api/choferes/viajes/:id/cancelar` | `cancelarViaje` | Activo |
| `POST /api/choferes/viajes/:id/iniciar` | `iniciarViaje` | Activo |
| `POST /api/choferes/viajes/:id/salir` | `salirDeParada` | Activo |
| `POST /api/viajes/:id/confirmar-parada` | `confirmarLlegada` | Activo |
| `GET /api/choferes/mis-organizaciones` | `misOrganizaciones` | Perfil |
| `DELETE /api/choferes/mis-organizaciones/:id` | `desvincularme` | EmpresaConductor |
| `GET /api/organizaciones/:id/viajes?grupo=` | `viajesEmpresa.listarViajes` | EmpresaContext, Viajes |
| `GET /api/organizaciones/:id/viajes/:idViaje` | `obtenerViaje` | Viaje, salida tarde en EmpresaContext |
| `POST /api/viajes/estimar-costo` | `estimarViaje` | NuevoViaje (revisar) |
| `POST /api/organizaciones/:id/viajes` | `crearViaje`, `asignarRechazadoA` | NuevoViaje, Viaje, Alertas |
| `PUT /api/organizaciones/:id/viajes/:idViaje` | `editarViaje` | NuevoViaje (editar) |
| `POST …/viajes/:idViaje/reasignar` | `reasignarViaje` | Viaje, Alertas |
| `POST …/viajes/:idViaje/cancelar` | `cancelarViaje` | Viaje |
| `POST …/viajes/:idViaje/finalizar` | `finalizarViaje` | Viaje, Alertas |
| `GET …/viajes/:idViaje/remito` | `obtenerRemito` | Viaje (si el detalle no trae `remito_url`) |
| `POST / GET /api/organizaciones/:id/series`, `GET …/series/:idSerie`, `POST …/series/:idSerie/cancelar` | `crearSerie`, `listarSeries`, `obtenerSerie`, `cancelarSerie` | NuevoViaje, Viajes, Más, Series, Serie, Conductor |
| `GET / PUT /api/organizaciones/:id` | `empresa.obtenerOrganizacion`, `editarOrganizacion` | DatosEmpresa |
| `GET …/miembros`, `PUT …/miembros/:idUsuario/rol`, `DELETE …/miembros/:idUsuario`, `POST …/salir` | `listarMiembros`, `cambiarRol`, `eliminarMiembro`, `salirDeEmpresa` | Equipo, Más |
| `POST / GET …/invitaciones`, `DELETE …/invitaciones/:idInv` | `crearInvitacion`, `listarInvitaciones`, `revocarInvitacion` | Invitar, Conductores, Equipo |
| `GET …/choferes`, `DELETE …/choferes/:idConductor` | `listarConductores`, `desvincularConductor` | NuevoViaje, Conductores, Conductor, Más, hojas de conductor |
| `GET / POST …/lugares`, `PUT / DELETE …/lugares/:idLugar` | `listarLugares`, `guardarLugar`, `borrarLugar` | NuevoViaje, Lugares, Lugar, Más |
| `PUT /api/auth/perfil` | `editarPerfil` | MisDatos |

| Evento | Dirección | Dónde |
|---|---|---|
| `viaje:asignado`, `serie:asignada` | servidor → conductor | ViajesScreen |
| `viaje:editado`, `viaje:desasignado`, `viaje:cancelado`, `viaje:vencido` | servidor → conductor | Viajes, Detalle, Activo |
| `conductor:ubicacion` `{ id_viaje, lat, lng, timestamp }` | conductor → servidor | useGpsViaje / locationTask |
| `viaje:asignado`, `viaje:desasignado`, `viaje:editado`, `viaje:confirmado`, `viaje:rechazado`, `viaje:iniciado`, `viaje:estado_cambiado`, `viaje:finalizado`, `viaje:cancelado`, `viaje:vencido`, `viaje:cierre_habilitado`, `serie:asignada` | servidor → sala `organizacion:{id}` | EmpresaContext (refetch + alertas), Viajes, Viaje |
| `mapa:actualizar`, `eta:actualizar`, `alerta:desvio`, `alerta:parada`, `ruta:recalculada`, `parada:salida_detectada` | servidor → empresa | Viaje (seguimiento), Inicio (llegada), EmpresaContext («Hoy») |

## 7. Reglas para escribir código nuevo

- **Colores:** nunca un hexadecimal en una pantalla. `const s = useThemedStyles(createStyles)` con
  `createStyles = (c) => StyleSheet.create({...})`. Probar en claro y en oscuro.
- **Componentes:** primero `components/ui` y `components/viaje`; un estilo nuevo solo si no existe la pieza.
- **Red:** solo desde `services/`, con su rama `DEV_MODE`. Las pantallas no importan axios.
- **Errores:** `mensajeDeError(err, 'texto por defecto')`; mostrar el del backend tal cual cuando es una validación.
- **Tiempo real:** `useEnVivo(EVENTOS, cargar)`; nunca pintar con el contenido del evento.
- **Nada de cálculos de negocio:** si hace falta un número (precio, distancia, ETA), lo trae el backend.
- **Textos:** voseo, «empresa» y «conductor» en lo visible, formatos es-AR, «A confirmar» para lo que falta.
- **El conductor no ve precios.** La empresa sí: `pesos()` de `utils/dinero.js`, solo en `components/empresa` y `screens/empresa`.
- **Documentación:** actualizar este archivo, `PROGRESO.md` y, si corresponde, `ISSUES.md` en el mismo commit.

## 8. Código heredado del marketplace

La versión anterior de la app (fleteros que aceptaban ofertas, gerentes de empresas de transporte). Está fuera de los
flujos nuevos. Con la fase 3 ya **nada nuevo lo monta** para la empresa: `RootNavigator` manda a `PymeStack`. Queda en
el repo hasta que el dueño decida borrarlo (fase 4, limpieza):

- `src/screens/cliente/`, `src/screens/fletero/`, `src/screens/gerente/`, `src/screens/auth/_marketplace/`
- `src/navigation/ClienteStack.js` (ya sin uso), `FleteroStack.js`, `GerenteStack.js` (solo roles legacy)
- `src/hooks/useMiEmpresa.js`, `src/utils/format.js`, `src/utils/vehiculo.js`, `src/mocks/` (los mocks de Firebase nativo siguen haciendo falta para web)
- `src/components/LocationPickerModal.js` (reemplazado por `HojaParada` en lo nuevo)

## 9. Cómo se cumple el plan, fase por fase

El plan es `docs/PLAN_MOBILE_PYME.md` (pivot a «la empresa asigna, el conductor confirma»). Acá, cada ítem del plan
con los archivos que lo resuelven, qué hace cada uno y cómo se verificó. Estado: ✅ hecho · ⚠️ hecho con un desvío
explicado · ⏳ queda para la fase 4 o depende del backend.

**Cómo se verificó cada fase.** Prototipo HTML aprobado por el dueño antes de programar (`prototype/fleter-mobile-fase1-auth.html`,
`…fase2-conductor.html`, `…fase3-empresa.html`). Después, la app corriendo en Expo web (390×844) en modo
desarrollo, recorrida de punta a punta con Playwright en **claro y oscuro**, sin errores de consola. El contrato del
backend se probó aparte contra staging con `scripts/api-tests/` (identidad 109/109, viaje interno 148/148, lugares
y series 113/113; ver `PROGRESO.md`). En DEV la app no toca el backend: cada servicio tiene su `if (DEV_MODE)` con
datos de ejemplo (`viajesConductor.js`, `mockEmpresa.js`) que imitan las respuestas de `API.md`.

### 9.1 Principios y reglas fijas del plan

| Regla del plan | Cómo se cumple en el código |
|---|---|
| Dos tipos de cuenta: `CLIENTE` (empresa, `RESPONSABLE` o `MIEMBRO`) y `CONDUCTOR` | `RootNavigator.Stacks()` elige `OnboardingEmpresaStack` / `PymeStack` / `ConductorStack` según `user.rol` y `user.organizacion`. El rol dentro de la empresa sale de `user.organizacion.rol` → `EmpresaContext.esResponsable`, que decide qué ve cada uno (invitar miembros, editar la empresa, roles). |
| Vocabulario: «empresa» y «conductor», voseo, formatos es-AR | Textos de todas las pantallas nuevas; «PyME» y «chofer» solo en nombres internos y en la API. Formatos en `utils/fechas.js` (14:30, mié 22 oct), `utils/dinero.js` ($12.500), `utils/formularios.js` (AE 421 KL, CUIT 30-71234567-1, código XXXXX-XXXXX). `mensajeDeError` traduce errores a voseo. |
| El mobile no calcula nada | Precio, distancia, tiempos, hora de cada parada, ventana, vencimiento, cierre y puntualidad (`diferencia_min`) vienen del backend. Lo único que la app hace con números es mostrar: sumar los precios del día que ya dio el backend (Inicio), contar viajes de una serie **antes** de crearla (`contarViajes`, solo un aviso: el número real vuelve en la respuesta) y marcar en ámbar una salida tarde comparando dos horas que dio el backend. |
| Refetch por REST al reconectar y al volver a primer plano | `hooks/useEnVivo.js` (eventos + `reconnect` + `AppState`), usado por las pantallas del conductor, `ViajesScreen` de la empresa, `ViajeScreen` y `EmpresaContext`. El socket solo avisa; la pantalla vuelve a pedir. |
| Radio de 50 m nunca hardcodeado | La app manda la posición (`iniciarViaje`, `confirmarLlegada`) y muestra el error del backend tal cual; no hay ninguna distancia en el código. |
| Regla de los 9 datos en toda card de viaje | `components/viaje/TarjetaViaje.js` (conductor, sin precio) y `components/empresa/TarjetaViajeEmpresa.js` (empresa, con precio): fecha y hora, origen, paradas, destino, condiciones, distancia, tiempo, precio (solo empresa) y estado; nada se trunca y lo que falta dice «A confirmar». |
| El conductor nunca ve el precio | `TarjetaViaje`, `DatosViaje.datosBasicos`, `ViajeTerminadoScreen` no lo muestran; `pesos()` solo se importa en `components/empresa` y `screens/empresa`. |
| Solo el sistema Fleter, claro y oscuro, sin colores fijos | Todo color sale de `theme.js` vía `useThemedStyles`; `grep` de hexadecimales en `screens/empresa`, `components/empresa` y el kit nuevo da cero. Defaults: empresa claro, conductor oscuro (`ThemeContext`); conmutable en Perfil / Más → Apariencia. |
| Notas informativas en gris | `Nota` sin tipo = neutra (gris); ámbar solo para avisos, rojo para errores, verde para éxito. |

### 9.2 Fase 0 — Base

| # | Ítem del plan | Cómo se cumple | Estado |
|---|---|---|---|
| 0.1 | Mergear la rama del pivot (docs, prototipo, pruebas de API) | Commit `08c3214`: entran `docs/PIVOT_EMPRESA_BACKEND.md`, el prototipo del panel de empresa y `scripts/api-tests/` (`organizaciones.mjs`, después `viajes.mjs` y `series.mjs`), que corren contra **staging**, nunca producción. | ✅ |
| 0.2 | Reescribir `CLAUDE.md` y `PLAN_DESARROLLO.md` con el modelo nuevo | `CLAUDE.md` tiene el modelo nuevo: sistema Fleter y decisiones del dueño, «empresa»/«conductor», el conductor sin precios, contrato en `develop`, pruebas en staging, reglas de `PROGRESO.md` y de este documento. `PLAN_DESARROLLO.md` **no** se reescribió: su lugar lo ocupan `docs/PLAN_MOBILE_PYME.md` (este plan) y `docs/CAMBIO_DE_ENFOQUE.md` (por qué se cambió de enfoque). | ⚠️ |
| 0.3 | Kit compartido: `Pantalla`, `Boton`, `Campo`, `CodigoInvitacion`, `ChipEstado`, `CardViaje`, `FilaParada`, `Vacio`, `ErrorBanner` | `components/ui/`: `Pantalla`, `Boton`, `Campo`, `CampoCodigo` (= CodigoInvitacion), `Opcion`, `HojaInferior`, `HojaCalendario`, `HojaHora`, `IsotipoAnimado`, `Texto` (Titulo, Bajada, Meta, Etiqueta, Enlace), `Varios` (Nota, Chip, Pasos, Pastilla…) y `Listas` (Lista, Fila, Avatar, Seccion, **Vacio**, Filtros). `components/viaje/`: `ChipEstado` (los 9 estados en 5 familias), `TarjetaViaje` (= CardViaje), `Recorrido` (= FilaParada), `DatosViaje`, `MapaRecorrido`. `ErrorBanner` es `Nota tipo="error"` (misma pieza para todos los tonos). | ✅ |
| 0.4 | Servicios por dominio + hook de eventos en vivo | `services/organizaciones.js` (crear empresa, canjear código), `empresa.js` (organización, miembros, **invitaciones**, conductores, **lugares**, perfil), `viajesEmpresa.js` (= viajesPyme, más **series**), `viajesConductor.js`, `vehiculos.js`, `direcciones.js` (Places). Lugares y series quedaron dentro de `empresa.js` y `viajesEmpresa.js` en vez de archivos sueltos: son pocas funciones y siempre cuelgan de la organización. Hook `useEnVivo` (= useEventosEnVivo). | ✅ |
| 0.5 | Navegación `AuthStack` → onboarding → `PymeStack` \| `ConductorStack` | `navigation/RootNavigator.js` + `AuthStack.js` + `OnboardingEmpresaStack.js` + `PymeStack.js` (fase 3) + `ConductorStack.js` (fase 2). El router elige por sesión; no hay navegación manual entre zonas. | ✅ |
| 0.6 | Marketplace apagado detrás de flags y archivado en `src/screens/_marketplace/` | No hay flags `MARKETPLACE_HABILITADO` / `CALIFICACIONES_HABILITADAS` en el mobile: el código viejo simplemente **no se monta** (el router no lo alcanza con los roles nuevos) y sigue en sus carpetas (`screens/cliente`, `fletero`, `gerente`, `auth/_marketplace`). Borrarlo es decisión del dueño (fase 4). | ⚠️ |

### 9.3 Fase 1 — Entrada y alta

| # | Pantalla del plan | Archivos y qué hacen | Estado |
|---|---|---|---|
| 1.1 | Splash / carga de sesión | `screens/auth/SplashScreen.js` (naranja, isotipo que se estiba con `IsotipoAnimado`) + `RootNavigator` (espera animación **y** sesión) + `AuthContext` (`onAuthStateChanged` → `/login` + `/me`). | ✅ |
| 1.2 | Login (email + Google, recuperar contraseña) | `LoginScreen.js` (`auth.loginEmail`, `google.useGoogleLogin`; muestra `errorSesion` de una cuenta de Google sin registro), `RecuperarContrasenaScreen.js` (link y reenvío a los 60 s). Google necesita los client IDs en `.env` (pendiente de configuración, avisa en pantalla). | ✅ |
| 1.3 | Elegir tipo de cuenta | `TipoCuentaScreen.js`: Empresa o Conductor; guarda `rolEnAlta`, que pone el alta del conductor en oscuro. | ✅ |
| 1.4 | Registro de empresa (usuario `CLIENTE`) | `RegistroEmpresaScreen.js` + `CamposPersonales.js` + `useDatosPersonales.js` → `auth.registroCliente` (backend + Firebase). Errores de email/DNI en su campo. | ✅ |
| 1.5 | Registro de conductor (+ primer vehículo y condiciones) | `RegistroConductorScreen` → `LicenciaConductorScreen` (vencimiento con `HojaCalendario`) → `VehiculoConductorScreen` (crea la cuenta y el vehículo con `FormVehiculo`; `altaEnCurso` deja el alta montada). Se puede saltear el vehículo. | ✅ |
| 1.6 | Empresa sin organización: crear o unirse con código | `screens/onboarding/`: `SinEmpresaScreen` («¿Tu empresa ya usa Fleter?»), `CrearEmpresaScreen` (CUIT validado → `crearOrganizacion`), `CodigoMiembroScreen` (`canjearCodigo` + `refrescarUsuario`), `EmpresaRegistradaScreen` (cierre con próximos pasos). | ✅ |
| 1.7 | Conductor: canjear código de una empresa (opcional) | `CodigoConductorScreen` (después de crear la cuenta) → `ConductorListoScreen`. Más tarde, desde Perfil → `SumarEmpresaScreen`. | ✅ |

### 9.4 Fase 2 — Conductor (pestañas Viajes, Historial, Perfil)

| # | Pantalla del plan | Archivos y qué hacen | Estado |
|---|---|---|---|
| 2.1 | Mis viajes: hoy / próximos, avisos de `VENCIDO` | `screens/conductor/ViajesScreen.js`: viaje en curso fijo arriba, «Para confirmar», «Hoy», «Próximos», estado vacío; en vez de agrupar por empresa, cada card dice de qué empresa es (así lo muestra el prototipo aprobado de la fase 2). Refresca con `viaje:asignado`, `serie:asignada`, editado, desasignado, cancelado, vencido. Los vencidos quedan en Historial con su filtro y su motivo. | ⚠️ |
| 2.2 | Detalle + Confirmar (elegir vehículo) / Rechazar | `DetalleViajeScreen.js`: hoja con los vehículos (los que no cumplen las condiciones, apagados con el motivo; con uno solo confirma directo) → `confirmarViaje(id, idVehiculo)`; rechazar con confirmación → `rechazarViaje`. | ✅ |
| 2.3 | Viaje activo: iniciar en el origen, parada por parada, GPS en 2º plano, ETA, desvíos | `ViajeActivoScreen.js` (Iniciar → Salir de la parada → Llegué, una acción grande por momento; «Cómo llegar»; cancelar antes de iniciar) + `hooks/useGpsViaje.js` (permiso explicado, `conductor:ubicacion` cada 15 s solo después del 200 de `/iniciar`) + `tasks/locationTask.js` (servicio en primer plano de Android). ETA y desvíos **no** llegan al conductor: el backend se los manda solo a la empresa (ISSUES.md #3). | ⚠️ |
| 2.4 | Viaje finalizado: estimado vs. real + remito | `ViajeTerminadoScreen.js`: manejo, carga y descarga, distancia y total, estimado contra real, y «Ver remito». Sin precio. | ✅ |
| 2.5 | Historial | `HistorialScreen.js`: viajes finales por mes, filtros Todos / Entregados / Cancelados / Vencidos, motivo en la fila. | ✅ |
| 2.6 | Perfil: datos, vehículos, Mis empresas (canjear / desvincularme), apariencia | `PerfilScreen.js` + `EmpresaConductorScreen.js` (desvincularse con aviso de lo que cancela, ISSUES.md #1) + `SumarEmpresaScreen.js` + `NuevoVehiculoScreen.js` (`FormVehiculo`) + `SelectorApariencia`. | ✅ |

### 9.5 Fase 3 — Empresa

Pestañas: el plan decía Inicio, Viajes, Nuevo, Conductores, Más. En la revisión del prototipo el dueño eligió
**Inicio, Viajes, Nuevo, Alertas, Más**: lo que pide una acción va a una pestaña propia con contador, y Conductores
pasa a encabezar Más (invitar también queda a mano desde Nuevo viaje). Así quedó programado (`PymeStack.js`). ⚠️

| # | Pantalla del plan | Archivos y qué hacen | Estado |
|---|---|---|---|
| 3.1 | Inicio: en curso ahora, próximos de hoy, sin confirmar / por vencer, alertas | `screens/empresa/InicioScreen.js`: tres números del día, «En curso» con `TablaParadas` (estimado y real por parada, próxima resaltada con la llegada de `eta:actualizar`, llegada tarde en ámbar), «Próximos de hoy» (los sin confirmar llevan su estado ámbar), «Terminados hoy». Las alertas viven en `AlertasScreen.js` + `context/EmpresaContext.js` (rechazados, por vencer y cierre habilitado con la acción a un toque; desvíos, salidas tarde, entregas y confirmaciones del día). | ✅ |
| 3.2 | Nuevo viaje: lugares guardados, hasta 10 paradas, fecha/hora, condiciones, conductor + precio estimado; «repetir» → serie | `NuevoViajeScreen.js` (4 pasos + revisión) con `components/empresa/HojaParada.js` (Places vía `services/direcciones.js` + lugares guardados), `HojaCalendario`, `HojaHora`, `ListaConductores` (los no aptos apagados). Precio y horas de `estimarViaje` (`estimar-costo`). Crea con `crearViaje` o, si se repite, `crearSerie` (todas las frecuencias del backend, máx. 30 días). | ✅ |
| 3.3 | Seguimiento en vivo: mapa, ETA, timeline por parada, estimado vs. real, remito | `ViajeScreen.js` en curso: `MapaRecorrido` con la posición de `mapa:actualizar` y la ruta de `ruta:recalculada`, aviso de `alerta:desvio`, «Llega a … a las …» con `eta:actualizar`, recorrido con horas reales, salida tarde y puntualidad (`diferencia_min`). Terminado: tabla estimado vs. real con precio, quién lo cerró y «Ver remito» (`remito_url` u `obtenerRemito`). | ✅ |
| 3.4 | Editar / reasignar / cancelar (y alcance en series) | Editar: `NuevoViajeScreen` con `params.editar` → `editarViaje` (avisa si el conductor tiene que reconfirmar). Reasignar: `HojaConductor` → `reasignarViaje`. Cancelar: hoja con motivo → `cancelarViaje`, también en curso, con el texto que explica qué pasa. Rechazado: `asignarRechazadoA` (viaje nuevo con los mismos datos, porque el backend no reasigna un rechazado). Extra de la Tarea 5: `finalizarViaje` cuando el conductor no tocó «Salir». Series: el contrato edita, reasigna y cancela **uno por uno** los viajes de una serie; la serie entera solo se cancela (`SerieScreen`). | ✅ |
| 3.5 | Viajes: lista con filtros | `ViajesScreen.js` (empresa): por día, filtros Activos / En curso / Terminados (`grupo=activos|en_curso|historial`; Terminados incluye entregados, rechazados, vencidos y cancelados, cada uno con su motivo en la card), marca de la serie en cada viaje repetido. | ✅ |
| 3.6 | Conductores: lista, invitar (código una vez + compartir), desvincular con vista previa | `ConductoresScreen.js` (con su vehículo y si están en ruta; invitaciones pendientes con Revocar), `InvitarScreen.js` (código grande, vence, Copiar, Compartir; «no lo vas a poder ver de nuevo»), `ConductorScreen.js` (Llamar, vehículos, viajes por hacer, **Desvincular** con la cuenta de lo que se cancela antes de confirmar). La vista previa sale de los viajes y series que la app ya tiene; el backend confirma con `viajes_cancelados` y `series_borradas` (ISSUES.md #1 sigue abierto: el backend no tiene un «preview»). | ✅ |
| 3.7 | Lugares guardados (CRUD) | `LugaresScreen.js` + `LugarScreen.js` (nombre único, dirección con `HojaParada`, borrar con confirmación) → `listarLugares`, `guardarLugar`, `borrarLugar`. En Nuevo viaje aparecen como chips y la parada se manda como `{ id_lugar }`. | ✅ |
| 3.8 | Series (lista, detalle, cancelar) | `SeriesScreen.js` (frecuencia, recorrido, conductor, hasta cuándo, cuántos viajes quedan con `resumen_viajes`) + `SerieScreen.js` (regla, recorrido, todos sus viajes, cancelar; al crearla avisa cuántos se crearon y salteados). | ✅ |
| 3.9 | Equipo: miembros, roles, invitar miembro (solo responsable), salir | `EquipoScreen.js`: roles con `Pastilla`, hoja por persona (hacer responsable / pasar a miembro / sacar del equipo / irme), invitaciones de equipo con Revocar, «Invitar a alguien de tu equipo» → `InvitarScreen` con `tipo: 'MIEMBRO'`. Un miembro ve el equipo pero no lo puede cambiar. | ✅ |
| 3.10 | Perfil + datos de la empresa + apariencia | `MasScreen.js` (empresa, accesos, Apariencia, Cerrar sesión), `DatosEmpresaScreen.js` (`editarOrganizacion`, solo responsable), `MisDatosScreen.js` (`PUT /api/auth/perfil`). | ✅ |

Piezas nuevas que sostienen la fase 3: `context/EmpresaContext.js`, `navigation/PymeStack.js`,
`services/viajesEmpresa.js`, `services/empresa.js`, `services/mockEmpresa.js`, `services/direcciones.js`,
`components/empresa/*` (TarjetaViajeEmpresa, TablaParadas, HojaConductor, HojaParada), `components/ui/Listas.js`,
`components/ui/HojaHora.js`, `utils/dinero.js`, `utils/series.js` y `motivoFinalEmpresa` en `utils/estados.js`.

### 9.6 Fase 4 — Cierre (pendiente)

| Ítem | Qué falta y de quién depende | Estado |
|---|---|---|
| Push notifications | El backend todavía no integra FCM (ISSUES.md #2). Mientras tanto, Alertas solo ve lo que pasa con la app abierta. | ⏳ backend |
| Remito con foto | El backend no lo definió. | ⏳ backend |
| Desvincular con vista previa / bloqueo en curso | La app ya avisa qué se cancela; falta que el backend decida si bloquea o pide confirmación (ISSUES.md #1). | ⏳ backend |
| Historial de alertas | Sin endpoint, las alertas del día viven en memoria (ISSUES.md #4). | ⏳ backend |
| Pruebas en dispositivo físico (GPS en 2º plano, mapas, Places), accesibilidad | Requiere build nativa; en web los mapas son un recuadro. | ⏳ |
| Limpieza del marketplace y `DEV_MODE` apagado por defecto | Decisiones pendientes del dueño (§8 y `docs/FLUJOS_MOBILE.md` §6). | ⏳ dueño |
| Pantallas de empresa contra staging | Las pantallas usan exactamente los endpoints que ya pasan las pruebas de contrato; falta recorrerlas con `EXPO_PUBLIC_DEV_MODE=false` y una cuenta de staging. | ⏳ |

## 10. Registro de cambios de este documento

| Fecha | Cambio |
|---|---|
| 27 oct 2026 | Versión inicial: fases 0, 1 y 2 completas, archivo por archivo. |
| 29 oct 2026 | Fase 3 (en curso): utilidades `dinero.js` y `series.js`. |
| 29 oct 2026 | Fase 3 completa: `PymeStack`, `EmpresaContext`, servicios de empresa (`viajesEmpresa`, `empresa`, `mockEmpresa`, `direcciones`), `components/empresa/`, `Listas` y `HojaHora` en el kit, 16 pantallas en `screens/empresa/`, flujos 5.7 a 5.9, endpoints y eventos de la empresa. Sección 9 nueva: cómo se cumple el plan, fase por fase y archivo por archivo. |
