# Graph Report - fleter-mobile  (2026-10-19)

## Corpus Check
- 63 files · ~331,367 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 110 file(s) not represented in the graph (top: .ttf 54, .csv 53, (none) 2)

## Summary
- 567 nodes · 1547 edges · 23 communities (20 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.85)
- Token cost: 82,688 input · 0 output

## Community Hubs (Navigation)
- Componentes UI compartidos
- Auth y Firebase
- Contrato API general
- GPS y viaje activo
- Arranque de la app
- Pantallas cliente
- Dependencias npm
- Config Expo
- Disponibles fletero
- Navegación por rol
- Endpoints de viajes
- Registro de pantallas
- Eventos socket de alertas
- Sistema de diseño v2
- Endpoints de empresas
- Crear viaje y bugs conocidos
- Endpoints de auth
- Selector de ubicación
- Viajes disponibles
- Tracking GPS conductor
- Firebase Auth nativo
- Contexto CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 79 edges
2. `useThemedStyles()` - 68 edges
3. `react` - 46 edges
4. `react-native` - 38 edges
5. `formatPrecio()` - 37 edges
6. `fontSize` - 36 edges
7. `spacing` - 36 edges
8. `PROGRESO.md registro de progreso` - 36 edges
9. `radius` - 35 edges
10. `@expo/vector-icons` - 31 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `AuthProvider()`  [EXTRACTED]
  App.js → src/context/AuthContext.js
- `App()` --calls--> `RootNavigator()`  [EXTRACTED]
  App.js → src/navigation/RootNavigator.js
- `App()` --calls--> `SocketProvider()`  [EXTRACTED]
  App.js → src/context/SocketContext.js
- `App()` --calls--> `ThemeProvider()`  [EXTRACTED]
  App.js → src/context/ThemeContext.js
- `RootNavigator (role from JWT)` --references--> `AuthStack`  [INFERRED]
  CLAUDE.md → PROGRESO.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Matching en tiempo real flow** — api_event_viaje_disponible, api_event_viaje_aceptar, api_event_viaje_ya_asignado, api_event_viaje_conductor_asignado, progreso_nuevoviajemodal, progreso_buscandofleteroscreen [INFERRED 0.85]
- **Gerente reserva y asigna viaje** — progreso_disponiblesgerentescreen, progreso_detalleviajegerentescreen, progreso_asignarconductorscreen, api_event_viaje_reservado [INFERRED 0.85]
- **Cliente crea y publica viaje** — progreso_crearviajescreen, progreso_confirmacionviajescreen, progreso_buscandofleteroscreen, api_post_api_viajes [EXTRACTED 1.00]

## Communities (23 total, 3 thin omitted)

### Community 0 - "Componentes UI compartidos"
Cohesion: 0.08
Nodes (75): @expo/vector-icons, react, react-native, createStyles(), OPCIONES, SelectorApariencia(), ThemeContext, useTheme() (+67 more)

### Community 1 - "Auth y Firebase"
Cohesion: 0.08
Nodes (40): firebase, @react-native-community/datetimepicker, @react-navigation/native-stack, Isotipo(), AuthContext, AuthProvider(), DEV_MODE, DEV_USERS (+32 more)

### Community 2 - "Contrato API general"
Cohesion: 0.05
Nodes (46): Admin endpoints, Afiliaciones endpoints, API contract (api.md), Conductores vehiculos endpoints, DELETE /api/afiliaciones/:id, DELETE /api/conductores/mis-vehiculos/:id, DELETE /api/conductores/mis-vehiculos/:id/condiciones/:condicion, viaje:ya_asignado (+38 more)

### Community 3 - "GPS y viaje activo"
Cohesion: 0.09
Nodes (42): expo-location, expo-task-manager, MapView, Marker(), Polyline(), PROVIDER_GOOGLE, useSocket(), createStyles() (+34 more)

### Community 4 - "Arranque de la app"
Cohesion: 0.06
Nodes (39): App(), browser, @react-native-firebase/app, @react-native-firebase/auth, @react-native-google-signin/google-signin, react-native-keychain, main, name (+31 more)

### Community 5 - "Pantallas cliente"
Cohesion: 0.12
Nodes (30): Stack, CalificacionScreen(), createStyles(), COND_COLORS(), COND_LABELS, ConfirmacionViajeScreen(), createStyles(), FilaInfo() (+22 more)

### Community 6 - "Dependencias npm"
Cohesion: 0.06
Nodes (31): dependencies, axios, expo, expo-camera, expo-font, @expo-google-fonts/archivo-black, @expo-google-fonts/jetbrains-mono, @expo-google-fonts/josefin-sans (+23 more)

### Community 7 - "Config Expo"
Cohesion: 0.07
Nodes (28): backgroundColor, foregroundImage, adaptiveIcon, config, edgeToEdgeEnabled, googleMaps, googleMapsApiKey, expo (+20 more)

### Community 8 - "Disponibles fletero"
Cohesion: 0.13
Nodes (22): @react-navigation/native, createStyles(), DisponiblesScreen(), ESTADOS_ACTIVOS, mapViaje(), TAG_COLORS(), TAG_LABELS, TagRequisito() (+14 more)

