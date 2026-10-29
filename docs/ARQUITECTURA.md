# Fleter Mobile — Arquitectura y archivos

> **Documento vivo.** Se actualiza en el mismo commit que cualquier cambio de código que agregue, borre o
> cambie la responsabilidad de un archivo, un endpoint, un evento o un flujo (regla en `CLAUDE.md`).
> Última actualización: 29 oct 2026 · rama `staging` · fases 0, 1 y 2 programadas; fase 3 en implementación.
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
9. [Registro de cambios de este documento](#9-registro-de-cambios-de-este-documento)

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
  context/                 estado global (sesión, tema, socket)
  navigation/              router y stacks
  services/                todas las llamadas al backend y a Firebase
  hooks/                   lógica reutilizable (tiempo real, GPS)
  tasks/                   tarea de ubicación en segundo plano
  utils/                   funciones puras (fechas, formatos, estados, errores)
  components/
    ui/                    kit del sistema Fleter (botones, campos, hojas…)
    viaje/                 piezas de un viaje (estado, recorrido, tarjeta, mapa)
    *.js                   componentes sueltos (isotipo, mapa, formulario de vehículo…)
  screens/
    auth/                  entrada y alta (fase 1)
    onboarding/            cuenta de empresa sin empresa (fase 1)
    conductor/             app del conductor (fase 2)
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
                 ├ ClienteStack (heredado) ─ hasta la fase 3
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
solo cuando está conectado (en `disconnect` vuelve a `null`). Lo consumen `useEnVivo` y `useGpsViaje`.

### 4.3 Navegación (`src/navigation/`)

**`RootNavigator.js`** — Muestra el `SplashScreen` hasta que termina la animación **y** se resolvió la sesión.
Después, `Stacks()` elige:

| Condición | Stack |
|---|---|
| sin `user` o `altaEnCurso` | `AuthStack` |
| `CLIENTE` con `organizacion === null` | `OnboardingEmpresaStack` |
| `CLIENTE` con empresa | `ClienteStack` (heredado, hasta la fase 3) |
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
| `estados.js` | `ESTADOS`: etiqueta y familia de color de cada estado del viaje; `EN_CURSO`, `FINALES`; `coloresFamilia(familia, colors)`; `motivoFinal(viaje)` (por qué terminó sin hacerse, en una línea). |
| `fechas.js` | Formatos es-AR: `hora` (14:30), `diaCorto` (mié 22 oct), `cuando` (Hoy, 14:30), `cuandoLargo`, `mesAnio`, `mesAlta`, `duracionMin`/`duracionHoras` (1 h 20 min), `transcurrido` (cronómetro), `km`. Lo que falta devuelve «A confirmar». |
| `formularios.js` | Formato al tipear y limpieza para la API: DNI, CUIT, código de invitación (XXXXX-XXXXX), patente (AE 421 KL), email, fecha corta. El backend vuelve a validar. |
| `errores.js` | `mensajeDeError(err, porDefecto)`: traduce códigos de Firebase y mensajes del backend a texto en voseo; los 400 del backend se muestran tal cual. Ninguna pantalla muestra códigos técnicos. |
| `ventana.js` | Ventana de inicio de referencia (−60 / +90 min de `fecha_programada`). Solo para mostrar (ISSUES #3). |
| `dinero.js` | `pesos(v)`: precio es-AR ($12.500, sin decimales). Solo del lado de la empresa (fase 3); el conductor nunca ve precios. |
| `series.js` | Viajes repetidos (fase 3): `FRECUENCIAS`, `LETRAS_DIAS`, `textoFrecuencia(serie)` («Lun, mié y vie a las 07:00»), `contarViajes(...)` (aviso previo; el número real lo da el backend), `fechaIso`/`desdeIso`, `diaSemanaIso` (1 = lunes). |
| `format.js`, `vehiculo.js` | Heredados del marketplace; sin uso en las fases nuevas. |

### 4.8 Kit de UI (`src/components/ui/`)

Todo se importa desde `components/ui` (`index.js`). Usarlos antes de crear estilos nuevos.

| Componente | Para qué |
|---|---|
| `Pantalla` | Esqueleto de toda pantalla: zona segura, barra de estado del tema, scroll, botón de volver (`onVolver`), algo a la derecha (`derecha`), pie fijo para la acción principal (`pie`, `pieConLinea`), `refreshControl`. |
| `Boton` | Variantes `primario` (naranja, texto en tinta; uno por vista), `borde`, `fantasma`, `peligro`. Props `cargando`, `deshabilitado`, `icono`. |
| `Campo` | Campo con label arriba, foco naranja con halo, `hint`, `error` (texto o `true` para solo marcar el borde), `secreto` (ojito), `mono` (solo con valor cargado), `icono`, y modo selector con `onPress`. |
| `CampoCodigo` | Código de invitación grande, se formatea solo y tiene botón «Pegar». |
| `Opcion` | Tarjeta de opción única (tipo de cuenta, tipo de vehículo). |
| `HojaInferior` | Hoja desde abajo para elegir o confirmar algo que no se deshace. |
| `HojaCalendario` | Calendario propio (sin picker nativo), semana desde el lunes, `minimo`. |
| `IsotipoAnimado` | El isotipo se estiba caja por caja; respeta «reducir movimiento». Splash y cierres. |
| `Texto.js` | `Titulo`, `Bajada`, `Meta`, `Etiqueta`, `Eslogan`, `Enlace`. |
| `Varios.js` | `Marca`, `Pasos`, `Nota` (gris por defecto; `aviso`, `error`, `ok`), `Chip`, `Separador`, `ProximosPasos`, `Pastilla`. |

### 4.9 Componentes del viaje (`src/components/viaje/`)

| Componente | Para qué |
|---|---|
| `ChipEstado` | Badge del estado con los colores de su familia; los estados en curso tienen un punto que late. |
| `Recorrido` | Lista de paradas con los marcadores del sistema (origen naranja, parada gris, destino cuadrado). Las hechas en verde con horas reales; la actual resaltada. `partirDireccion()` separa calle y localidad. |
| `DatosViaje` | Grilla de dato y valor en dos columnas («A confirmar» si falta). `datosBasicos(v)` arma condiciones, distancia y tiempo **sin precio**. |
| `TarjetaViaje` | Card de viaje del conductor, compacta (una línea con todo) o completa (recorrido y datos). Nunca muestra precio. |
| `MapaRecorrido` | Mapa con la ruta planeada (o las paradas unidas), marcadores y la posición del conductor. |

### 4.10 Componentes sueltos (`src/components/`)

| Archivo | Para qué |
|---|---|
| `Isotipo.js` | El isotipo «Carga» en SVG (seis cajas que forman la F). |
| `GoogleLogo.js` | Logo de Google para el botón de login. |
| `FormVehiculo.js` | `useFormVehiculo()` (estado y validación del vehículo) y `CamposVehiculo` (los campos). Lo usan el alta y «Agregar vehículo». |
| `SelectorApariencia.js` | Claro / Oscuro / Sistema; guarda con `setMode`. |
| `MapViewWrapper.js` | Carga `react-native-maps` si existe; si no, muestra un recuadro. En iOS usa Apple Maps hasta tener la clave de Google. |
| `MapViewWrapper.web.js` | Misma API para web, sin importar `react-native-maps` (rompería el bundle). |
| `LocationPickerModal.js` | Heredado del marketplace (elegir dirección con Places). Se puede reusar en la fase 3. |

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
Además, cada pantalla recarga al enfocarse (`useFocusEffect`) y al tirar para abajo.

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

| Evento | Dirección | Dónde |
|---|---|---|
| `viaje:asignado`, `serie:asignada` | servidor → conductor | ViajesScreen |
| `viaje:editado`, `viaje:desasignado`, `viaje:cancelado`, `viaje:vencido` | servidor → conductor | Viajes, Detalle, Activo |
| `conductor:ubicacion` `{ id_viaje, lat, lng, timestamp }` | conductor → servidor | useGpsViaje / locationTask |

## 7. Reglas para escribir código nuevo

- **Colores:** nunca un hexadecimal en una pantalla. `const s = useThemedStyles(createStyles)` con
  `createStyles = (c) => StyleSheet.create({...})`. Probar en claro y en oscuro.
- **Componentes:** primero `components/ui` y `components/viaje`; un estilo nuevo solo si no existe la pieza.
- **Red:** solo desde `services/`, con su rama `DEV_MODE`. Las pantallas no importan axios.
- **Errores:** `mensajeDeError(err, 'texto por defecto')`; mostrar el del backend tal cual cuando es una validación.
- **Tiempo real:** `useEnVivo(EVENTOS, cargar)`; nunca pintar con el contenido del evento.
- **Nada de cálculos de negocio:** si hace falta un número (precio, distancia, ETA), lo trae el backend.
- **Textos:** voseo, «empresa» y «conductor» en lo visible, formatos es-AR, «A confirmar» para lo que falta.
- **El conductor no ve precios.**
- **Documentación:** actualizar este archivo, `PROGRESO.md` y, si corresponde, `ISSUES.md` en el mismo commit.

## 8. Código heredado del marketplace

La versión anterior de la app (fleteros que aceptaban ofertas, gerentes de empresas de transporte). Está fuera de los
flujos nuevos y se borra cuando entre la fase 3:

- `src/screens/cliente/`, `src/screens/fletero/`, `src/screens/gerente/`, `src/screens/auth/_marketplace/`
- `src/navigation/ClienteStack.js` (todavía lo ve la empresa con organización), `FleteroStack.js`, `GerenteStack.js`
- `src/hooks/useMiEmpresa.js`, `src/utils/format.js`, `src/utils/vehiculo.js`, `src/mocks/`
- `src/components/LocationPickerModal.js` (candidato a reusar en «Nuevo viaje»)

## 9. Registro de cambios de este documento

| Fecha | Cambio |
|---|---|
| 27 oct 2026 | Versión inicial: fases 0, 1 y 2 completas, archivo por archivo. |
| 29 oct 2026 | Fase 3 (en curso): utilidades `dinero.js` y `series.js`. |
