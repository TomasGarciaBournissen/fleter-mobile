# Graph Report - fleter-mobile  (2026-10-19)

## Corpus Check
- 297 files · ~396,973 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 110 file(s) not represented in the graph (top: .ttf 54, .csv 53, (none) 2)

## Summary
- 4157 nodes · 7362 edges · 223 communities (184 shown, 39 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 231 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1717a5f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.js
- useThemedStyles
- API contract (api.md)
- GPS y viaje activo
- Arranque de la app
- CrearViajeScreen.js
- Dependencias npm
- Config Expo
- Disponibles fletero
- argparse
- Endpoints de viajes
- Registro de pantallas
- Eventos socket de alertas
- Sistema de diseño v2
- Endpoints de empresas
- conductor/DetalleViajeScreen.js
- Endpoints de auth
- design_system.py
- useAuth
- Fleter mobile app (React Native + Expo)
- Firebase Auth nativo
- CLAUDE.md
- validate_data.py
- ShadcnInstaller
- scripts/core.py
- series.mjs
- gray
- Security Checklist
- DesignSystemGenerator
- Fase 5 — Plan de implementación del pivot a panel de empresa (orientado al backend)
- slide_search_core.py
- Tailwind CSS Utility Reference
- Test-Driven Development Workflow
- csv
- test_sync_brand_to_tokens.py
- Coding Standards & Best Practices
- object
- Brand Guidelines v1.0
- logo/generate.py
- AuthContext.js
- Design
- Canvas Design System
- HistorialEmpresaScreen.js
- Form & Input Components
- Tailwind CSS Responsive Design
- ClickHouse Analytics Patterns
- Typography Specifications
- html-token-validator.py
- E2E Test Runner
- Security Reviewer
- Logo Usage Rules
- Component Specifications
- shadcn/ui Accessibility Patterns
- architect.md
- Documentation & Codemap Specialist
- pathlib
- formatPrecio
- Build Error Resolver
- tdd-guide.md
- Backend Development Patterns
- Asset Approval Checklist
- Logo AI Prompt Engineering
- UI Styling Skill
- test_design_system_mode.py
- Color Palette Management
- CIP Deliverable Guide
- States and Variants
- Eval Harness Skill
- organizaciones.mjs
- Refactor & Dead Code Cleaner
- Workflow
- test_icon_generate.py
- Design System
- Frontend Development Patterns
- Industry-Specific Design Languages
- Tailwind CSS Customization
- spacing
- Design Process
- TestTailwindConfigGenerator
- generate-slide.py
- Routing by Task Type
- test_cip_generate.py
- re
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
- UI/UX Pro Max - Design Intelligence
- Plan de Desarrollo MVP Fleter
- Orchestrate Command
- Design Principles
- Design Principles
- fontSize
- Fleter — Cambio de enfoque: de marketplace de fletes a herramienta de gestión para PyMEs
- extract-colors.cjs
- sync-brand-to-tokens.cjs
- CIP Design Reference
- Icon Design Reference
- Copywriting Formulas
- Copywriting Formulas
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
- CatalogSummaryLineEndingsTest
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
- Primitive Tokens
- embed-tokens.cjs
- validate-tokens.cjs
- card
- 1. Desvincular a un conductor cancela viajes en curso
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
- test_validate_tokens.py
- button
- duration
- Slide Strategies
- Plan Command
- BM25
- BM25
- code-reviewer.md
- Checkpoint Command
- Eval Command
- Continuous Learning Skill
- input
- Strategic Compact Skill
- Fleter Mobile — Plan de desarrollo (modelo PyME + conductores)
- /learn - Extract Reusable Patterns
- Slides Reference
- HTML Slide Template
- Frontend Design
- HTML Slide Template
- Slides
- TestThresholdGate
- useAuth
- TestTokenizer
- ViajeActivoFleteroScreen.js
- Verification Command
- Brand Guidelines Template
- $type
- radius
- lg
- sm
- TestBm25CoreBehavior
- TestStackFlagWithDesignSystem
- browser
- scripts
- radius
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
- @expo/vector-icons
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
- LEEME.md
- useTheme
- cliente/HistorialScreen.js
- TestStyleTaxonomy
- App.js
- HomeScreen.js
- Admin endpoints
- test_skill_script_paths.py
- socket.js
- TestMetricMath
- ViajeActivoFleteroScreen

## God Nodes (most connected - your core abstractions)
1. `useThemedStyles()` - 128 edges
2. `useTheme()` - 126 edges
3. `react` - 94 edges
4. `react-native` - 74 edges
5. `TailwindConfigGenerator` - 60 edges
6. `Boton()` - 49 edges
7. `Pantalla()` - 49 edges
8. `useAuth()` - 49 edges
9. `Titulo()` - 46 edges
10. `@expo/vector-icons` - 43 edges

## Surprising Connections (you probably didn't know these)
- `Fase 0 — Base (sin pantallas nuevas)` --references--> `Boton()`  [INFERRED]
  docs/PLAN_MOBILE_PYME.md → src/components/ui/Boton.js
- `Fase 0 — Base (sin pantallas nuevas)` --references--> `Pantalla()`  [INFERRED]
  docs/PLAN_MOBILE_PYME.md → src/components/ui/Pantalla.js
- `Fase 0 — Base (sin pantallas nuevas)` --references--> `ChipEstado()`  [INFERRED]
  docs/PLAN_MOBILE_PYME.md → src/components/viaje/ChipEstado.js
- `Viaje interno de PyME — `viajes.mjs`` --references--> `vencido()`  [INFERRED]
  scripts/api-tests/README.md → scripts/api-tests/viajes.mjs
- `Fase 0 — Base (sin pantallas nuevas)` --references--> `AuthStack()`  [INFERRED]
  docs/PLAN_MOBILE_PYME.md → src/navigation/AuthStack.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cliente crea y publica viaje** — progreso_crearviajescreen, progreso_confirmacionviajescreen, progreso_buscandofleteroscreen, api_post_api_viajes [EXTRACTED 1.00]
- **Gerente reserva y asigna viaje** — progreso_disponiblesgerentescreen, progreso_detalleviajegerentescreen, progreso_asignarconductorscreen, api_event_viaje_reservado [INFERRED 0.85]
- **Matching en tiempo real flow** — api_event_viaje_disponible, api_event_viaje_aceptar, api_event_viaje_ya_asignado, api_event_viaje_conductor_asignado, progreso_nuevoviajemodal, progreso_buscandofleteroscreen [INFERRED 0.85]

## Communities (223 total, 39 thin omitted)

### Community 0 - "api.js"
Cohesion: 0.12
Nodes (26): @react-navigation/bottom-tabs, useMiEmpresa(), Stack, Tab, AsignarConductorScreen(), createStyles(), cumpleCondiciones(), ConductorCard() (+18 more)

### Community 1 - "useThemedStyles"
Cohesion: 0.10
Nodes (41): react, react-native, react-native-safe-area-context, Isotipo(), createStyles(), createStyles(), createStyles(), createStyles() (+33 more)

### Community 2 - "API contract (api.md)"
Cohesion: 0.14
Nodes (12): Afiliaciones endpoints, API contract (api.md), Conductores vehiculos endpoints, DELETE /api/afiliaciones/:id, DELETE /api/conductores/mis-vehiculos/:id, DELETE /api/conductores/mis-vehiculos/:id/condiciones/:condicion, GET /api/afiliaciones/mias, GET /api/conductores/mis-vehiculos (+4 more)

### Community 3 - "GPS y viaje activo"
Cohesion: 0.15
Nodes (27): MapView, Marker(), Polyline(), PROVIDER_GOOGLE, MapaRecorrido(), s, createStyles(), ESTADO_BADGE_LABELS (+19 more)

### Community 4 - "Arranque de la app"
Cohesion: 0.12
Nodes (16): main, name, private, version, axios, expo-camera, expo-clipboard, expo-crypto (+8 more)

### Community 5 - "CrearViajeScreen.js"
Cohesion: 0.15
Nodes (23): @react-native-async-storage/async-storage, autocomplete(), createStyles(), fetchDetails(), guardarEnHistorial(), leerHistorial(), LocationPickerModal(), Stack (+15 more)

### Community 6 - "Dependencias npm"
Cohesion: 0.06
Nodes (35): dependencies, axios, expo, expo-auth-session, expo-camera, expo-clipboard, expo-crypto, expo-font (+27 more)

### Community 7 - "Config Expo"
Cohesion: 0.07
Nodes (28): backgroundColor, foregroundImage, adaptiveIcon, config, edgeToEdgeEnabled, googleMaps, googleMapsApiKey, expo (+20 more)

### Community 8 - "Disponibles fletero"
Cohesion: 0.23
Nodes (13): createStyles(), DisponiblesScreen(), ESTADOS_ACTIVOS, mapViaje(), TAG_COLORS(), TAG_LABELS, TagRequisito(), vehiculoPopupKey() (+5 more)

### Community 9 - "argparse"
Cohesion: 0.06
Nodes (17): build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main(), generate_html() (+9 more)

### Community 10 - "Endpoints de viajes"
Cohesion: 0.08
Nodes (25): viaje:asignado, GET /api/viajes/asignados, GET /api/viajes/:id, GET /api/viajes/:id/costo-acumulado, GET /api/viajes/:id/qr-paradas, GET /api/viajes/:id/remito, GET /api/viajes/mis-viajes, GET /api/viajes/mis-viajes-conductor (+17 more)

### Community 11 - "Registro de pantallas"
Cohesion: 0.12
Nodes (27): POST /api/auth/registro-cliente, POST /api/viajes/estimar-costo, AsignarConductorScreen, AuthStack, CobroScreen, ConductoresScreen, CrearViajeScreen, CuentaPendienteScreen (+19 more)

### Community 12 - "Eventos socket de alertas"
Cohesion: 0.10
Nodes (21): alerta:desvio, alerta:parada, viaje:aceptar, viaje:cancelado_por_admin, viaje:cancelado_sin_conductor, viaje:conductor_asignado, viaje:disponible, viaje:estado_cambiado (+13 more)

### Community 13 - "Sistema de diseño v2"
Cohesion: 0.18
Nodes (12): src/theme.js design tokens, Color tema claro, Color tema oscuro, Componentes RN (equivalentes BEM), Espaciado, radios, sombras, controles, Estados del viaje: 5 familias, 9 estados, Marca Fleter (ex Movix), Naranja primario #E85D2A (+4 more)

### Community 14 - "Endpoints de empresas"
Cohesion: 0.14
Nodes (14): DELETE /api/empresas/:id/conductores/:idc, DELETE /api/empresas/:id/vehiculos/:idv, Empresas endpoints (/api/empresas), GET /api/empresas/:id, GET /api/empresas/:id/conductores, GET /api/empresas/:id/vehiculos, GET /api/empresas/:id/viajes, GET /api/empresas/:id/viajes-disponibles (+6 more)

### Community 15 - "conductor/DetalleViajeScreen.js"
Cohesion: 0.08
Nodes (72): @react-navigation/native, IsotipoAnimado(), ChipEstado(), s, createStyles(), datosBasicos(), DatosViaje(), distanciaDe() (+64 more)

### Community 16 - "Endpoints de auth"
Cohesion: 0.33
Nodes (6): Auth endpoints (/api/auth), GET /api/auth/me, POST /api/auth/login, POST /api/auth/registro-conductor, POST /api/auth/registro-gerente, PUT /api/auth/perfil

### Community 17 - "design_system.py"
Cohesion: 0.05
Nodes (21): ansi_ljust(), _button_outline_text_color(), _detect_page_type(), format_ascii_box(), add_wrapped(), wrap_text(), format_markdown(), format_master_md() (+13 more)

### Community 18 - "useAuth"
Cohesion: 0.12
Nodes (53): CamposVehiculo(), s, useFormVehiculo(), Boton(), Campo, CampoCodigo(), Opcion(), Pantalla() (+45 more)

### Community 19 - "Fleter mobile app (React Native + Expo)"
Cohesion: 0.21
Nodes (10): services/api.js axios JWT interceptor, ClienteStack, Fleter mobile app (React Native + Expo), FleteroStack, Rol CLIENTE (PyME), Rol FLETERO (conductor), RootNavigator (role from JWT), services/socket.js socket.io client (+2 more)

### Community 23 - "validate_data.py"
Cohesion: 0.06
Nodes (43): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract(), _check_catalog_contract() (+35 more)

### Community 24 - "ShadcnInstaller"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 25 - "scripts/core.py"
Cohesion: 0.06
Nodes (31): BM25, _contains_phrase(), detect_domain(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _exact_stack_identifier(), _file_signature() (+23 more)

### Community 26 - "series.mjs"
Cohesion: 0.06
Nodes (61): api(), aUTC(), BASE, conectado(), conectar(), crearPyme(), crearUsuario(), crearVehiculo() (+53 more)

### Community 27 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 28 - "Security Checklist"
Cohesion: 0.04
Nodes (48): 10. Dependency Security, 1. Secrets Management, 2. Input Validation, 3. SQL Injection Prevention, 4. Authentication & Authorization, 5. XSS Prevention, 6. CSRF Protection, 7. Rate Limiting (+40 more)

### Community 29 - "DesignSystemGenerator"
Cohesion: 0.06
Nodes (13): DesignSystemGenerator, apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action(), TestReasoningMatch, read_rows(), split_values() (+5 more)

### Community 30 - "Fase 5 — Plan de implementación del pivot a panel de empresa (orientado al backend)"
Cohesion: 0.04
Nodes (46): 0. Cómo leer este documento, 10. Seguridad y privacidad, 11. Migración de datos (base compartida con producción), 12. Preguntas abiertas para el dueño del backend, 13. Del prototipo al contrato, 14. Plan de trabajo ordenado por dependencia, 15. Estrategia de pruebas (backend), 16. Fuera de alcance de esta fase (+38 more)

### Community 31 - "slide_search_core.py"
Cohesion: 0.08
Nodes (17): format_context(), format_result(), main(), BM25, calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion() (+9 more)

### Community 32 - "Tailwind CSS Utility Reference"
Cohesion: 0.05
Nodes (43): Arbitrary Values, Aspect Ratio, Background Colors, Border Color, Border Radius, Border Style, Border Width, Borders (+35 more)

### Community 33 - "Test-Driven Development Workflow"
Cohesion: 0.05
Nodes (42): 1. Tests BEFORE Code, 2. Coverage Requirements, 3. Test Types, API Integration Test Pattern, Best Practices, CI/CD Integration, Common Testing Mistakes to Avoid, Continuous Testing (+34 more)

### Community 34 - "csv"
Cohesion: 0.08
Nodes (13): detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv(), detect_domain(), _load_csv() (+5 more)

### Community 35 - "test_sync_brand_to_tokens.py"
Cohesion: 0.09
Nodes (18): _run(), test_creates_default_output_directory_when_missing(), test_dark_base_color_does_not_collapse_shades_to_black(), test_discovered_css_without_tokens_does_not_block_sync(), test_force_allows_sync_with_existing_css_token_source(), test_ignores_commented_root_custom_properties(), test_ignores_custom_properties_outside_root(), test_ignores_external_css_imports() (+10 more)

### Community 36 - "Coding Standards & Best Practices"
Cohesion: 0.05
Nodes (39): 1. Long Functions, 1. Readability First, 2. Deep Nesting, 2. KISS (Keep It Simple, Stupid), 3. DRY (Don't Repeat Yourself), 3. Magic Numbers, 4. YAGNI (You Aren't Gonna Need It), API Design Standards (+31 more)

### Community 37 - "object"
Cohesion: 0.07
Nodes (6): AtlasGenerationTests, ExitStatusTests, _fake_genai(), GeminiImageTypeTests, _image_response(), MuapiGenerationTests

### Community 38 - "Brand Guidelines v1.0"
Cohesion: 0.05
Nodes (37): 1. Color Palette, 2. Typography, 3. Logo Usage, 4. Voice & Tone, 5. Imagery Guidelines, 6. Design Components, Accessibility, AI Image Generation (+29 more)

### Community 39 - "logo/generate.py"
Cohesion: 0.10
Nodes (21): _atlas_prediction_data(), _download_atlas_image(), _download_image(), _download_muapi_image(), enhance_prompt(), generate_batch(), generate_logo(), _generate_with_atlas() (+13 more)

### Community 40 - "AuthContext.js"
Cohesion: 0.10
Nodes (30): expo-auth-session, expo-web-browser, firebase, react-native-svg, GoogleLogo(), DEV_MODE, AuthContext, AuthProvider() (+22 more)

### Community 41 - "Design"
Cohesion: 0.05
Nodes (36): Banner Design (Built-in), Banner: Design Rules, Banner: Quick Size Reference, Banner: Top Art Styles, Banner: Workflow, CIP Design (Built-in), CIP: Generate Brief, CIP: Generate Mockups (+28 more)

### Community 42 - "Canvas Design System"
Cohesion: 0.06
Nodes (35): 1. Visual Communication First, 2. Minimal Text Integration, 3. Expert Craftsmanship, 4. Systematic Patterns, Analog Meditation, Approach, Canvas Boundaries, Canvas Design System (+27 more)

### Community 43 - "HistorialEmpresaScreen.js"
Cohesion: 0.33
Nodes (9): agruparPorMes(), createStyles(), EstadoBadge(), estadoInfo(), ESTADOS_EN_CURSO, FILTROS, formatFecha(), HistorialEmpresaScreen() (+1 more)

### Community 44 - "Form & Input Components"
Cohesion: 0.06
Nodes (32): Accordion, Alert, Alert Dialog, Avatar, Badge, Button, Card, Checkbox (+24 more)

### Community 45 - "Tailwind CSS Responsive Design"
Cohesion: 0.06
Nodes (32): 1. Mobile-First Design, 2. Consistent Breakpoint Usage, 3. Test at Breakpoint Boundaries, 4. Use Container for Content Width, 5. Progressive Enhancement, 6. Avoid Too Many Breakpoints, Best Practices, Breakpoint System (+24 more)

### Community 46 - "ClickHouse Analytics Patterns"
Cohesion: 0.06
Nodes (31): 1. Partitioning Strategy, 2. Ordering Key, 3. Data Types, 4. Avoid, 5. Monitoring, AggregatingMergeTree (Pre-aggregation), Aggregations, Best Practices (+23 more)

### Community 47 - "Typography Specifications"
Cohesion: 0.06
Nodes (30): Accessibility, Base System, Best Practices, Clean & Modern, Common Font Pairings, Contrast Requirements, CSS Implementation, Editorial (+22 more)

### Community 48 - "html-token-validator.py"
Cohesion: 0.12
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 49 - "E2E Test Runner"
Cohesion: 0.07
Nodes (28): 1. Test Planning Phase, 2. Test Creation Phase, 3. Test Execution Phase, Artifact Management, CI/CD Integration, Common Flakiness Causes & Fixes, Core Responsibilities, Critical User Journeys for Example Project (+20 more)

### Community 50 - "Security Reviewer"
Cohesion: 0.07
Nodes (28): 10. Logging Sensitive Data (MEDIUM), 1. Hardcoded Secrets (CRITICAL), 1. Initial Scan Phase, 2. OWASP Top 10 Analysis, 2. SQL Injection (CRITICAL), 3. Command Injection (CRITICAL), 3. Example Project-Specific Security Checks, 4. Cross-Site Scripting (XSS) (HIGH) (+20 more)

### Community 51 - "Logo Usage Rules"
Cohesion: 0.07
Nodes (28): Absolute Don'ts, Approved Backgrounds, Before Using Logo, Clear Space, Co-branding, Color Rules, Color Usage, Color Variants (+20 more)

### Community 52 - "Component Specifications"
Cohesion: 0.07
Nodes (28): Alert, Anatomy, Anatomy, Anatomy, Anatomy, Anatomy, Badge, Button (+20 more)

### Community 53 - "shadcn/ui Accessibility Patterns"
Cohesion: 0.07
Nodes (28): Accordion, Alert, ARIA Labels, Checkbox and Radio, Color Contrast, Command Palette Navigation, Component-Specific Patterns, Dialog/Modal Navigation (+20 more)

### Community 54 - "architect.md"
Cohesion: 0.07
Nodes (27): 1. Current State Analysis, 1. Modularity & Separation of Concerns, 2. Requirements Gathering, 2. Scalability, 3. Design Proposal, 3. Maintainability, 4. Security, 4. Trade-Off Analysis (+19 more)

### Community 55 - "Documentation & Codemap Specialist"
Cohesion: 0.07
Nodes (27): 1. Extract Documentation from Code, 1. Repository Structure Analysis, 2. Module Analysis, 2. Update Documentation Files, 3. Documentation Validation, 3. Generate Codemaps, 4. Codemap Format, Analysis Commands (+19 more)

### Community 56 - "pathlib"
Cohesion: 0.07
Nodes (5): GeminiModelIdTests, _load_module(), main(), TestDiagnosticsContracts, TestTextLayoutRetrieval

### Community 57 - "formatPrecio"
Cohesion: 0.12
Nodes (23): @react-navigation/native-stack, Stack, Tab, CalificacionScreen(), createStyles(), AsignadosScreen(), createStyles(), mapViaje() (+15 more)

### Community 58 - "Build Error Resolver"
Cohesion: 0.08
Nodes (25): 1. Collect All Errors, 2. Fix Strategy (Minimal Changes), 3. Common Error Patterns & Fixes, Build Error Priority Levels, Build Error Report Format, Build Error Resolver, Build & Type Checking Tools, Core Responsibilities (+17 more)

### Community 59 - "tdd-guide.md"
Cohesion: 0.08
Nodes (25): 1. Unit Tests (Mandatory), 2. Integration Tests (Mandatory), 3. E2E Tests (For Critical Flows), Continuous Testing, Coverage Report, Edge Cases You MUST Test, ✅ Independent Tests, Mock OpenAI (+17 more)

### Community 60 - "Backend Development Patterns"
Cohesion: 0.08
Nodes (25): API Design Patterns, Authentication & Authorization, Backend Development Patterns, Background Jobs & Queues, Cache-Aside Pattern, Caching Strategies, Centralized Error Handler, Database Patterns (+17 more)

### Community 61 - "Asset Approval Checklist"
Cohesion: 0.08
Nodes (25): Accessibility, Archival, Asset Approval Checklist, Automation Support, Color Compliance, Common Issues & Fixes, Content Accessibility, Content Quality (+17 more)

### Community 62 - "Logo AI Prompt Engineering"
Cohesion: 0.08
Nodes (25): Common Pitfalls, Core Prompt Structure, Detailed Brief, Eco/Sustainable, Effective Keywords by Style, Fashion Brand, Healthcare, Industry-Specific Prompts (+17 more)

### Community 63 - "UI Styling Skill"
Cohesion: 0.08
Nodes (25): Accessibility Patterns, Alternative: Tailwind-Only Setup, Best Practices, Common Patterns, Component Layer: shadcn/ui, Component Library Guide, Component + Styling Setup, Core Stack (+17 more)

### Community 64 - "test_design_system_mode.py"
Cohesion: 0.07
Nodes (14): _contrast_ratio(), _derive_dark_palette(), _filter_anti_patterns_for_mode(), _palette_is_dark(), _query_wants_dark(), _relative_luminance(), _resolve_color_mode(), _select_palette_for_mode() (+6 more)

### Community 65 - "Color Palette Management"
Cohesion: 0.08
Nodes (24): Accessibility Requirements, Brand Compliance Validation, Checking Contrast, Color Documentation Format, Color Extraction, Color Palette Examples, Color Palette Management, Color System Structure (+16 more)

### Community 66 - "CIP Deliverable Guide"
Cohesion: 0.08
Nodes (24): Apparel, Business Card, Car/Sedan, CIP Deliverable Guide, Core Identity, Digital Assets, Email Signature, Envelope (+16 more)

### Community 67 - "States and Variants"
Cohesion: 0.08
Nodes (24): Accessibility, Accessibility Requirements, ARIA States, Color Contrast, Color Variants, Disabled States, Error Messages, Error States (+16 more)

### Community 68 - "Eval Harness Skill"
Cohesion: 0.08
Nodes (24): 1. Code-Based Grader, 1. Define (Before Coding), 2. Implement, 2. Model-Based Grader, 3. Evaluate, 3. Human Grader, 4. Report, Best Practices (+16 more)

### Community 69 - "organizaciones.mjs"
Cohesion: 0.15
Nodes (22): api(), BASE, conGuiones(), crearUsuario(), cuitValido(), dvMalo(), espera(), extra() (+14 more)

### Community 70 - "Refactor & Dead Code Cleaner"
Cohesion: 0.08
Nodes (23): 1. Analysis Phase, 1. Unused Imports, 2. Dead Code Branches, 2. Risk Assessment, 3. Duplicate Components, 3. Safe Removal Process, 4. Duplicate Consolidation, 4. Unused Dependencies (+15 more)

### Community 71 - "Workflow"
Cohesion: 0.08
Nodes (23): Art Direction Styles (Reuse from Banner), Color & Contrast, Design Best Practices, HTML Design Rules, HTML Template Structure, Option A: Chrome Headless CLI (Recommended — zero dependencies), Option B: Browser automation provided by the runtime, Option C: Playwright script (+15 more)

### Community 72 - "test_icon_generate.py"
Cohesion: 0.13
Nodes (16): _Config, gen(), _response(), _run_main(), test_generate_batch_handles_empty_response(), test_generate_batch_reports_max_tokens(), test_generate_batch_warns_when_truncated_after_some_icons(), test_generate_icon_handles_none_text() (+8 more)

### Community 73 - "Design System"
Cohesion: 0.08
Nodes (23): Best Practices, Chart.js Integration, Command, Component Spec Pattern, Contextual Decision Flow, Decision System CSVs, Design System, Integration (+15 more)

### Community 74 - "Frontend Development Patterns"
Cohesion: 0.08
Nodes (23): Accessibility Patterns, Animation Patterns, Async Data Fetching Hook, Code Splitting & Lazy Loading, Component Patterns, Composition Over Inheritance, Compound Components, Context + Reducer Pattern (+15 more)

### Community 75 - "Industry-Specific Design Languages"
Cohesion: 0.09
Nodes (22): AI / Tech Products, Applying Peak-End to Mobile Apps, Crypto / Web3, Design Process for Client/Product Work, E-commerce / Food, Education / Learning, Emotional Design Principles, Emotional Feedback Loops (+14 more)

### Community 76 - "Tailwind CSS Customization"
Cohesion: 0.09
Nodes (22): @apply Directive, Best Practices, Color Customization, Complete Tailwind Config, Configuration Examples, Content Configuration, Custom Color Palette, Custom Font Sizes (+14 more)

### Community 77 - "spacing"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 78 - "Design Process"
Cohesion: 0.09
Nodes (21): Anti-Patterns to Avoid, Category Screens, Color System (60/30/10 Rule), Core Philosophy, Design Process, Implementation Notes, Mobile App UI/UX Design Skill, Order/Status Tracking (+13 more)

### Community 80 - "generate-slide.py"
Cohesion: 0.13
Nodes (10): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+2 more)

### Community 81 - "Routing by Task Type"
Cohesion: 0.10
Nodes (19): Banner Design Tasks, Brand Identity Tasks, Component Creation, Corporate Identity Program Tasks, Design Routing Guide, Design System Migration, Icon Design Tasks, Implementation Tasks (+11 more)

### Community 82 - "test_cip_generate.py"
Cohesion: 0.15
Nodes (12): cip(), _Config, _image_response(), load_cip(), _run_main(), test_main_exits_0_when_part_of_a_set_is_generated(), test_main_exits_1_when_every_deliverable_in_a_set_fails(), test_main_exits_1_when_single_deliverable_fails() (+4 more)

### Community 83 - "re"
Cohesion: 0.07
Nodes (21): apply_color(), apply_viewbox_size(), extract_svgs(), _finish_reason(), generate_batch(), generate_icon(), generate_sizes(), load_env() (+13 more)

### Community 84 - "shadcn/ui Theming & Customization"
Cohesion: 0.10
Nodes (19): Base Color Presets, Best Practices, Color Customization, Color Format, Component Customization, CSS Variable System, Customize Styles, Customize Variants (+11 more)

### Community 86 - "Asset Organization Guide"
Cohesion: 0.11
Nodes (18): Asset Entry (manifest.json), Asset Organization Guide, By Campaign, By Status, By Type, Cleanup Workflow, Components, Directory Structure (+10 more)

### Community 87 - "Primary Color Meanings"
Cohesion: 0.11
Nodes (18): Accessibility Considerations, Analogous, Black, Blue, Color Combinations by Industry, Color Harmony Types, Complementary, Green (+10 more)

### Community 88 - "Core Logo Types"
Cohesion: 0.11
Nodes (18): 1. Wordmark (Logotype), 2. Lettermark (Monogram), 3. Pictorial Mark (Brand Mark), 4. Abstract Mark, 5. Mascot, 6. Emblem, 7. Combination Mark, Aesthetic Styles (+10 more)

### Community 89 - "color"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 90 - "Project Guidelines Skill (Example)"
Cohesion: 0.11
Nodes (18): API Response Format (FastAPI), Architecture Overview, Backend (pytest), Claude AI Integration (Structured Output), Code Patterns, Critical Rules, Custom Hooks (React), Deployment Commands (+10 more)

### Community 91 - "Run the generated test"
Cohesion: 0.11
Nodes (17): Best Practices, Browser Configuration, CI/CD Integration, E2E Command, Example Usage, Flaky Test Detection, How It Works, Important Notes (+9 more)

### Community 92 - "Brand Consistency Checklist"
Cohesion: 0.11
Nodes (17): Audit Frequency, Brand Consistency Checklist, Channel Audit, Collateral, Colors, Common Issues, Email, Imagery (+9 more)

### Community 93 - "CIP Mockup Prompt Engineering"
Cohesion: 0.11
Nodes (17): Apparel (Polo/T-Shirt), Base Prompt Structure, Business Card, CIP Mockup Prompt Engineering, Context Modifiers, Corporate Minimal, Deliverable-Specific Modifiers, Letterhead (+9 more)

### Community 94 - "Color Semantics"
Cohesion: 0.11
Nodes (17): Accent, Applying Semantic Tokens, Background & Foreground, Border & Ring, Color Semantics, Dark Mode Overrides, Destructive, Interactive States (+9 more)

### Community 95 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.11
Nodes (17): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Query Contract, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements (+9 more)

### Community 96 - "Plan de Desarrollo MVP Fleter"
Cohesion: 0.19
Nodes (16): GPS background (componente mas critico), Fase 0 Fundaciones, Fase 1 Usuarios y Registro, Fase 10 Pulido Seguridad Produccion, Fase 2 Creacion y Publicacion de Viajes, Fase 4 El Viaje en Vivo, Fase 5 Confirmacion y Cierre, Fase 6 Pagos Completos (+8 more)

### Community 97 - "Orchestrate Command"
Cohesion: 0.12
Nodes (15): Arguments, bugfix, Custom Workflow Example, Example: Feature Workflow, Execution Pattern, feature, Final Report Format, Handoff Document Format (+7 more)

### Community 98 - "Design Principles"
Cohesion: 0.12
Nodes (15): 22 Art Direction Styles, Banner Sizes & Art Direction Styles Reference, Complete Banner Sizes, CTA Rules, Design Principles, Pinterest Research Queries, Print, Print Specs (+7 more)

### Community 99 - "Design Principles"
Cohesion: 0.12
Nodes (15): 22 Art Direction Styles, Banner Sizes & Art Direction Styles Reference, Complete Banner Sizes, CTA Rules, Design Principles, Pinterest Research Queries, Print, Print Specs (+7 more)

### Community 100 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 102 - "Fleter — Cambio de enfoque: de marketplace de fletes a herramienta de gestión para PyMEs"
Cohesion: 0.12
Nodes (15): 1. Resumen, 2. Por qué cambiamos, 3.1 Identidad: PyMEs, miembros y choferes, 3.2 Ciclo del viaje, 3.3 Herramientas de la PyME, 3.4 Precio, 3. Cómo funciona ahora, 4. Decisiones de producto (+7 more)

### Community 103 - "extract-colors.cjs"
Cohesion: 0.20
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 104 - "sync-brand-to-tokens.cjs"
Cohesion: 0.18
Nodes (13): adjustBrightness(), CSS_SCAN_DIRS, CSS_TOKEN_SOURCES, { execFileSync }, extractColorsFromMarkdown(), findExistingTokenSources(), fs, GENERATE_TOKENS_SCRIPT (+5 more)

### Community 105 - "CIP Design Reference"
Cohesion: 0.13
Nodes (14): CIP Brief (Start Here), CIP Design Reference, Commands, Deliverable Categories, Design Styles, Detailed References, Generate Mockups, HTML Presentation Features (+6 more)

### Community 106 - "Icon Design Reference"
Cohesion: 0.13
Nodes (14): Available Styles, CLI Options, Commands, Generate Batch Variations, Generate Multiple Sizes, Generate Single Icon, Icon Categories, Icon Design Reference (+6 more)

### Community 107 - "Copywriting Formulas"
Cohesion: 0.13
Nodes (14): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Contrast Patterns, Copywriting Formulas, Core Formulas, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping (+6 more)

### Community 108 - "Copywriting Formulas"
Cohesion: 0.13
Nodes (14): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Contrast Patterns, Copywriting Formulas, Core Formulas, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping (+6 more)

### Community 110 - "Banner Design - Multi-Format Creative Banner System"
Cohesion: 0.14
Nodes (13): Art Direction Styles (Top 10), Available Resources, Banner Design - Multi-Format Creative Banner System, Banner Size Quick Reference, Design Rules, Security, Step 1: Gather Requirements (AskUserQuestion), Step 2: Research & Art Direction (+5 more)

### Community 111 - "Messaging Framework"
Cohesion: 0.14
Nodes (13): Core Statements, Elevator Pitches, Framework Structure, Message Architecture, Message by Audience, Message Testing, Messaging Framework, Mission Statement (+5 more)

### Community 112 - "Brand Voice Framework"
Cohesion: 0.14
Nodes (13): Brand Voice Framework, Character Spectrum, Emotion Spectrum, Language Spectrum, Step 1: Define Personality Traits, Step 2: Create Voice Chart, Step 3: Context Adaptation, Tone Spectrum (+5 more)

### Community 113 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 114 - "Layout Patterns"
Cohesion: 0.14
Nodes (13): Card Styles, Component Variants, CSS Structures, Feature Grid (3 columns), Layout Decision Flow, Layout Patterns, Layout Selection by Use Case, Metric Styles (+5 more)

### Community 115 - "Tailwind Integration"
Cohesion: 0.14
Nodes (13): Animation Tokens, Base Layer, Button Example, Component Classes, CSS Variables Setup, Dark Mode Toggle, HSL Format Benefits, shadcn/ui Alignment (+5 more)

### Community 116 - "radius"
Cohesion: 0.19
Nodes (14): $type, $value, $type, $value, $type, $value, primitive, radius (+6 more)

### Community 117 - "Layout Patterns"
Cohesion: 0.14
Nodes (13): Card Styles, Component Variants, CSS Structures, Feature Grid (3 columns), Layout Decision Flow, Layout Patterns, Layout Selection by Use Case, Metric Styles (+5 more)

### Community 120 - "TDD Command"
Cohesion: 0.15
Nodes (12): Coverage Requirements, Example Usage, How It Works, Important Notes, Integration with Other Commands, Related Agents, TDD Best Practices, TDD Command (+4 more)

### Community 121 - "update.md"
Cohesion: 0.15
Nodes (12): Color Presets, Examples, Files Modified, Important, Overview, Skills Used, Step 1: Gather Brand Input, Step 2: Update Brand Guidelines (+4 more)

### Community 122 - "Logo Design Reference"
Cohesion: 0.15
Nodes (12): Available Styles, Color Psychology, Commands, Design Brief (Start Here), Detailed References, Generate Logo, Industry Defaults, Logo Design Reference (+4 more)

### Community 123 - "Token Architecture"
Cohesion: 0.15
Nodes (12): Categories, Dark Mode, File Organization, Layer 1: Primitive Tokens, Layer 2: Semantic Tokens, Layer 3: Component Tokens, Layer Overview, Migration from Flat Tokens (+4 more)

### Community 124 - "design-tokens-starter.json"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 126 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 127 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 130 - "Verification Phases"
Cohesion: 0.15
Nodes (12): Continuous Mode, Integration with Hooks, Output Format, Phase 1: Build Verification, Phase 2: Type Check, Phase 3: Lint Check, Phase 4: Test Suite, Phase 5: Security Scan (+4 more)

### Community 131 - "Primitive Tokens"
Cohesion: 0.17
Nodes (11): Border Radius, Color Scales, Gray Scale, Motion / Duration, Primary Colors (Blue), Primitive Tokens, Shadows, Spacing Scale (+3 more)

### Community 132 - "embed-tokens.cjs"
Cohesion: 0.17
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 133 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 134 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 135 - "1. Desvincular a un conductor cancela viajes en curso"
Cohesion: 0.12
Nodes (15): 1. Desvincular a un conductor cancela viajes en curso, 2. Avisar antes de que un viaje pase a `VENCIDO`, 3. El conductor no recibe ETA, desvíos ni la ventana de inicio, A confirmar con el backend, A tener en cuenta (no son issues, son reglas de implementación), Fleter — Issues abiertos, Pedido al backend, Por qué es un problema (+7 more)

### Community 136 - "planner.md"
Cohesion: 0.18
Nodes (10): 1. Requirements Analysis, 2. Architecture Review, 3. Step Breakdown, 4. Implementation Order, Best Practices, Plan Format, Planning Process, Red Flags to Check (+2 more)

### Community 137 - "Core Visual Elements"
Cohesion: 0.18
Nodes (10): Color Palette, Colors, Core Visual Elements, Logo, Logo, Quick Checks, Typography, Typography (+2 more)

### Community 138 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 139 - "Brand"
Cohesion: 0.18
Nodes (10): Brand, Brand Sync Workflow, Quick Start, References, Routing, Script Paths, Scripts, Subcommands (+2 more)

### Community 140 - "CIP Design Style Guide"
Cohesion: 0.18
Nodes (10): Bold Dynamic, CIP Design Style Guide, Classic Traditional, Color Psychology, Corporate Minimal, Fresh Modern, Luxury Premium, Modern Tech (+2 more)

### Community 144 - "Package Manager Setup"
Cohesion: 0.20
Nodes (9): Configuration Files, Detection Priority, Environment Variable, Global Configuration, package.json, Package Manager Setup, Project Configuration, Run the Detection (+1 more)

### Community 145 - "Slide Strategies"
Cohesion: 0.20
Nodes (9): Common Structures, Duarte Sparkline Pattern, Matching Strategy to Context, Product Demo (6 slides), Sales Pitch (9 slides), Search Commands, Slide Strategies, Strategy Selection (+1 more)

### Community 146 - "Component Tokens"
Cohesion: 0.20
Nodes (9): Alert Tokens, Badge Tokens, Button Tokens, Card Tokens, Component Tokens, Dialog/Modal Tokens, Input Tokens, Table Tokens (+1 more)

### Community 147 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 148 - "test_validate_tokens.py"
Cohesion: 0.27
Nodes (3): _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation()

### Community 149 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 150 - "duration"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 151 - "Slide Strategies"
Cohesion: 0.20
Nodes (9): Common Structures, Duarte Sparkline Pattern, Matching Strategy to Context, Product Demo (6 slides), Sales Pitch (9 slides), Search Commands, Slide Strategies, Strategy Selection (+1 more)

### Community 154 - "Plan Command"
Cohesion: 0.22
Nodes (8): Example Usage, How It Works, Important Notes, Integration with Other Commands, Plan Command, Related Agents, What This Command Does, When to Use

### Community 157 - "code-reviewer.md"
Cohesion: 0.25
Nodes (7): Approval Criteria, Best Practices (MEDIUM), Code Quality (HIGH), Performance (MEDIUM), Project-Specific Guidelines (Example), Review Output Format, Security Checks (CRITICAL)

### Community 158 - "Checkpoint Command"
Cohesion: 0.25
Nodes (7): Arguments, Checkpoint Command, Create Checkpoint, List Checkpoints, Usage, Verify Checkpoint, Workflow

### Community 159 - "Eval Command"
Cohesion: 0.25
Nodes (7): Arguments, Check Evals, Define Evals, Eval Command, List Evals, Report Evals, Usage

### Community 160 - "Continuous Learning Skill"
Cohesion: 0.25
Nodes (7): Configuration, Continuous Learning Skill, Hook Setup, How It Works, Pattern Types, Related, Why Stop Hook?

### Community 161 - "input"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 162 - "Strategic Compact Skill"
Cohesion: 0.25
Nodes (7): Best Practices, Configuration, Hook Setup, How It Works, Related, Strategic Compact Skill, Why Strategic Compaction?

### Community 164 - "Fleter Mobile — Plan de desarrollo (modelo PyME + conductores)"
Cohesion: 0.25
Nodes (7): Fase 1 — Auth y onboarding, Fase 2 — Conductor (bottom tabs: Viajes, Historial, Perfil), Fase 3 — PyME (bottom tabs: Inicio, Viajes, Nuevo, Conductores, Más), Fase 4 — Cierre, Fleter Mobile — Plan de desarrollo (modelo PyME + conductores), Fuera de alcance del mobile, Principios

### Community 165 - "/learn - Extract Reusable Patterns"
Cohesion: 0.29
Nodes (6): /learn - Extract Reusable Patterns, Notes, Output Format, Process, Trigger, What to Extract

### Community 166 - "Slides Reference"
Cohesion: 0.29
Nodes (6): Key Features, Knowledge Base, Slides Reference, Usage, When to Use, Workflow

### Community 167 - "HTML Slide Template"
Cohesion: 0.29
Nodes (6): Animation Classes, Background Images, Base Structure, Chart.js Integration, CSS Variables Reference, HTML Slide Template

### Community 168 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 169 - "HTML Slide Template"
Cohesion: 0.29
Nodes (6): Animation Classes, Background Images, Base Structure, Chart.js Integration, CSS Variables Reference, HTML Slide Template

### Community 170 - "Slides"
Cohesion: 0.29
Nodes (6): References (Knowledge Base), Routing, Script Paths, Slides, Subcommands, When to Use

### Community 173 - "useAuth"
Cohesion: 0.14
Nodes (25): createStyles(), OPCIONES, SelectorApariencia(), createStyles(), HojaInferior(), useAuth(), ThemeProvider(), createStyles() (+17 more)

### Community 175 - "ViajeActivoFleteroScreen.js"
Cohesion: 0.19
Nodes (18): expo-location, expo-task-manager, SocketContext, useSocket(), POS_DEV, useGpsViaje(), BuscandoFleteroScreen(), createStyles() (+10 more)

### Community 176 - "Verification Command"
Cohesion: 0.40
Nodes (4): Arguments, Instructions, Output, Verification Command

### Community 177 - "Brand Guidelines Template"
Cohesion: 0.40
Nodes (4): Brand Guidelines Template, Document Structure, Extractable Fields, Usage

### Community 178 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 179 - "radius"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 180 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 181 - "sm"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 184 - "browser"
Cohesion: 0.40
Nodes (5): browser, @react-native-firebase/app, @react-native-firebase/auth, @react-native-google-signin/google-signin, react-native-keychain

### Community 185 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, android, ios, start, web

### Community 186 - "radius"
Cohesion: 0.15
Nodes (18): CampoTexto(), CONDICIONES, CondTag(), createStyles(), FORM_VACIO, PerfilFleteroScreen(), TIPOS_VEHICULO, VehiculoCard() (+10 more)

### Community 187 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 188 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 189 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 191 - "16"
Cohesion: 0.67
Nodes (3): $type, $value, 16

### Community 192 - "1"
Cohesion: 0.67
Nodes (3): $type, $value, 1

### Community 193 - "3"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 194 - "8"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 195 - "destructive"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 196 - "destructive-foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 197 - "muted"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 198 - "primary-foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 199 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 200 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

### Community 201 - "@expo/vector-icons"
Cohesion: 0.17
Nodes (12): @expo/vector-icons, @react-native-community/datetimepicker, MapView, PROVIDER_GOOGLE, createFieldStyles(), createStyles(), Field(), mapApiError() (+4 more)

### Community 213 - "useTheme"
Cohesion: 0.32
Nodes (12): Fase 0 — Base (sin pantallas nuevas), useTheme(), AuthStack(), ClienteStack(), ConductorStack(), Pestanas(), FleteroStack(), GerenteStack() (+4 more)

### Community 214 - "cliente/HistorialScreen.js"
Cohesion: 0.29
Nodes (11): agruparPorMes(), claveMes(), createStyles(), EstadoBadge(), estadoInfo(), ESTADOS_TERMINALES, FILTROS, formatFecha() (+3 more)

### Community 216 - "App.js"
Cohesion: 0.25
Nodes (7): App(), expo, expo-font, @expo-google-fonts/archivo-black, @expo-google-fonts/jetbrains-mono, @expo-google-fonts/josefin-sans, @expo-google-fonts/manrope

### Community 217 - "HomeScreen.js"
Cohesion: 0.39
Nodes (8): createStyles(), ESTADO_ACTIVO_LABELS(), EstadoBadge(), estadoInfo(), ESTADOS_ACTIVOS, formatFecha(), HomeScreen(), ViajeItem()

### Community 218 - "Admin endpoints"
Cohesion: 0.29
Nodes (7): Admin endpoints, GET /api/admin/estadisticas, GET /api/admin/usuarios, GET /api/admin/usuarios/:id, GET /api/admin/viajes, GET /api/admin/viajes/:id, POST /api/admin/viajes/:id/cancelar

### Community 219 - "test_skill_script_paths.py"
Cohesion: 0.38
Nodes (3): resolve(), shipped_invocations(), SkillScriptPathsTest

### Community 220 - "socket.js"
Cohesion: 0.40
Nodes (4): socket.io-client, SocketProvider(), conectarSocket(), desconectarSocket()

### Community 222 - "ViajeActivoFleteroScreen"
Cohesion: 0.67
Nodes (3): conductor:ubicacion, POST /api/viajes/:id/iniciar, ViajeActivoFleteroScreen

## Knowledge Gaps
- **67 isolated node(s):** `expo-camera`, `expo-crypto`, `expo-status-bar`, `react-dom`, `react-native-google-places-autocomplete` (+62 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 2291 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TailwindConfigGenerator` connect `TailwindConfigGenerator` to `.validate_config`, `.generate_config_string`, `.add_plugins`, `main`, `._base_config`, `TestTailwindConfigGenerator`, `.write_config`, `pathlib`, `.add_colors`, `.test_node_check_parses_generated_config`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `expo-camera`, `expo-crypto`, `expo-status-bar` to the rest of the system?**
  _67 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `api.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11861861861861862 - nodes in this community are weakly interconnected._
- **Why does `ShadcnInstaller` connect `ShadcnInstaller` to `pathlib`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `useThemedStyles` be split into smaller, more focused modules?**
  _Cohesion score 0.10327868852459017 - nodes in this community are weakly interconnected._
- **Why does `react` connect `useThemedStyles` to `api.js`, `GPS y viaje activo`, `Arranque de la app`, `CrearViajeScreen.js`, `HomeScreen.js`, `AuthContext.js`, `@expo/vector-icons`, `Disponibles fletero`, `HistorialEmpresaScreen.js`, `useAuth`, `conductor/DetalleViajeScreen.js`, `ViajeActivoFleteroScreen.js`, `useAuth`, `useTheme`, `cliente/HistorialScreen.js`, `App.js`, `formatPrecio`, `radius`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._