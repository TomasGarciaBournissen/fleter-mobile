# Graph Report - fleter-mobile  (2026-10-27)

## Corpus Check
- 299 files · ~409,431 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 110 file(s) not represented in the graph (top: .ttf 54, .csv 53, (none) 2)

## Summary
- 4163 nodes · 7608 edges · 228 communities (188 shown, 40 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 498 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `da062b12`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Reglas del conductor
- Alta y onboarding (fase 1)
- Problemas conocidos
- AuthContext.js
- GPS y mapas
- Stacks del marketplace
- Dependencias Expo
- Pruebas de viajes
- HojaCalendario.js
- Config Expo app.json
- theme.js
- PerfilFleteroScreen.js
- Pantallas cliente legacy
- Cambio de enfoque
- Stack fletero legacy
- Endpoints viajes legacy
- Eventos socket
- package.json
- Pruebas de identidad
- Sistema de diseño
- Plan de fases original
- RootNavigator.js
- Ciclo del viaje interno
- Auth y afiliaciones API
- Endpoints empresas legacy
- ShadcnInstaller
- Historial cliente
- Historial fletero
- Arranque de la app
- validate_data.py
- Rediseño fase 2: conductor
- scripts/core.py
- Socket cliente
- Disponibles gerente
- Endpoints admin
- Vehículos API
- pathlib
- Vencimientos y avisos
- test_sync_brand_to_tokens.py
- Mocks web
- Scripts npm
- Reglas de inicio y cierre
- Seguridad de tokens
- gray
- argparse
- Security Checklist
- test_icon_generate.py
- Tailwind CSS Utility Reference
- Test-Driven Development Workflow
- Coding Standards & Best Practices
- object
- DesignSystemGenerator
- Brand Guidelines v1.0
- logo/generate.py
- Design
- json
- Canvas Design System
- design_system.py
- slide_search_core.py
- conductor/PerfilScreen.js
- test_data_contracts.py
- Form & Input Components
- Tailwind CSS Responsive Design
- ClickHouse Analytics Patterns
- Typography Specifications
- html-token-validator.py
- E2E Test Runner
- Security Reviewer
- useThemedStyles
- Logo Usage Rules
- Component Specifications
- shadcn/ui Accessibility Patterns
- architect.md
- Documentation & Codemap Specialist
- cip/core.py
- icon/generate.py
- Build Error Resolver
- tdd-guide.md
- Backend Development Patterns
- Asset Approval Checklist
- Logo AI Prompt Engineering
- UI Styling Skill
- Color Palette Management
- CIP Deliverable Guide
- States and Variants
- Eval Harness Skill
- Refactor & Dead Code Cleaner
- Workflow
- Design System
- Frontend Development Patterns
- Industry-Specific Design Languages
- Tailwind CSS Customization
- mensajeDeError
- spacing
- Design Process
- TestTailwindConfigGenerator
- test_design_system_mode.py
- Routing by Task Type
- shadcn/ui Theming & Customization
- TailwindConfigGenerator
- Asset Organization Guide
- Primary Color Meanings
- Core Logo Types
- color
- Project Guidelines Skill (Example)
- Run the generated test
- Brand Consistency Checklist
- CIP Mockup Prompt Engineering
- Color Semantics
- _select_palette_for_mode
- UI/UX Pro Max - Design Intelligence
- Orchestrate Command
- Design Principles
- Design Principles
- fontSize
- extract-colors.cjs
- sync-brand-to-tokens.cjs
- CIP Design Reference
- Icon Design Reference
- Copywriting Formulas
- Copywriting Formulas
- _palette_is_dark
- CatalogRefreshTest
- Banner Design - Multi-Format Creative Banner System
- Messaging Framework
- Brand Voice Framework
- validate-asset.cjs
- Layout Patterns
- Tailwind Integration
- radius
- Layout Patterns
- TestWebStackFreshness
- TDD Command
- update.md
- Logo Design Reference
- Token Architecture
- design-tokens-starter.json
- .test_node_check_parses_generated_config
- Pre-Delivery Checklist (canonical — the only one)
- Quick Reference
- TestDomainDetection
- TestSearchDomains
- Verification Phases
- useTheme
- Primitive Tokens
- embed-tokens.cjs
- validate-tokens.cjs
- card
- _style_is_dark_primary
- planner.md
- Core Visual Elements
- inject-brand-context.cjs
- Brand
- CIP Design Style Guide
- main
- TestNativeDesktopStackFreshness
- Package Manager Setup
- Slide Strategies
- Component Tokens
- generate-tokens.cjs
- button
- duration
- Slide Strategies
- Fleter Mobile — Arquitectura y archivos
- Plan Command
- BM25
- BM25
- BM25
- TestStyleTaxonomy
- code-reviewer.md
- Checkpoint Command
- Eval Command
- Continuous Learning Skill
- input
- Strategic Compact Skill
- /learn - Extract Reusable Patterns
- Slides Reference
- HTML Slide Template
- Frontend Design
- HTML Slide Template
- Slides
- _filter_anti_patterns_for_mode
- TestThresholdGate
- RegisterFleteroScreen.js
- Contrato vigente: API.md del backend, branch develop
- CatalogSummaryLineEndingsTest
- TestTokenizer
- Verification Command
- Brand Guidelines Template
- $type
- radius
- lg
- sm
- TestBm25CoreBehavior
- TestStackFlagWithDesignSystem
- TestMetricMath
- padding-y
- xl
- none
- TestFixtureValidation
- 16
- 1
- 3
- 8
- destructive
- destructive-foreground
- muted
- primary-foreground
- ring
- secondary-foreground
- CLAUDE.md
- build-fix.md
- code-review.md
- refactor-clean.md
- test-coverage.md
- update-codemaps.md
- update-docs.md
- evaluate-session.sh
- slides-create.md
- create.md
- suggest-compact.sh

## God Nodes (most connected - your core abstractions)
1. `useThemedStyles()` - 129 edges
2. `useTheme()` - 128 edges
3. `react` - 94 edges
4. `react-native` - 74 edges
5. `TailwindConfigGenerator` - 60 edges
6. `Boton()` - 50 edges
7. `Pantalla()` - 50 edges
8. `useAuth()` - 49 edges
9. `Titulo()` - 47 edges
10. `@expo/vector-icons` - 43 edges

## Surprising Connections (you probably didn't know these)
- `5.6 Tiempo real` --references--> `useEnVivo()`  [INFERRED]
  docs/ARQUITECTURA.md → src/hooks/useEnVivo.js
- `4.4 Servicios (`src/services/`)` --references--> `registroGerente()`  [INFERRED]
  docs/ARQUITECTURA.md → src/services/auth.js
- `4.4 Servicios (`src/services/`)` --references--> `getSocket()`  [INFERRED]
  docs/ARQUITECTURA.md → src/services/socket.js
- `Kit de componentes compartidos (fase 0)` --semantically_similar_to--> `Componentes base src/components/ui`  [INFERRED] [semantically similar]
  docs/PLAN_MOBILE_PYME.md → CLAUDE.md
- `4.8 Kit de UI (`src/components/ui/`)` --references--> `HojaCalendario()`  [INFERRED]
  docs/ARQUITECTURA.md → src/components/ui/HojaCalendario.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo del viaje del conductor: confirmar, iniciar, parada por parada y viaje terminado** — src_screens_conductor_viajesscreen, src_screens_conductor_detalleviajescreen, src_screens_conductor_viajeactivoscreen, src_screens_conductor_viajeterminadoscreen, src_hooks_usegpsviaje, src_hooks_useenvivo, src_services_viajesconductor [EXTRACTED 1.00]
- **Propuesta para desvincular sin cancelar viajes en curso** — issues_desvincular_cancela_viajes, issues_409_viaje_en_curso, issues_vista_previa_desvinculacion, issues_series_liberar, issues_estado_interrumpido [EXTRACTED 1.00]
- **Pruebas de contrato de los pasos 1 a 4 del backend contra staging** — scripts_api_tests_organizaciones, scripts_api_tests_viajes, scripts_api_tests_series, docs_cambio_de_enfoque_pasos_backend, claude_staging_backend [INFERRED 0.95]

## Communities (228 total, 40 thin omitted)

### Community 0 - "Reglas del conductor"
Cohesion: 0.09
Nodes (62): 4.7 Utilidades (`src/utils/`), 4.9 Componentes del viaje (`src/components/viaje/`), ConductorStack (Viajes / Historial / Perfil), @react-navigation/native, ChipEstado(), s, createStyles(), datosBasicos() (+54 more)

### Community 1 - "Alta y onboarding (fase 1)"
Cohesion: 0.11
Nodes (61): 4.12 Pantallas de empresa sin empresa (`src/screens/onboarding/`), 4.8 Kit de UI (`src/components/ui/`), 5. Piezas compartidas, OnboardingEmpresaStack, Rediseño fase 0 + 1: entrada y alta, @react-navigation/native-stack, Boton(), Campo (+53 more)

### Community 2 - "Problemas conocidos"
Cohesion: 0.14
Nodes (13): services/socket.js socket.io client, Seguimiento en vivo de la PyME (mapa, ETA, alertas), useEventosEnVivo, Backend no procesa viaje:aceptar, DisponiblesScreen, fecha_programada minima desincronizada mobile/backend, Entrar con Google sin configurar, Login web falla (Firebase SDK) (+5 more)

### Community 3 - "AuthContext.js"
Cohesion: 0.11
Nodes (26): 5.2 Login, expo-auth-session, expo-web-browser, firebase, GoogleLogo(), DEV_MODE, AuthContext, AuthProvider() (+18 more)

### Community 4 - "GPS y mapas"
Cohesion: 0.10
Nodes (45): GPS background (componente mas critico), 4.6 Tareas (`src/tasks/`), ViajeActivoFleteroScreen, expo-location, react, MapView, Marker(), Polyline() (+37 more)

### Community 5 - "Stacks del marketplace"
Cohesion: 0.09
Nodes (35): @react-navigation/bottom-tabs, useMiEmpresa(), Stack, Tab, AsignarConductorScreen(), createStyles(), cumpleCondiciones(), ConductorCard() (+27 more)

### Community 6 - "Dependencias Expo"
Cohesion: 0.06
Nodes (35): dependencies, axios, expo, expo-auth-session, expo-camera, expo-clipboard, expo-crypto, expo-font (+27 more)

### Community 7 - "Pruebas de viajes"
Cohesion: 0.06
Nodes (61): api(), aUTC(), BASE, conectado(), conectar(), crearPyme(), crearUsuario(), crearVehiculo() (+53 more)

### Community 8 - "HojaCalendario.js"
Cohesion: 0.24
Nodes (8): Componentes base src/components/ui, createStyles(), createStyles(), DIAS, HojaCalendario(), MESES, mismoDia(), CAJAS

### Community 9 - "Config Expo app.json"
Cohesion: 0.07
Nodes (28): backgroundColor, foregroundImage, adaptiveIcon, config, edgeToEdgeEnabled, googleMaps, googleMapsApiKey, expo (+20 more)

### Community 10 - "theme.js"
Cohesion: 0.10
Nodes (29): 4.1 Entrada y configuración, MapView, PROVIDER_GOOGLE, createStyles(), OPCIONES, SelectorApariencia(), createStyles(), CuentaPendienteScreen() (+21 more)

### Community 11 - "PerfilFleteroScreen.js"
Cohesion: 0.26
Nodes (10): CampoTexto(), CONDICIONES, CondTag(), createStyles(), FORM_VACIO, PerfilFleteroScreen(), TIPOS_VEHICULO, VehiculoCard() (+2 more)

### Community 12 - "Pantallas cliente legacy"
Cohesion: 0.15
Nodes (22): @react-native-async-storage/async-storage, autocomplete(), createStyles(), fetchDetails(), guardarEnHistorial(), leerHistorial(), LocationPickerModal(), COND_COLORS() (+14 more)

### Community 13 - "Cambio de enfoque"
Cohesion: 0.08
Nodes (34): Código de invitación XXXXX-XXXXX (un uso, 72 h), Flag CALIFICACIONES_HABILITADAS=false, Flag MARKETPLACE_HABILITADO=false, Lugares guardados, Marketplace fase 2: horas ociosas de choferes de confianza, Marketplace de fletes original (Uber para camiones), Organización PyME (RESPONSABLE / MIEMBRO), Pivot a herramienta B2B de gestión de viajes para PyMEs (+26 more)

### Community 14 - "Stack fletero legacy"
Cohesion: 0.23
Nodes (13): createStyles(), DisponiblesScreen(), ESTADOS_ACTIVOS, mapViaje(), TAG_COLORS(), TAG_LABELS, TagRequisito(), vehiculoPopupKey() (+5 more)

### Community 15 - "Endpoints viajes legacy"
Cohesion: 0.10
Nodes (21): GET /api/viajes/asignados, GET /api/viajes/disponibles, GET /api/viajes/:id, GET /api/viajes/:id/costo-acumulado, GET /api/viajes/:id/qr-paradas, GET /api/viajes/:id/remito, GET /api/viajes/mis-viajes, GET /api/viajes/mis-viajes-conductor (+13 more)

### Community 16 - "Eventos socket"
Cohesion: 0.12
Nodes (18): alerta:desvio, alerta:parada, conductor:ubicacion, viaje:aceptar, viaje:asignado, viaje:cancelado_por_admin, viaje:cancelado_sin_conductor, viaje:conductor_asignado (+10 more)

### Community 17 - "package.json"
Cohesion: 0.11
Nodes (18): main, name, private, version, axios, expo-camera, expo-clipboard, expo-crypto (+10 more)

### Community 18 - "Pruebas de identidad"
Cohesion: 0.25
Nodes (16): api(), BASE, conGuiones(), crearUsuario(), cuitValido(), dvMalo(), espera(), extra() (+8 more)

### Community 19 - "Sistema de diseño"
Cohesion: 0.18
Nodes (11): src/theme.js design tokens, Color tema claro, Color tema oscuro, Componentes RN (equivalentes BEM), Espaciado, radios, sombras, controles, Marca Fleter (ex Movix), Naranja primario #E85D2A, Navegacion UX (+3 more)

### Community 20 - "Plan de fases original"
Cohesion: 0.19
Nodes (16): Algoritmo estimacion de costo (hora CABA/km Provincia), Fase 0 Fundaciones, Fase 1 Usuarios y Registro, Fase 10 Pulido Seguridad Produccion, Fase 2 Creacion y Publicacion de Viajes, Fase 4 El Viaje en Vivo, Fase 5 Confirmacion y Cierre, Fase 6 Pagos Completos (+8 more)

### Community 21 - "RootNavigator.js"
Cohesion: 0.11
Nodes (30): 4.2 Contextos (`src/context/`), 4.3 Navegación (`src/navigation/`), 5.1 Abrir la app, 5.3 Alta de empresa, 5.5 Viaje del conductor, 5.6 Tiempo real, 5. Flujos de punta a punta, 1. Cómo arranca la app (+22 more)

### Community 22 - "Ciclo del viaje interno"
Cohesion: 0.10
Nodes (19): ClienteStack, FleteroStack, RootNavigator (role from JWT), Ciclo del viaje interno (ASIGNADO a FINALIZADO), Remito PDF, Google Routes API (tiempos de manejo y peón), Kit de componentes compartidos (fase 0), Plan mobile PyME + conductores por fases (0 a 4) (+11 more)

### Community 23 - "Auth y afiliaciones API"
Cohesion: 0.15
Nodes (12): Afiliaciones endpoints, API contract (api.md), Auth endpoints (/api/auth), DELETE /api/afiliaciones/:id, GET /api/afiliaciones/mias, GET /api/auth/me, POST /api/afiliaciones, POST /api/auth/login (+4 more)

### Community 24 - "Endpoints empresas legacy"
Cohesion: 0.15
Nodes (13): DELETE /api/empresas/:id/conductores/:idc, DELETE /api/empresas/:id/vehiculos/:idv, Empresas endpoints (/api/empresas), GET /api/empresas/:id, GET /api/empresas/:id/conductores, GET /api/empresas/:id/vehiculos, GET /api/empresas/:id/viajes, GET /api/empresas/:id/viajes-disponibles (+5 more)

### Community 25 - "ShadcnInstaller"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 26 - "Historial cliente"
Cohesion: 0.17
Nodes (17): Stack, agruparPorMes(), claveMes(), createStyles(), EstadoBadge(), estadoInfo(), ESTADOS_TERMINALES, FILTROS (+9 more)

### Community 27 - "Historial fletero"
Cohesion: 0.24
Nodes (13): CalificacionScreen(), createStyles(), agruparPorMes(), createStyles(), EstadoBadge(), estadoInfo(), ESTADOS_EN_CURSO, FILTROS (+5 more)

### Community 28 - "Arranque de la app"
Cohesion: 0.24
Nodes (8): App(), expo, expo-font, @expo-google-fonts/archivo-black, @expo-google-fonts/jetbrains-mono, @expo-google-fonts/josefin-sans, @expo-google-fonts/manrope, ThemeProvider()

### Community 29 - "validate_data.py"
Cohesion: 0.07
Nodes (43): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract(), _check_catalog_contract() (+35 more)

### Community 30 - "Rediseño fase 2: conductor"
Cohesion: 0.18
Nodes (9): Fleter mobile app (React Native + Expo), Rol CLIENTE (PyME), Rol FLETERO (conductor), Precio único e informativo por viaje, calcularEstimacion, Issue #3: el conductor no recibe ETA, desvíos ni ventana de inicio, Campos ventana_inicio_desde / ventana_inicio_hasta, Prototipo fleter-mobile-fase2-conductor.html (+1 more)

### Community 31 - "scripts/core.py"
Cohesion: 0.06
Nodes (31): BM25, _contains_phrase(), detect_domain(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _exact_stack_identifier(), _file_signature() (+23 more)

### Community 32 - "Socket cliente"
Cohesion: 0.40
Nodes (5): socket.io-client, SocketProvider(), conectarSocket(), desconectarSocket(), getSocket()

### Community 33 - "Disponibles gerente"
Cohesion: 0.43
Nodes (7): createStyles(), DisponiblesGerenteScreen(), mapViaje(), TAG_COLORS(), TAG_LABELS, TagRequisito(), ViajeCard()

### Community 34 - "Endpoints admin"
Cohesion: 0.29
Nodes (7): Admin endpoints, GET /api/admin/estadisticas, GET /api/admin/usuarios, GET /api/admin/usuarios/:id, GET /api/admin/viajes, GET /api/admin/viajes/:id, POST /api/admin/viajes/:id/cancelar

### Community 35 - "Vehículos API"
Cohesion: 0.29
Nodes (7): Conductores vehiculos endpoints, DELETE /api/conductores/mis-vehiculos/:id, DELETE /api/conductores/mis-vehiculos/:id/condiciones/:condicion, GET /api/conductores/mis-vehiculos, POST /api/conductores/mis-vehiculos, POST /api/conductores/mis-vehiculos/:id/condiciones/:condicion, PUT /api/conductores/mis-vehiculos/:id

### Community 36 - "pathlib"
Cohesion: 0.05
Nodes (10): GeminiModelIdTests, _load_module(), main(), resolve(), shipped_invocations(), SkillScriptPathsTest, read_rows(), read_rows() (+2 more)

### Community 37 - "Vencimientos y avisos"
Cohesion: 0.33
Nodes (6): Ventana de inicio (-1 h / +1,5 h) y paso a VENCIDO, Issue #2: avisar antes de que un viaje pase a VENCIDO, Push notifications (FCM) sin integrar, Evento viaje:por_vencer, Límite de canjes: 5 cada 15 min por IP (429), Modos de prueba principal / extra / vencido

### Community 38 - "test_sync_brand_to_tokens.py"
Cohesion: 0.07
Nodes (21): _run(), test_creates_default_output_directory_when_missing(), test_dark_base_color_does_not_collapse_shades_to_black(), test_discovered_css_without_tokens_does_not_block_sync(), test_force_allows_sync_with_existing_css_token_source(), test_ignores_commented_root_custom_properties(), test_ignores_custom_properties_outside_root(), test_ignores_external_css_imports() (+13 more)

### Community 39 - "Mocks web"
Cohesion: 0.40
Nodes (5): browser, @react-native-firebase/app, @react-native-firebase/auth, @react-native-google-signin/google-signin, react-native-keychain

### Community 40 - "Scripts npm"
Cohesion: 0.40
Nodes (5): scripts, android, ios, start, web

### Community 41 - "Reglas de inicio y cierre"
Cohesion: 0.50
Nodes (3): Cierre forzado por ADMIN, ViajeEvento (auditoría), Iniciar viaje manual (POST /iniciar)

### Community 43 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 45 - "argparse"
Cohesion: 0.06
Nodes (22): build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main(), generate_html() (+14 more)

### Community 46 - "Security Checklist"
Cohesion: 0.04
Nodes (48): 10. Dependency Security, 1. Secrets Management, 2. Input Validation, 3. SQL Injection Prevention, 4. Authentication & Authorization, 5. XSS Prevention, 6. CSRF Protection, 7. Rate Limiting (+40 more)

### Community 47 - "test_icon_generate.py"
Cohesion: 0.07
Nodes (28): cip(), _Config, _image_response(), load_cip(), _run_main(), test_main_exits_0_when_part_of_a_set_is_generated(), test_main_exits_1_when_every_deliverable_in_a_set_fails(), test_main_exits_1_when_single_deliverable_fails() (+20 more)

### Community 48 - "Tailwind CSS Utility Reference"
Cohesion: 0.05
Nodes (43): Arbitrary Values, Aspect Ratio, Background Colors, Border Color, Border Radius, Border Style, Border Width, Borders (+35 more)

### Community 49 - "Test-Driven Development Workflow"
Cohesion: 0.05
Nodes (42): 1. Tests BEFORE Code, 2. Coverage Requirements, 3. Test Types, API Integration Test Pattern, Best Practices, CI/CD Integration, Common Testing Mistakes to Avoid, Continuous Testing (+34 more)

### Community 50 - "Coding Standards & Best Practices"
Cohesion: 0.05
Nodes (39): 1. Long Functions, 1. Readability First, 2. Deep Nesting, 2. KISS (Keep It Simple, Stupid), 3. DRY (Don't Repeat Yourself), 3. Magic Numbers, 4. YAGNI (You Aren't Gonna Need It), API Design Standards (+31 more)

### Community 51 - "object"
Cohesion: 0.07
Nodes (6): AtlasGenerationTests, ExitStatusTests, _fake_genai(), GeminiImageTypeTests, _image_response(), MuapiGenerationTests

### Community 52 - "DesignSystemGenerator"
Cohesion: 0.10
Nodes (4): DesignSystemGenerator, _resolve_dial(), TestReasoningMatch, TestReasoningContract

### Community 53 - "Brand Guidelines v1.0"
Cohesion: 0.05
Nodes (37): 1. Color Palette, 2. Typography, 3. Logo Usage, 4. Voice & Tone, 5. Imagery Guidelines, 6. Design Components, Accessibility, AI Image Generation (+29 more)

### Community 54 - "logo/generate.py"
Cohesion: 0.10
Nodes (21): _atlas_prediction_data(), _download_atlas_image(), _download_image(), _download_muapi_image(), enhance_prompt(), generate_batch(), generate_logo(), _generate_with_atlas() (+13 more)

### Community 55 - "Design"
Cohesion: 0.05
Nodes (36): Banner Design (Built-in), Banner: Design Rules, Banner: Quick Size Reference, Banner: Top Art Styles, Banner: Workflow, CIP Design (Built-in), CIP: Generate Brief, CIP: Generate Mockups (+28 more)

### Community 56 - "json"
Cohesion: 0.08
Nodes (14): format_brief(), format_results(), main(), format_output(), generate_design_brief(), generate_css_for_background(), get_background_image(), get_curated_images() (+6 more)

### Community 57 - "Canvas Design System"
Cohesion: 0.06
Nodes (35): 1. Visual Communication First, 2. Minimal Text Integration, 3. Expert Craftsmanship, 4. Systematic Patterns, Analog Meditation, Approach, Canvas Boundaries, Canvas Design System (+27 more)

### Community 58 - "design_system.py"
Cohesion: 0.08
Nodes (10): _detect_page_type(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides(), persist_design_system(), safe_slug(), _write_persisted_file(), format_output() (+2 more)

### Community 59 - "slide_search_core.py"
Cohesion: 0.11
Nodes (16): format_context(), format_result(), main(), calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion(), get_layout_for_goal() (+8 more)

### Community 60 - "conductor/PerfilScreen.js"
Cohesion: 0.14
Nodes (31): 4.13 Pantallas del conductor (`src/screens/conductor/`), 4.4 Servicios (`src/services/`), 6. Endpoints y eventos que usa la app, react-native-safe-area-context, createStyles(), HojaInferior(), iniciales(), createStyles() (+23 more)

### Community 61 - "test_data_contracts.py"
Cohesion: 0.10
Nodes (10): apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action(), read_rows(), split_values(), style_identities(), TestGeneratedCatalogContract (+2 more)

### Community 62 - "Form & Input Components"
Cohesion: 0.06
Nodes (32): Accordion, Alert, Alert Dialog, Avatar, Badge, Button, Card, Checkbox (+24 more)

### Community 63 - "Tailwind CSS Responsive Design"
Cohesion: 0.06
Nodes (32): 1. Mobile-First Design, 2. Consistent Breakpoint Usage, 3. Test at Breakpoint Boundaries, 4. Use Container for Content Width, 5. Progressive Enhancement, 6. Avoid Too Many Breakpoints, Best Practices, Breakpoint System (+24 more)

### Community 64 - "ClickHouse Analytics Patterns"
Cohesion: 0.06
Nodes (31): 1. Partitioning Strategy, 2. Ordering Key, 3. Data Types, 4. Avoid, 5. Monitoring, AggregatingMergeTree (Pre-aggregation), Aggregations, Best Practices (+23 more)

### Community 65 - "Typography Specifications"
Cohesion: 0.06
Nodes (30): Accessibility, Base System, Best Practices, Clean & Modern, Common Font Pairings, Contrast Requirements, CSS Implementation, Editorial (+22 more)

### Community 66 - "html-token-validator.py"
Cohesion: 0.12
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 67 - "E2E Test Runner"
Cohesion: 0.07
Nodes (28): 1. Test Planning Phase, 2. Test Creation Phase, 3. Test Execution Phase, Artifact Management, CI/CD Integration, Common Flakiness Causes & Fixes, Core Responsibilities, Critical User Journeys for Example Project (+20 more)

### Community 68 - "Security Reviewer"
Cohesion: 0.07
Nodes (28): 10. Logging Sensitive Data (MEDIUM), 1. Hardcoded Secrets (CRITICAL), 1. Initial Scan Phase, 2. OWASP Top 10 Analysis, 2. SQL Injection (CRITICAL), 3. Command Injection (CRITICAL), 3. Example Project-Specific Security Checks, 4. Cross-Site Scripting (XSS) (HIGH) (+20 more)

### Community 69 - "useThemedStyles"
Cohesion: 0.16
Nodes (17): @expo/vector-icons, react-native, ThemeContext, useThemedStyles(), Stack, Tab, BuscandoFleteroScreen(), createStyles() (+9 more)

### Community 70 - "Logo Usage Rules"
Cohesion: 0.07
Nodes (28): Absolute Don'ts, Approved Backgrounds, Before Using Logo, Clear Space, Co-branding, Color Rules, Color Usage, Color Variants (+20 more)

### Community 71 - "Component Specifications"
Cohesion: 0.07
Nodes (28): Alert, Anatomy, Anatomy, Anatomy, Anatomy, Anatomy, Badge, Button (+20 more)

### Community 72 - "shadcn/ui Accessibility Patterns"
Cohesion: 0.07
Nodes (28): Accordion, Alert, ARIA Labels, Checkbox and Radio, Color Contrast, Command Palette Navigation, Component-Specific Patterns, Dialog/Modal Navigation (+20 more)

### Community 73 - "architect.md"
Cohesion: 0.07
Nodes (27): 1. Current State Analysis, 1. Modularity & Separation of Concerns, 2. Requirements Gathering, 2. Scalability, 3. Design Proposal, 3. Maintainability, 4. Security, 4. Trade-Off Analysis (+19 more)

### Community 74 - "Documentation & Codemap Specialist"
Cohesion: 0.07
Nodes (27): 1. Extract Documentation from Code, 1. Repository Structure Analysis, 2. Module Analysis, 2. Update Documentation Files, 3. Documentation Validation, 3. Generate Codemaps, 4. Codemap Format, Analysis Commands (+19 more)

### Community 75 - "cip/core.py"
Cohesion: 0.10
Nodes (11): detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv(), detect_domain(), _load_csv() (+3 more)

### Community 76 - "icon/generate.py"
Cohesion: 0.13
Nodes (12): apply_color(), apply_viewbox_size(), extract_svgs(), _finish_reason(), generate_batch(), generate_icon(), generate_sizes(), load_env() (+4 more)

### Community 77 - "Build Error Resolver"
Cohesion: 0.08
Nodes (25): 1. Collect All Errors, 2. Fix Strategy (Minimal Changes), 3. Common Error Patterns & Fixes, Build Error Priority Levels, Build Error Report Format, Build Error Resolver, Build & Type Checking Tools, Core Responsibilities (+17 more)

### Community 78 - "tdd-guide.md"
Cohesion: 0.08
Nodes (25): 1. Unit Tests (Mandatory), 2. Integration Tests (Mandatory), 3. E2E Tests (For Critical Flows), Continuous Testing, Coverage Report, Edge Cases You MUST Test, ✅ Independent Tests, Mock OpenAI (+17 more)

### Community 79 - "Backend Development Patterns"
Cohesion: 0.08
Nodes (25): API Design Patterns, Authentication & Authorization, Backend Development Patterns, Background Jobs & Queues, Cache-Aside Pattern, Caching Strategies, Centralized Error Handler, Database Patterns (+17 more)

### Community 80 - "Asset Approval Checklist"
Cohesion: 0.08
Nodes (25): Accessibility, Archival, Asset Approval Checklist, Automation Support, Color Compliance, Common Issues & Fixes, Content Accessibility, Content Quality (+17 more)

### Community 81 - "Logo AI Prompt Engineering"
Cohesion: 0.08
Nodes (25): Common Pitfalls, Core Prompt Structure, Detailed Brief, Eco/Sustainable, Effective Keywords by Style, Fashion Brand, Healthcare, Industry-Specific Prompts (+17 more)

### Community 82 - "UI Styling Skill"
Cohesion: 0.08
Nodes (25): Accessibility Patterns, Alternative: Tailwind-Only Setup, Best Practices, Common Patterns, Component Layer: shadcn/ui, Component Library Guide, Component + Styling Setup, Core Stack (+17 more)

### Community 83 - "Color Palette Management"
Cohesion: 0.08
Nodes (24): Accessibility Requirements, Brand Compliance Validation, Checking Contrast, Color Documentation Format, Color Extraction, Color Palette Examples, Color Palette Management, Color System Structure (+16 more)

### Community 84 - "CIP Deliverable Guide"
Cohesion: 0.08
Nodes (24): Apparel, Business Card, Car/Sedan, CIP Deliverable Guide, Core Identity, Digital Assets, Email Signature, Envelope (+16 more)

### Community 85 - "States and Variants"
Cohesion: 0.08
Nodes (24): Accessibility, Accessibility Requirements, ARIA States, Color Contrast, Color Variants, Disabled States, Error Messages, Error States (+16 more)

### Community 86 - "Eval Harness Skill"
Cohesion: 0.08
Nodes (24): 1. Code-Based Grader, 1. Define (Before Coding), 2. Implement, 2. Model-Based Grader, 3. Evaluate, 3. Human Grader, 4. Report, Best Practices (+16 more)

### Community 87 - "Refactor & Dead Code Cleaner"
Cohesion: 0.08
Nodes (23): 1. Analysis Phase, 1. Unused Imports, 2. Dead Code Branches, 2. Risk Assessment, 3. Duplicate Components, 3. Safe Removal Process, 4. Duplicate Consolidation, 4. Unused Dependencies (+15 more)

### Community 88 - "Workflow"
Cohesion: 0.08
Nodes (23): Art Direction Styles (Reuse from Banner), Color & Contrast, Design Best Practices, HTML Design Rules, HTML Template Structure, Option A: Chrome Headless CLI (Recommended — zero dependencies), Option B: Browser automation provided by the runtime, Option C: Playwright script (+15 more)

### Community 89 - "Design System"
Cohesion: 0.08
Nodes (23): Best Practices, Chart.js Integration, Command, Component Spec Pattern, Contextual Decision Flow, Decision System CSVs, Design System, Integration (+15 more)

### Community 90 - "Frontend Development Patterns"
Cohesion: 0.08
Nodes (23): Accessibility Patterns, Animation Patterns, Async Data Fetching Hook, Code Splitting & Lazy Loading, Component Patterns, Composition Over Inheritance, Compound Components, Context + Reducer Pattern (+15 more)

### Community 91 - "Industry-Specific Design Languages"
Cohesion: 0.09
Nodes (22): AI / Tech Products, Applying Peak-End to Mobile Apps, Crypto / Web3, Design Process for Client/Product Work, E-commerce / Food, Education / Learning, Emotional Design Principles, Emotional Feedback Loops (+14 more)

### Community 92 - "Tailwind CSS Customization"
Cohesion: 0.09
Nodes (22): @apply Directive, Best Practices, Color Customization, Complete Tailwind Config, Configuration Examples, Content Configuration, Custom Color Palette, Custom Font Sizes (+14 more)

### Community 93 - "mensajeDeError"
Cohesion: 0.21
Nodes (18): 4.10 Componentes sueltos (`src/components/`), 4.11 Pantallas de entrada y alta (`src/screens/auth/`), 4.5 Hooks (`src/hooks/`), 4. Archivo por archivo, 5.4 Alta de conductor, CamposVehiculo(), s, useFormVehiculo() (+10 more)

### Community 94 - "spacing"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 95 - "Design Process"
Cohesion: 0.09
Nodes (21): Anti-Patterns to Avoid, Category Screens, Color System (60/30/10 Rule), Core Philosophy, Design Process, Implementation Notes, Mobile App UI/UX Design Skill, Order/Status Tracking (+13 more)

### Community 97 - "test_design_system_mode.py"
Cohesion: 0.13
Nodes (9): ansi_ljust(), format_ascii_box(), add_wrapped(), wrap_text(), format_markdown(), hex_to_ansi(), _mode_support_labels(), section_header() (+1 more)

### Community 98 - "Routing by Task Type"
Cohesion: 0.10
Nodes (19): Banner Design Tasks, Brand Identity Tasks, Component Creation, Corporate Identity Program Tasks, Design Routing Guide, Design System Migration, Icon Design Tasks, Implementation Tasks (+11 more)

### Community 99 - "shadcn/ui Theming & Customization"
Cohesion: 0.10
Nodes (19): Base Color Presets, Best Practices, Color Customization, Color Format, Component Customization, CSS Variable System, Customize Styles, Customize Variants (+11 more)

### Community 101 - "Asset Organization Guide"
Cohesion: 0.11
Nodes (18): Asset Entry (manifest.json), Asset Organization Guide, By Campaign, By Status, By Type, Cleanup Workflow, Components, Directory Structure (+10 more)

### Community 102 - "Primary Color Meanings"
Cohesion: 0.11
Nodes (18): Accessibility Considerations, Analogous, Black, Blue, Color Combinations by Industry, Color Harmony Types, Complementary, Green (+10 more)

### Community 103 - "Core Logo Types"
Cohesion: 0.11
Nodes (18): 1. Wordmark (Logotype), 2. Lettermark (Monogram), 3. Pictorial Mark (Brand Mark), 4. Abstract Mark, 5. Mascot, 6. Emblem, 7. Combination Mark, Aesthetic Styles (+10 more)

### Community 104 - "color"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 105 - "Project Guidelines Skill (Example)"
Cohesion: 0.11
Nodes (18): API Response Format (FastAPI), Architecture Overview, Backend (pytest), Claude AI Integration (Structured Output), Code Patterns, Critical Rules, Custom Hooks (React), Deployment Commands (+10 more)

### Community 106 - "Run the generated test"
Cohesion: 0.11
Nodes (17): Best Practices, Browser Configuration, CI/CD Integration, E2E Command, Example Usage, Flaky Test Detection, How It Works, Important Notes (+9 more)

### Community 107 - "Brand Consistency Checklist"
Cohesion: 0.11
Nodes (17): Audit Frequency, Brand Consistency Checklist, Channel Audit, Collateral, Colors, Common Issues, Email, Imagery (+9 more)

### Community 108 - "CIP Mockup Prompt Engineering"
Cohesion: 0.11
Nodes (17): Apparel (Polo/T-Shirt), Base Prompt Structure, Business Card, CIP Mockup Prompt Engineering, Context Modifiers, Corporate Minimal, Deliverable-Specific Modifiers, Letterhead (+9 more)

### Community 109 - "Color Semantics"
Cohesion: 0.11
Nodes (17): Accent, Applying Semantic Tokens, Background & Foreground, Border & Ring, Color Semantics, Dark Mode Overrides, Destructive, Interactive States (+9 more)

### Community 110 - "_select_palette_for_mode"
Cohesion: 0.15
Nodes (6): _button_outline_text_color(), _contrast_ratio(), _derive_dark_palette(), format_master_md(), _select_palette_for_mode(), TestPaletteSelection

### Community 111 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.11
Nodes (17): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Query Contract, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements (+9 more)

### Community 112 - "Orchestrate Command"
Cohesion: 0.12
Nodes (15): Arguments, bugfix, Custom Workflow Example, Example: Feature Workflow, Execution Pattern, feature, Final Report Format, Handoff Document Format (+7 more)

### Community 113 - "Design Principles"
Cohesion: 0.12
Nodes (15): 22 Art Direction Styles, Banner Sizes & Art Direction Styles Reference, Complete Banner Sizes, CTA Rules, Design Principles, Pinterest Research Queries, Print, Print Specs (+7 more)

### Community 114 - "Design Principles"
Cohesion: 0.12
Nodes (15): 22 Art Direction Styles, Banner Sizes & Art Direction Styles Reference, Complete Banner Sizes, CTA Rules, Design Principles, Pinterest Research Queries, Print, Print Specs (+7 more)

### Community 115 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 117 - "extract-colors.cjs"
Cohesion: 0.20
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 118 - "sync-brand-to-tokens.cjs"
Cohesion: 0.18
Nodes (13): adjustBrightness(), CSS_SCAN_DIRS, CSS_TOKEN_SOURCES, { execFileSync }, extractColorsFromMarkdown(), findExistingTokenSources(), fs, GENERATE_TOKENS_SCRIPT (+5 more)

### Community 119 - "CIP Design Reference"
Cohesion: 0.13
Nodes (14): CIP Brief (Start Here), CIP Design Reference, Commands, Deliverable Categories, Design Styles, Detailed References, Generate Mockups, HTML Presentation Features (+6 more)

### Community 120 - "Icon Design Reference"
Cohesion: 0.13
Nodes (14): Available Styles, CLI Options, Commands, Generate Batch Variations, Generate Multiple Sizes, Generate Single Icon, Icon Categories, Icon Design Reference (+6 more)

### Community 121 - "Copywriting Formulas"
Cohesion: 0.13
Nodes (14): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Contrast Patterns, Copywriting Formulas, Core Formulas, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping (+6 more)

### Community 122 - "Copywriting Formulas"
Cohesion: 0.13
Nodes (14): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Contrast Patterns, Copywriting Formulas, Core Formulas, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping (+6 more)

### Community 123 - "_palette_is_dark"
Cohesion: 0.18
Nodes (4): _palette_is_dark(), _relative_luminance(), TestEndToEndCoherence, TestLuminance

### Community 125 - "Banner Design - Multi-Format Creative Banner System"
Cohesion: 0.14
Nodes (13): Art Direction Styles (Top 10), Available Resources, Banner Design - Multi-Format Creative Banner System, Banner Size Quick Reference, Design Rules, Security, Step 1: Gather Requirements (AskUserQuestion), Step 2: Research & Art Direction (+5 more)

### Community 126 - "Messaging Framework"
Cohesion: 0.14
Nodes (13): Core Statements, Elevator Pitches, Framework Structure, Message Architecture, Message by Audience, Message Testing, Messaging Framework, Mission Statement (+5 more)

### Community 127 - "Brand Voice Framework"
Cohesion: 0.14
Nodes (13): Brand Voice Framework, Character Spectrum, Emotion Spectrum, Language Spectrum, Step 1: Define Personality Traits, Step 2: Create Voice Chart, Step 3: Context Adaptation, Tone Spectrum (+5 more)

### Community 128 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 129 - "Layout Patterns"
Cohesion: 0.14
Nodes (13): Card Styles, Component Variants, CSS Structures, Feature Grid (3 columns), Layout Decision Flow, Layout Patterns, Layout Selection by Use Case, Metric Styles (+5 more)

### Community 130 - "Tailwind Integration"
Cohesion: 0.14
Nodes (13): Animation Tokens, Base Layer, Button Example, Component Classes, CSS Variables Setup, Dark Mode Toggle, HSL Format Benefits, shadcn/ui Alignment (+5 more)

### Community 131 - "radius"
Cohesion: 0.19
Nodes (14): $type, $value, $type, $value, $type, $value, primitive, radius (+6 more)

### Community 132 - "Layout Patterns"
Cohesion: 0.14
Nodes (13): Card Styles, Component Variants, CSS Structures, Feature Grid (3 columns), Layout Decision Flow, Layout Patterns, Layout Selection by Use Case, Metric Styles (+5 more)

### Community 134 - "TDD Command"
Cohesion: 0.15
Nodes (12): Coverage Requirements, Example Usage, How It Works, Important Notes, Integration with Other Commands, Related Agents, TDD Best Practices, TDD Command (+4 more)

### Community 135 - "update.md"
Cohesion: 0.15
Nodes (12): Color Presets, Examples, Files Modified, Important, Overview, Skills Used, Step 1: Gather Brand Input, Step 2: Update Brand Guidelines (+4 more)

### Community 136 - "Logo Design Reference"
Cohesion: 0.15
Nodes (12): Available Styles, Color Psychology, Commands, Design Brief (Start Here), Detailed References, Generate Logo, Industry Defaults, Logo Design Reference (+4 more)

### Community 137 - "Token Architecture"
Cohesion: 0.15
Nodes (12): Categories, Dark Mode, File Organization, Layer 1: Primitive Tokens, Layer 2: Semantic Tokens, Layer 3: Component Tokens, Layer Overview, Migration from Flat Tokens (+4 more)

### Community 138 - "design-tokens-starter.json"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 140 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 141 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 144 - "Verification Phases"
Cohesion: 0.15
Nodes (12): Continuous Mode, Integration with Hooks, Output Format, Phase 1: Build Verification, Phase 2: Type Check, Phase 3: Lint Check, Phase 4: Test Suite, Phase 5: Security Scan (+4 more)

### Community 145 - "useTheme"
Cohesion: 0.32
Nodes (10): Isotipo(), useTheme(), createStyles(), ESTADO_ACTIVO_LABELS(), EstadoBadge(), estadoInfo(), ESTADOS_ACTIVOS, formatFecha() (+2 more)

### Community 146 - "Primitive Tokens"
Cohesion: 0.17
Nodes (11): Border Radius, Color Scales, Gray Scale, Motion / Duration, Primary Colors (Blue), Primitive Tokens, Shadows, Spacing Scale (+3 more)

### Community 147 - "embed-tokens.cjs"
Cohesion: 0.17
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 148 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 149 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 150 - "_style_is_dark_primary"
Cohesion: 0.21
Nodes (4): _query_wants_dark(), _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution

### Community 151 - "planner.md"
Cohesion: 0.18
Nodes (10): 1. Requirements Analysis, 2. Architecture Review, 3. Step Breakdown, 4. Implementation Order, Best Practices, Plan Format, Planning Process, Red Flags to Check (+2 more)

### Community 152 - "Core Visual Elements"
Cohesion: 0.18
Nodes (10): Color Palette, Colors, Core Visual Elements, Logo, Logo, Quick Checks, Typography, Typography (+2 more)

### Community 153 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 154 - "Brand"
Cohesion: 0.18
Nodes (10): Brand, Brand Sync Workflow, Quick Start, References, Routing, Script Paths, Scripts, Subcommands (+2 more)

### Community 155 - "CIP Design Style Guide"
Cohesion: 0.18
Nodes (10): Bold Dynamic, CIP Design Style Guide, Classic Traditional, Color Psychology, Corporate Minimal, Fresh Modern, Luxury Premium, Modern Tech (+2 more)

### Community 159 - "Package Manager Setup"
Cohesion: 0.20
Nodes (9): Configuration Files, Detection Priority, Environment Variable, Global Configuration, package.json, Package Manager Setup, Project Configuration, Run the Detection (+1 more)

### Community 160 - "Slide Strategies"
Cohesion: 0.20
Nodes (9): Common Structures, Duarte Sparkline Pattern, Matching Strategy to Context, Product Demo (6 slides), Sales Pitch (9 slides), Search Commands, Slide Strategies, Strategy Selection (+1 more)

### Community 161 - "Component Tokens"
Cohesion: 0.20
Nodes (9): Alert Tokens, Badge Tokens, Button Tokens, Card Tokens, Component Tokens, Dialog/Modal Tokens, Input Tokens, Table Tokens (+1 more)

### Community 162 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 163 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 164 - "duration"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 165 - "Slide Strategies"
Cohesion: 0.20
Nodes (9): Common Structures, Duarte Sparkline Pattern, Matching Strategy to Context, Product Demo (6 slides), Sales Pitch (9 slides), Search Commands, Slide Strategies, Strategy Selection (+1 more)

### Community 168 - "Fleter Mobile — Arquitectura y archivos"
Cohesion: 0.20
Nodes (8): 1. Qué es la app, 2. Mapa de carpetas, 3. Cómo se conectan las piezas, 7. Reglas para escribir código nuevo, 8. Código heredado del marketplace, 9. Registro de cambios de este documento, Fleter Mobile — Arquitectura y archivos, Índice

### Community 169 - "Plan Command"
Cohesion: 0.22
Nodes (8): Example Usage, How It Works, Important Notes, Integration with Other Commands, Plan Command, Related Agents, What This Command Does, When to Use

### Community 174 - "code-reviewer.md"
Cohesion: 0.25
Nodes (7): Approval Criteria, Best Practices (MEDIUM), Code Quality (HIGH), Performance (MEDIUM), Project-Specific Guidelines (Example), Review Output Format, Security Checks (CRITICAL)

### Community 175 - "Checkpoint Command"
Cohesion: 0.25
Nodes (7): Arguments, Checkpoint Command, Create Checkpoint, List Checkpoints, Usage, Verify Checkpoint, Workflow

### Community 176 - "Eval Command"
Cohesion: 0.25
Nodes (7): Arguments, Check Evals, Define Evals, Eval Command, List Evals, Report Evals, Usage

### Community 177 - "Continuous Learning Skill"
Cohesion: 0.25
Nodes (7): Configuration, Continuous Learning Skill, Hook Setup, How It Works, Pattern Types, Related, Why Stop Hook?

### Community 178 - "input"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 179 - "Strategic Compact Skill"
Cohesion: 0.25
Nodes (7): Best Practices, Configuration, Hook Setup, How It Works, Related, Strategic Compact Skill, Why Strategic Compaction?

### Community 181 - "/learn - Extract Reusable Patterns"
Cohesion: 0.29
Nodes (6): /learn - Extract Reusable Patterns, Notes, Output Format, Process, Trigger, What to Extract

### Community 182 - "Slides Reference"
Cohesion: 0.29
Nodes (6): Key Features, Knowledge Base, Slides Reference, Usage, When to Use, Workflow

### Community 183 - "HTML Slide Template"
Cohesion: 0.29
Nodes (6): Animation Classes, Background Images, Base Structure, Chart.js Integration, CSS Variables Reference, HTML Slide Template

### Community 184 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 185 - "HTML Slide Template"
Cohesion: 0.29
Nodes (6): Animation Classes, Background Images, Base Structure, Chart.js Integration, CSS Variables Reference, HTML Slide Template

### Community 186 - "Slides"
Cohesion: 0.29
Nodes (6): References (Knowledge Base), Routing, Script Paths, Slides, Subcommands, When to Use

### Community 190 - "RegisterFleteroScreen.js"
Cohesion: 0.48
Nodes (6): @react-native-community/datetimepicker, createFieldStyles(), createStyles(), Field(), mapApiError(), RegisterFleteroScreen()

### Community 191 - "Contrato vigente: API.md del backend, branch develop"
Cohesion: 0.47
Nodes (5): Contrato vigente: API.md del backend, branch develop, Backend de staging (Railway), Backend pasos 1 a 4 probados en staging, NODE_USE_ENV_PROXY=1 detrás de un proxy, Pruebas de contrato del backend (Node, sin dependencias)

### Community 194 - "Verification Command"
Cohesion: 0.40
Nodes (4): Arguments, Instructions, Output, Verification Command

### Community 195 - "Brand Guidelines Template"
Cohesion: 0.40
Nodes (4): Brand Guidelines Template, Document Structure, Extractable Fields, Usage

### Community 196 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 197 - "radius"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 198 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 199 - "sm"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 203 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 204 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 205 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 207 - "16"
Cohesion: 0.67
Nodes (3): $type, $value, 16

### Community 208 - "1"
Cohesion: 0.67
Nodes (3): $type, $value, 1

### Community 209 - "3"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 210 - "8"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 211 - "destructive"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 212 - "destructive-foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 213 - "muted"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 214 - "primary-foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 215 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 216 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

## Knowledge Gaps
- **95 isolated node(s):** `expo-camera`, `expo-crypto`, `expo-status-bar`, `react-dom`, `react-native-google-places-autocomplete` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 2251 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TailwindConfigGenerator` connect `TailwindConfigGenerator` to `TestTailwindConfigGenerator`, `pathlib`, `.write_config`, `.add_colors`, `test_sync_brand_to_tokens.py`, `.test_node_check_parses_generated_config`, `.generate_config_string`, `.validate_config`, `.add_plugins`, `main`, `._base_config`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useTheme()` (e.g. with `Toda pantalla en modo claro y oscuro` and `4.2 Contextos (`src/context/`)`) actually correct?**
  _`useTheme()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `expo-camera`, `expo-crypto`, `expo-status-bar` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Reglas del conductor` be split into smaller, more focused modules?**
  _Cohesion score 0.0918918918918919 - nodes in this community are weakly interconnected._
- **Why does `ShadcnInstaller` connect `ShadcnInstaller` to `pathlib`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Alta y onboarding (fase 1)` be split into smaller, more focused modules?**
  _Cohesion score 0.11352002408912978 - nodes in this community are weakly interconnected._