### Community 9 - "Navegación por rol"
Cohesion: 0.13
Nodes (19): @react-navigation/bottom-tabs, AuthStack(), ClienteStack(), FleteroStack(), Stack, Tab, GerenteStack(), RolNoSoportado() (+11 more)

### Community 10 - "Endpoints de viajes"
Cohesion: 0.09
Nodes (22): GET /api/viajes/:id, GET /api/viajes/:id/costo-acumulado, GET /api/viajes/:id/qr-paradas, GET /api/viajes/:id/remito, GET /api/viajes/mis-viajes, GET /api/viajes/mis-viajes-conductor, PATCH /api/viajes/:id/estado, POST /api/viajes (+14 more)

### Community 11 - "Registro de pantallas"
Cohesion: 0.18
Nodes (18): AsignarConductorScreen, AuthStack, CobroScreen, ConductoresScreen, CuentaPendienteScreen, DetalleViajeGerenteScreen, EmpresaHomeScreen, FlotaScreen (+10 more)

### Community 12 - "Eventos socket de alertas"
Cohesion: 0.12
Nodes (17): alerta:desvio, alerta:parada, viaje:asignado, viaje:cancelado_por_admin, viaje:cancelado_sin_conductor, viaje:conductor_asignado, viaje:estado_cambiado, viaje:finalizado (+9 more)

### Community 13 - "Sistema de diseño v2"
Cohesion: 0.18
Nodes (12): src/theme.js design tokens, Color tema claro, Color tema oscuro, Componentes RN (equivalentes BEM), Espaciado, radios, sombras, controles, Estados del viaje: 5 familias, 9 estados, Marca Fleter (ex Movix), Naranja primario #E85D2A (+4 more)

### Community 14 - "Endpoints de empresas"
Cohesion: 0.15
Nodes (13): DELETE /api/empresas/:id/conductores/:idc, DELETE /api/empresas/:id/vehiculos/:idv, Empresas endpoints (/api/empresas), GET /api/empresas/:id, GET /api/empresas/:id/conductores, GET /api/empresas/:id/vehiculos, GET /api/empresas/:id/viajes, GET /api/empresas/mias (+5 more)

### Community 15 - "Crear viaje y bugs conocidos"
Cohesion: 0.22
Nodes (9): viaje:aceptar, POST /api/viajes/estimar-costo, Firebase Authentication, Backend no procesa viaje:aceptar, CrearViajeScreen, fecha_programada minima desincronizada mobile/backend, Login web falla (Firebase SDK), LoginScreen (+1 more)

### Community 16 - "Endpoints de auth"
Cohesion: 0.25
Nodes (8): Auth endpoints (/api/auth), GET /api/auth/me, POST /api/auth/login, POST /api/auth/registro-cliente, POST /api/auth/registro-conductor, POST /api/auth/registro-gerente, PUT /api/auth/perfil, RegisterClienteScreen

### Community 17 - "Selector de ubicación"
Cohesion: 0.46
Nodes (7): @react-native-async-storage/async-storage, autocomplete(), createStyles(), fetchDetails(), guardarEnHistorial(), leerHistorial(), LocationPickerModal()

### Community 18 - "Viajes disponibles"
Cohesion: 0.40
Nodes (5): viaje:disponible, GET /api/empresas/:id/viajes-disponibles, GET /api/viajes/disponibles, DisponiblesGerenteScreen, DisponiblesScreen

### Community 19 - "Tracking GPS conductor"
Cohesion: 0.67
Nodes (3): conductor:ubicacion, POST /api/viajes/:id/iniciar, ViajeActivoFleteroScreen

## Knowledge Gaps
- **68 isolated node(s):** `expo-camera`, `expo-status-bar`, `react-dom`, `react-native-google-places-autocomplete`, `react-native-keychain` (+63 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 193 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PROGRESO.md registro de progreso` connect `Registro de pantallas` to `Auth y Firebase`, `Arranque de la app`, `Endpoints de viajes`, `Eventos socket de alertas`, `Endpoints de empresas`, `Crear viaje y bugs conocidos`, `Endpoints de auth`, `Viajes disponibles`, `Tracking GPS conductor`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **What connects `expo-camera`, `expo-status-bar`, `react-dom` to the rest of the system?**
  _68 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Componentes UI compartidos` be split into smaller, more focused modules?**
  _Cohesion score 0.07555555555555556 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Componentes UI compartidos` to `Auth y Firebase`, `GPS y viaje activo`, `Arranque de la app`, `Pantallas cliente`, `Disponibles fletero`, `Navegación por rol`, `Selector de ubicación`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Should `Auth y Firebase` be split into smaller, more focused modules?**
  _Cohesion score 0.07896575821104122 - nodes in this community are weakly interconnected._
- **Why does `services/socket.js socket.io client` connect `Contrato API general` to `Eventos socket de alertas`, `Arranque de la app`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Should `Contrato API general` be split into smaller, more focused modules?**
  _Cohesion score 0.050980392156862744 - nodes in this community are weakly interconnected._