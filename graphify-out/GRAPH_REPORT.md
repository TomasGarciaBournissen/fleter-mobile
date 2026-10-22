# Graph Report - fleter-mobile  (2026-10-22)

## Corpus Check
- 130 files · ~398,195 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 110 file(s) not represented in the graph (top: .ttf 54, .csv 53, (none) 2)

## Summary
- 954 nodes · 3231 edges · 45 communities (42 shown, 3 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 195 edges (avg confidence: 0.88)
- Token cost: 208,025 input · 0 output

## Community Hubs (Navigation)
- Reglas del conductor
- Alta y onboarding (fase 1)
- Contrato API y staging
- Firebase y config
- GPS y mapas
- Stacks del marketplace
- Dependencias Expo
- Pruebas de viajes
- Kit UI base
- Config Expo app.json
- Mapa wrapper y legacy
- Tema y apariencia
- Pantallas cliente legacy
- Cambio de enfoque
- Stack fletero legacy
- Endpoints viajes legacy
- Eventos socket
- package.json
- Pruebas de identidad
- Sistema de diseño
- Plan de fases original
- Navegación por rol
- Ciclo del viaje interno
- Auth y afiliaciones API
- Endpoints empresas legacy
- Plan mobile empresa
- Historial cliente
- Historial fletero
- Arranque de la app
- Historial empresa legacy
- Producto y roles
- Selector de ubicación
- Socket cliente
- Disponibles gerente
- Endpoints admin
- Vehículos API
- Login con Google
- Vencimientos y avisos
- Rol empresa legacy
- Mocks web
- Scripts npm
- Reglas de inicio y cierre
- Seguridad de tokens
- Firebase auth nativo

## God Nodes (most connected - your core abstractions)
1. `useThemedStyles()` - 129 edges
2. `useTheme()` - 127 edges
3. `react` - 94 edges
4. `react-native` - 74 edges
5. `useAuth()` - 49 edges
6. `Boton()` - 48 edges
7. `Pantalla()` - 48 edges
8. `Titulo()` - 46 edges
9. `@expo/vector-icons` - 43 edges
10. `Nota()` - 39 edges

## Surprising Connections (you probably didn't know these)
- `Kit de componentes compartidos (fase 0)` --semantically_similar_to--> `Componentes base src/components/ui`  [INFERRED] [semantically similar]
  docs/PLAN_MOBILE_PYME.md → CLAUDE.md
- `Toda pantalla en modo claro y oscuro` --references--> `useTheme()`  [INFERRED]
  CLAUDE.md → src/context/ThemeContext.js
- `Toda pantalla en modo claro y oscuro` --references--> `useThemedStyles()`  [INFERRED]
  CLAUDE.md → src/context/ThemeContext.js
- `Plan mobile PyME + conductores por fases (0 a 4)` --conceptually_related_to--> `Radio de 50 m no hardcodeado en mobile`  [INFERRED]
  docs/PLAN_MOBILE_PYME.md → ISSUES.md
- `Plan mobile PyME + conductores por fases (0 a 4)` --conceptually_related_to--> `Remito con foto (en desarrollo)`  [INFERRED]
  docs/PLAN_MOBILE_PYME.md → ISSUES.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo del viaje del conductor: confirmar, iniciar, parada por parada y viaje terminado** — src_screens_conductor_viajesscreen, src_screens_conductor_detalleviajescreen, src_screens_conductor_viajeactivoscreen, src_screens_conductor_viajeterminadoscreen, src_hooks_usegpsviaje, src_hooks_useenvivo, src_services_viajesconductor [EXTRACTED 1.00]
- **Propuesta para desvincular sin cancelar viajes en curso** — issues_desvincular_cancela_viajes, issues_409_viaje_en_curso, issues_vista_previa_desvinculacion, issues_series_liberar, issues_estado_interrumpido [EXTRACTED 1.00]
- **Pruebas de contrato de los pasos 1 a 4 del backend contra staging** — scripts_api_tests_organizaciones, scripts_api_tests_viajes, scripts_api_tests_series, docs_cambio_de_enfoque_pasos_backend, claude_staging_backend [INFERRED 0.95]

## Communities (45 total, 3 thin omitted)

### Community 0 - "Reglas del conductor"
Cohesion: 0.06
Nodes (89): Issue #3: el conductor no recibe ETA, desvíos ni ventana de inicio, Campos ventana_inicio_desde / ventana_inicio_hasta, ConductorStack (Viajes / Historial / Perfil), Prototipo fleter-mobile-fase2-conductor.html, Rediseño fase 2: conductor, @react-navigation/native, createStyles(), HojaInferior() (+81 more)

### Community 1 - "Alta y onboarding (fase 1)"
Cohesion: 0.09
Nodes (79): OnboardingEmpresaStack, Rediseño fase 0 + 1: entrada y alta, CamposVehiculo(), s, useFormVehiculo(), GoogleLogo(), Boton(), createStyles() (+71 more)

### Community 2 - "Contrato API y staging"
Cohesion: 0.07
Nodes (49): Contrato vigente: API.md del backend, branch develop, services/socket.js socket.io client, Backend de staging (Railway), Backend pasos 1 a 4 probados en staging, API key de Google comprometida en app.json, Backend no procesa viaje:aceptar, DisponiblesScreen, fecha_programada minima desincronizada mobile/backend (+41 more)

### Community 3 - "Firebase y config"
Cohesion: 0.08
Nodes (38): firebase, @react-native-community/datetimepicker, react-native-svg, Isotipo(), DEV_MODE, AuthContext, AuthProvider(), DEV_USERS (+30 more)

### Community 4 - "GPS y mapas"
Cohesion: 0.09
Nodes (40): GPS background (componente mas critico), ViajeActivoFleteroScreen, expo-location, MapView, Marker(), Polyline(), MapaRecorrido(), s (+32 more)

### Community 5 - "Stacks del marketplace"
Cohesion: 0.12
Nodes (27): @react-navigation/bottom-tabs, @react-navigation/native-stack, useMiEmpresa(), Stack, Tab, AsignarConductorScreen(), createStyles(), cumpleCondiciones() (+19 more)

### Community 6 - "Dependencias Expo"
Cohesion: 0.06
Nodes (35): dependencies, axios, expo, expo-auth-session, expo-camera, expo-clipboard, expo-crypto, expo-font (+27 more)

### Community 7 - "Pruebas de viajes"
Cohesion: 0.13
Nodes (30): api(), BASE, casi(), conectar(), crearPyme(), crearUsuario(), crearVehiculo(), cuitValido() (+22 more)

### Community 8 - "Kit UI base"
Cohesion: 0.17
Nodes (17): Componentes base src/components/ui, react, react-native, react-native-safe-area-context, MapView, PROVIDER_GOOGLE, createStyles(), DIAS (+9 more)

### Community 9 - "Config Expo app.json"
Cohesion: 0.07
Nodes (28): backgroundColor, foregroundImage, adaptiveIcon, config, edgeToEdgeEnabled, googleMaps, googleMapsApiKey, expo (+20 more)

### Community 10 - "Mapa wrapper y legacy"
Cohesion: 0.15
Nodes (19): @expo/vector-icons, PROVIDER_GOOGLE, createStyles(), CuentaPendienteScreen(), InfoRow(), BuscandoFleteroScreen(), createStyles(), ESTADO_BADGE_LABELS (+11 more)

### Community 11 - "Tema y apariencia"
Cohesion: 0.17
Nodes (21): createStyles(), OPCIONES, SelectorApariencia(), useThemedStyles(), createStyles(), FilaPerfil(), PerfilScreen(), SeccionCard() (+13 more)

### Community 12 - "Pantallas cliente legacy"
Cohesion: 0.19
Nodes (19): Stack, CalificacionScreen(), createStyles(), COND_COLORS(), COND_LABELS, ConfirmacionViajeScreen(), createStyles(), FilaInfo() (+11 more)

### Community 13 - "Cambio de enfoque"
Cohesion: 0.13
Nodes (21): Flag CALIFICACIONES_HABILITADAS=false, Flag MARKETPLACE_HABILITADO=false, Lugares guardados, Marketplace fase 2: horas ociosas de choferes de confianza, Marketplace de fletes original (Uber para camiones), Pivot a herramienta B2B de gestión de viajes para PyMEs, Viajes recurrentes (series a 30 días), Suscripción mensual fija por PyME (+13 more)

### Community 14 - "Stack fletero legacy"
Cohesion: 0.14
Nodes (17): Stack, Tab, AsignadosScreen(), createStyles(), mapViaje(), ViajeCard(), createStyles(), DisponiblesScreen() (+9 more)

### Community 15 - "Endpoints viajes legacy"
Cohesion: 0.10
Nodes (21): GET /api/viajes/asignados, GET /api/viajes/disponibles, GET /api/viajes/:id, GET /api/viajes/:id/costo-acumulado, GET /api/viajes/:id/qr-paradas, GET /api/viajes/:id/remito, GET /api/viajes/mis-viajes, GET /api/viajes/mis-viajes-conductor (+13 more)

### Community 16 - "Eventos socket"
Cohesion: 0.12
Nodes (18): alerta:desvio, alerta:parada, conductor:ubicacion, viaje:aceptar, viaje:asignado, viaje:cancelado_por_admin, viaje:cancelado_sin_conductor, viaje:conductor_asignado (+10 more)

### Community 17 - "package.json"
Cohesion: 0.11
Nodes (17): main, name, private, version, axios, expo-camera, expo-clipboard, expo-crypto (+9 more)

### Community 18 - "Pruebas de identidad"
Cohesion: 0.25
Nodes (16): api(), BASE, conGuiones(), crearUsuario(), cuitValido(), dvMalo(), espera(), extra() (+8 more)

### Community 19 - "Sistema de diseño"
Cohesion: 0.17
Nodes (11): src/theme.js design tokens, Color tema claro, Color tema oscuro, Componentes RN (equivalentes BEM), Espaciado, radios, sombras, controles, Marca Fleter (ex Movix), Naranja primario #E85D2A, Navegacion UX (+3 more)

### Community 20 - "Plan de fases original"
Cohesion: 0.19
Nodes (16): Algoritmo estimacion de costo (hora CABA/km Provincia), Fase 0 Fundaciones, Fase 1 Usuarios y Registro, Fase 10 Pulido Seguridad Produccion, Fase 2 Creacion y Publicacion de Viajes, Fase 4 El Viaje en Vivo, Fase 5 Confirmacion y Cierre, Fase 6 Pagos Completos (+8 more)

### Community 21 - "Navegación por rol"
Cohesion: 0.24
Nodes (13): FleteroStack, RootNavigator (role from JWT), AuthStack(), ClienteStack(), ConductorStack(), FleteroStack(), GerenteStack(), OnboardingEmpresaStack() (+5 more)

### Community 22 - "Ciclo del viaje interno"
Cohesion: 0.15
Nodes (13): Ciclo del viaje interno (ASIGNADO a FINALIZADO), Remito PDF, Google Routes API (tiempos de manejo y peón), Room socket empresa:{id}, Evento viaje:cancelado, Bloqueo 409 VIAJE_EN_CURSO al desvincular (forzar=true), Issue #1: desvincular a un conductor cancela viajes en curso, Estado INTERRUMPIDO con remito parcial (+5 more)

### Community 23 - "Auth y afiliaciones API"
Cohesion: 0.15
Nodes (12): Afiliaciones endpoints, API contract (api.md), Auth endpoints (/api/auth), DELETE /api/afiliaciones/:id, GET /api/afiliaciones/mias, GET /api/auth/me, POST /api/afiliaciones, POST /api/auth/login (+4 more)

### Community 24 - "Endpoints empresas legacy"
Cohesion: 0.15
Nodes (13): DELETE /api/empresas/:id/conductores/:idc, DELETE /api/empresas/:id/vehiculos/:idv, Empresas endpoints (/api/empresas), GET /api/empresas/:id, GET /api/empresas/:id/conductores, GET /api/empresas/:id/vehiculos, GET /api/empresas/:id/viajes, GET /api/empresas/:id/viajes-disponibles (+5 more)

### Community 25 - "Plan mobile empresa"
Cohesion: 0.17
Nodes (9): ClienteStack, Seguimiento en vivo de la PyME (mapa, ETA, alertas), Fuera de alcance del mobile (dashboard web, admin, marketplace), Kit de componentes compartidos (fase 0), Plan mobile PyME + conductores por fases (0 a 4), PymeStack (Inicio, Viajes, Nuevo, Conductores, Más), Servicios por dominio (organizaciones, invitaciones, viajesPyme, viajesConductor, lugares, series, vehiculos), useEventosEnVivo (+1 more)

### Community 26 - "Historial cliente"
Cohesion: 0.29
Nodes (11): agruparPorMes(), claveMes(), createStyles(), EstadoBadge(), estadoInfo(), ESTADOS_TERMINALES, FILTROS, formatFecha() (+3 more)

### Community 27 - "Historial fletero"
Cohesion: 0.31
Nodes (10): agruparPorMes(), createStyles(), EstadoBadge(), estadoInfo(), ESTADOS_EN_CURSO, FILTROS, formatFecha(), HistorialFleteroScreen() (+2 more)

### Community 28 - "Arranque de la app"
Cohesion: 0.24
Nodes (8): App(), expo, expo-font, @expo-google-fonts/archivo-black, @expo-google-fonts/jetbrains-mono, @expo-google-fonts/josefin-sans, @expo-google-fonts/manrope, ThemeProvider()

### Community 29 - "Historial empresa legacy"
Cohesion: 0.33
Nodes (9): agruparPorMes(), createStyles(), EstadoBadge(), estadoInfo(), ESTADOS_EN_CURSO, FILTROS, formatFecha(), HistorialEmpresaScreen() (+1 more)

### Community 30 - "Producto y roles"
Cohesion: 0.25
Nodes (8): Fleter mobile app (React Native + Expo), Rol CLIENTE (PyME), Rol FLETERO (conductor), Código de invitación XXXXX-XXXXX (un uso, 72 h), Organización PyME (RESPONSABLE / MIEMBRO), Precio único e informativo por viaje, calcularEstimacion, CodigoInvitacion (FLT-XXXX-XXXX, solo hash)

### Community 31 - "Selector de ubicación"
Cohesion: 0.46
Nodes (7): @react-native-async-storage/async-storage, autocomplete(), createStyles(), fetchDetails(), guardarEnHistorial(), leerHistorial(), LocationPickerModal()

### Community 32 - "Socket cliente"
Cohesion: 0.39
Nodes (5): socket.io-client, SocketContext, SocketProvider(), conectarSocket(), desconectarSocket()

### Community 33 - "Disponibles gerente"
Cohesion: 0.43
Nodes (7): createStyles(), DisponiblesGerenteScreen(), mapViaje(), TAG_COLORS(), TAG_LABELS, TagRequisito(), ViajeCard()

### Community 34 - "Endpoints admin"
Cohesion: 0.29
Nodes (7): Admin endpoints, GET /api/admin/estadisticas, GET /api/admin/usuarios, GET /api/admin/usuarios/:id, GET /api/admin/viajes, GET /api/admin/viajes/:id, POST /api/admin/viajes/:id/cancelar

### Community 35 - "Vehículos API"
Cohesion: 0.29
Nodes (7): Conductores vehiculos endpoints, DELETE /api/conductores/mis-vehiculos/:id, DELETE /api/conductores/mis-vehiculos/:id/condiciones/:condicion, GET /api/conductores/mis-vehiculos, POST /api/conductores/mis-vehiculos, POST /api/conductores/mis-vehiculos/:id/condiciones/:condicion, PUT /api/conductores/mis-vehiculos/:id

### Community 36 - "Login con Google"
Cohesion: 0.33
Nodes (6): expo-auth-session, expo-web-browser, loginGoogle(), GOOGLE_CONFIGURADO, IDS, useGoogleLogin()

### Community 37 - "Vencimientos y avisos"
Cohesion: 0.33
Nodes (6): Ventana de inicio (-1 h / +1,5 h) y paso a VENCIDO, Issue #2: avisar antes de que un viaje pase a VENCIDO, Push notifications (FCM) sin integrar, Evento viaje:por_vencer, Límite de canjes: 5 cada 15 min por IP (429), Modos de prueba principal / extra / vencido

### Community 38 - "Rol empresa legacy"
Cohesion: 0.50
Nodes (5): EmpresaUsuario, requireEmpresaMiembro, Rol EMPRESA (GERENTE como alias legacy), Rol GERENTE (empresa), useMiEmpresa hook

### Community 39 - "Mocks web"
Cohesion: 0.40
Nodes (5): browser, @react-native-firebase/app, @react-native-firebase/auth, @react-native-google-signin/google-signin, react-native-keychain

### Community 40 - "Scripts npm"
Cohesion: 0.40
Nodes (5): scripts, android, ios, start, web

### Community 41 - "Reglas de inicio y cierre"
Cohesion: 0.50
Nodes (3): Cierre forzado por ADMIN, ViajeEvento (auditoría), Iniciar viaje manual (POST /iniciar)

## Knowledge Gaps
- **95 isolated node(s):** `expo-camera`, `expo-crypto`, `expo-status-bar`, `react-dom`, `react-native-google-places-autocomplete` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 271 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Issue #1: desvincular a un conductor cancela viajes en curso` connect `Ciclo del viaje interno` to `Reglas del conductor`, `Contrato API y staging`, `Pruebas de viajes`, `Cambio de enfoque`, `Plan mobile empresa`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **What connects `expo-camera`, `expo-crypto`, `expo-status-bar` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Reglas del conductor` be split into smaller, more focused modules?**
  _Cohesion score 0.06178608515057113 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Kit UI base` to `Reglas del conductor`, `Alta y onboarding (fase 1)`, `Firebase y config`, `GPS y mapas`, `Stacks del marketplace`, `Mapa wrapper y legacy`, `Tema y apariencia`, `Pantallas cliente legacy`, `Stack fletero legacy`, `package.json`, `Navegación por rol`, `Historial cliente`, `Historial fletero`, `Arranque de la app`, `Historial empresa legacy`, `Selector de ubicación`, `Socket cliente`, `Disponibles gerente`, `Login con Google`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Should `Alta y onboarding (fase 1)` be split into smaller, more focused modules?**
  _Cohesion score 0.08757355486327449 - nodes in this community are weakly interconnected._
- **Why does `useTheme()` connect `Kit UI base` to `Reglas del conductor`, `Alta y onboarding (fase 1)`, `Disponibles gerente`, `Firebase y config`, `GPS y mapas`, `Stacks del marketplace`, `Mapa wrapper y legacy`, `Tema y apariencia`, `Pantallas cliente legacy`, `Stack fletero legacy`, `Sistema de diseño`, `Navegación por rol`, `Historial cliente`, `Historial fletero`, `Historial empresa legacy`, `Selector de ubicación`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `Contrato API y staging` be split into smaller, more focused modules?**
  _Cohesion score 0.06531204644412192 - nodes in this community are weakly interconnected._