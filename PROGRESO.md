# Fleter Mobile — Registro de Progreso

> Última actualización: 2026-10-07  
> Branch: claude/freight-marketplace-pivot-l08445 | Commits totales: 37 (+4 pendientes)

---

## Historial de Commits

| Commit | Fecha | Descripción |
|--------|-------|-------------|
| `8b43895` | 28 May 2026 | Docs — PROGRESO.md + regla de actualización en CLAUDE.md |
| `8b3e4d6` | 26 Apr 2026 | Initial commit — scaffold Expo vacío |
| `44e3b35` | 07 May 2026 | Auth screens + context + DEV_MODE + estructura completa del proyecto |
| `eaf05c6` | 07 May 2026 | Habilitar Firebase Auth real (reemplaza mock de hooks/useAuth.js) |
| `2e745ac` | 08 May 2026 | Unificar flujo de auth en AuthContext, conectar botones de logout |
| `16a98e1` | 12 May 2026 | Fase 2 — llamadas API reales, nuevas pantallas, light theme, date picker |
| `7e89eb3` | 17 May 2026 | Fase 2 fixes + Fase 3 matching en tiempo real via WebSockets |
| `4a1bdaa` | 17 May 2026 | Docs — api.md actualizado con contrato completo de Fase 3 |
| `aadb6a0` | 21 May 2026 | Design — paleta naranja/crema, tareas de historial en plan |
| `dc02329` | 21 May 2026 | Fix — check de id_usuario_conductor en viaje:conductor_asignado |
| `46b5ab9` | 29 May 2026 | Feat — Google Places Autocomplete para creación de viaje |
| `8345c79` | 29 May 2026 | Feat — Places legacy API + utils formatKm/formatHoras/formatPrecio |
| `95b0640` | 29 May 2026 | Docs — api.md actualizado |
| `0499806` | 29 May 2026 | Feat — polish de pantallas con API real y bug fixes de acceptance flow |
| `ca53be1` | 29 May 2026 | Feat — reemplaza emojis con Ionicons, fix socket timeout, fix double dot en location |
| `6b79cb2` | 02 Jun 2026 | Fix — acceptance flow adaptado a nuevo payload de viaje:conductor_asignado (sin id_usuario_conductor) |
| `bd28db2` | 02 Jun 2026 | Fix — escuchar evento error del socket para cancelar spinner cuando backend rechaza viaje:aceptar |
| `f96539b` | 02 Jun 2026 | Feat — mock vehicle auto-creado en primera aceptación, id_vehiculo siempre incluido en viaje:aceptar |
| `ffbb317` | 02 Jun 2026 | Fix — setState-in-render en onConductorAsignado usando aceptandoRef |
| `9d68df8` | 02 Jun 2026 | Feat — gestión de vehículos en PerfilFleteroScreen (listar, agregar, eliminar) |
| `f8fc3ea` | 04 Jun 2026 | Feat — Fase 4: GPS tracking real, MapView en ViajeActivo (conductor + cliente), background task, socket GPS events |
| `761f30f` | 04 Jun 2026 | Fix — remover costo acumulado en tiempo real de ViajeActivoScreen (cliente) |
| `9b4243a` | 04 Jun 2026 | Feat — MapViewWrapper para Expo Go + debug GPS card en ViajeActivoFletero |
| `9d897ba` | 04 Jun 2026 | Fix — ignorar errores de conexión de socket en onError |
| `a7e7a42` | 04 Jun 2026 | Fix — GPS Highest accuracy + contador de updates en debug card |
| `ca53be1` | 08 Jun 2026 | Feat — reemplaza emojis con Ionicons, fix socket timeout, fix location double dot |
| `f2bcc23` | 08 Jun 2026 | Docs — regla de actualización de PROGRESO.md en CLAUDE.md |
| `447a9f7` | 08 Jun 2026 | Docs — PROGRESO.md actualizado con todos los cambios de sesión |
| `0499806` | 08 Jun 2026 | Feat — pantallas con datos reales de API y bug fixes |
| `95b0640` | 08 Jun 2026 | Docs — api.md actualizado |
| `102b74b` | 08 Jun 2026 | Feat — Places New API + AsyncStorage historial + fix .env + fix CARGANDO→EN_RUTA + QREntregaScreen Fase 5 + QR display cliente |
| (pendiente) | 08 Jun 2026 | Fix — adaptar QR flow al nuevo contrato de API (confirmar-parada, qr-paradas, viaje:finalizado) |
| (pendiente) | 30 Jun 2026 | Feat — retomar viaje activo, ETA, ruta recalculada, Polyline, CalificacionScreen, historial real, GERENTE |
| (pendiente) | 01 Jul 2026 | Docs — api.md sincronizado con contrato real (ruta_planeada, eta:actualizar, ruta:recalculada, mis-viajes-conductor, cancelar-conductor) |
| (pendiente) | 01 Jul 2026 | Feat — cancelación de viaje por el conductor en ViajeActivoFleteroScreen (POST /api/viajes/:id/cancelar-conductor) |
| (pendiente) | 14 Ago 2026 | Feat — build nativa iOS funcionando en dispositivo físico (Xcode + Google Maps SDK), mapa expandible + centrar en conductor/fletero |
| (pendiente) | 14 Ago 2026 | Feat — implementación completa del contrato nuevo de api.md: flujo "Iniciar viaje" manual, cancelar-cliente, zona calculada por servidor, duración/puntualidad en historiales, conductor afiliado (tab Asignados), y rol GERENTE completo (empresas, flota, conductores, reservar/asignar/reasignar, tracking) |
| (pendiente) | 19 Ago 2026 | Fix — api.md en disco había quedado desactualizado (se había revertido a la versión "Fase 5", sin zona/iniciar/admin/jerarquía) pese a que el código ya implementaba todo eso; resincronizado con el contrato completo. Agrega botón "Liberar viaje" (`POST /viajes/:id/cancelar-reserva`) en `AsignarConductorScreen` y link a remito PDF en `ViajeActivoGerenteScreen` al finalizar |
| `957bf77` | 20 Ago 2026 | Feat — reemplaza confirmación de entrega por QR con confirmación por GPS en `QREntregaScreen` (contrato nuevo: `confirmar-parada` ya no acepta `qr_firmado`, sino `id_parada+lat+lng`), botón "Finalizar viaje" en la última parada. Popup de alta de vehículo en `DisponiblesScreen` tras el registro del fletero (agregar ahora o más tarde desde Perfil). Refresco de `DisponiblesScreen` al recuperar foco + fix de pull-to-refresh (estaba atado al mismo loading state que la carga inicial). Saca el selector manual de zona en `CrearViajeScreen` (la calcula el servidor). Fix: `ViajeActivoFleteroScreen` no reflejaba el estado real si el POST a `/iniciar` fallaba en el cliente aunque el backend ya hubiera aplicado el cambio; ahora reconsulta el viaje ante ese error. Fix: la parada de origen se confirma en el momento de salir de `CARGANDO` (mientras el conductor todavía está ahí) en vez de diferirse al final, donde la validación de proximidad GPS la rechazaba por estar lejos. `ViajeActivoFleteroScreen` ahora espera el fetch inicial antes de renderizar, para no mostrar por un instante la etapa por defecto. api.md sincronizado |
| (pendiente) | 16 Sep 2026 | Design — sistema de diseño v2 "Fleter" adoptado: UXUI.md reescrito (tokens claro/oscuro, 5 familias de estado, 4 tipografías, reglas de vocabulario y 9 datos), CLAUDE.md actualizado, mockups de 9 pantallas en canvas (claro/oscuro conmutables desde Perfil → Apariencia). Primer paso en código: componente `src/components/Isotipo.js` (6 cajas, react-native-svg) en el header de HomeScreen cliente y en LoginScreen (isotipo + wordmark "Fleter." con punto naranja + eslogan oficial) |
| `43702b1` | 16 Sep 2026 | Feat — logo Fleter (isotipo + wordmark) en Home y Login + sistema de diseño v2 documentado |
| `7eb2f65` | 16 Sep 2026 | Feat — implementación completa del sistema v2: theme.js con paletas claro/oscuro, ThemeContext con persistencia y selector Apariencia en los 3 perfiles, tipografías de marca con expo-font, migración de 32 pantallas a estilos dinámicos, contraste tinta-sobre-naranja, Movix→Fleter, SVGs del logo en assets/logo/ |
| `c565311` | 17 Sep 2026 | Fix — mapa en blanco en iOS: `MapViewWrapper` ya no fuerza `PROVIDER_GOOGLE` en iOS (usa Apple Maps, que no necesita API key); Android sigue con Google Maps. Revertir cuando llegue la key nueva con "Maps SDK for iOS" habilitado |
| (pendiente) | 17 Sep 2026 | Feat — mapa real en `DetalleViajeScreen` (pantalla de aceptar viaje del conductor): reemplaza el placeholder "Mapa disponible en Fase 4" por MapView con pins de origen/paradas/destino, `ruta_planeada` si viene (si no, línea recta entre paradas) y encuadre automático del recorrido. Build Release apuntando al backend de producción |
| (pendiente) | 30 Sep 2026 | Docs/Prototipo — pivot a herramienta B2B de gestión de flota: auditoría (fases 1–3) y prototipo HTML interactivo del panel de empresa en `prototype/fleter-empresa-prototype.html` (Nuevo viaje con repetición, Calendario mes/semana, tabla de Viajes, Fleteros, detalle de viaje con simulación de GPS). Sin cambios en el código de la app; el código del marketplace no se elimina |
| (pendiente) | 30 Sep 2026 | Docs — `docs/PIVOT_EMPRESA_BACKEND.md`: fase 5 del pivot a panel de empresa, orientada al backend (modelo de datos aditivo, contrato de API, máquina de estados reutilizando la existente, series recurrentes, sockets, suscripción, migración sobre la base compartida, hitos por dependencia y preguntas abiertas). Sin cambios de código |
| 8cef846 | 07 Oct 2026 | Test — `scripts/api-tests/organizaciones.mjs`: pruebas de contrato de la capa de identidad nueva del backend (PyMEs, miembros, invitaciones, canje, choferes, `GET /api/auth/me`), 109 verificaciones en dos modos por el límite de canjes. Validadas contra un mock local |
| 3d71ed8 | 07 Oct 2026 | Test — reintento ante 500 de Neon despertando; nota de `NODE_USE_ENV_PROXY=1` |
| (pendiente) | 07 Oct 2026 | Test — corrida contra staging: `principal` 94/94. El límite de canjes es por IP (no por usuario) y anda; la prueba del `429` ahora insiste hasta 60 intentos porque la IP de salida del entorno de Claude rota |

---

## Estado Actual por Pantalla

### Auth
| Pantalla | Estado | Notas |
|----------|--------|-------|
| `LoginScreen` | ✅ Funcional | Firebase Auth real. Funciona en mobile, **falla en web** (SDK diferente) |
| `RegisterClienteScreen` | ✅ Funcional | POST /api/auth/registro-cliente |
| `RegisterFleteroScreen` | ⚠️ Incompleto | Falta sección de **vehículo y condiciones** — solo pide datos personales + licencia |
| `RegisterGerenteScreen` | ✅ Funcional | POST /api/auth/registro-gerente (crea gerente + primera empresa), sin pantalla de revisión (acceso inmediato) |
| `CuentaPendienteScreen` | ✅ Funcional | Pantalla post-registro conductor, muestra estado de revisión |

### Cliente
| Pantalla | Estado | Notas |
|----------|--------|-------|
| `HomeScreen` | ✅ Funcional | Últimos 3 viajes reales vía GET /api/viajes/mis-viajes, pull-to-refresh, FAB nuevo viaje |
| `CrearViajeScreen` | ✅ Funcional | Google Places Legacy API para origen/destino/paradas, coords reales en payload, POST /api/viajes/estimar-costo. Selector manual de zona (CABA/PROVINCIA/MIXTO) eliminado — el `zona` del body ya no se manda, el servidor la calcula solo. `fecha_programada` mínima bajada a 1 minuto desde ahora en el mobile (antes 1 hora) — **ojo:** el backend sigue exigiendo su propio mínimo (`ANTICIPACION_MINIMA_MINUTOS`, default 60), así que con ese default el publish puede devolver 400 aunque el form lo deje avanzar, ver Problemas Conocidos |
| `ConfirmacionViajeScreen` | ✅ Funcional | Resumen + POST /api/viajes, navega a BuscandoFletero. Campo "Zona" ahora usa únicamente `estimado.zona` (la calculada por el servidor) |
| `BuscandoFleteroScreen` | ✅ Funcional | Animación de búsqueda, escucha `viaje:conductor_asignado` via socket, botón "Cancelar búsqueda" (POST /cancelar-cliente, funciona en BUSCANDO_CONDUCTOR ya que el timeout automático de 10min se eliminó del backend) |
| `ViajeActivoScreen` | ✅ Funcional | MapView con marcador del conductor en tiempo real, mapa expandible a pantalla completa + botón centrar, Apple Maps en iOS (ver Problemas Conocidos) y Google Maps en Android, mapa:actualizar, alerta:desvio, timeline de estados, escucha `viaje:iniciado` (reemplaza el auto-inicio por GPS), botón cancelar (POST /cancelar-cliente) solo en CONDUCTOR_ASIGNADO, viaje:finalizado. Panel de QR por parada removido (GET /qr-paradas ya no existe en el contrato — la confirmación de entrega pasó a ser por GPS del lado del conductor) |
| `HistorialScreen` | ✅ Funcional | GET /api/viajes/mis-viajes, agrupado por mes, filtros (Todos/Finalizados/Cancelados/En curso), back button |
| `PerfilScreen` | ✅ Funcional | Nombre y email reales del AuthContext, edición local, logout |

### Fletero
| Pantalla | Estado | Notas |
|----------|--------|-------|
| `DisponiblesScreen` | ✅ Funcional | GET /api/viajes/disponibles + socket `viaje:disponible`, bug fix stale closure en acceptance flow. Refetch con `useFocusEffect` al recuperar foco (antes solo cargaba una vez al montar). Pull-to-refresh separado del loading inicial (antes compartían el mismo state y el pull tapaba la lista entera con el spinner). Popup "Registrá tu vehículo" si el conductor no tiene ninguno — Agregar ahora (navega a Perfil y abre el modal de alta) o Más tarde (se descarta, persistido en AsyncStorage por usuario) |
| `NuevoViajeModal` | ✅ Funcional | Bottom sheet con countdown 30s, barra animada, Aceptar/Rechazar |
| `DetalleViajeScreen` | ✅ Funcional | Mapa del recorrido (pins origen/paradas/destino + ruta), fetch /api/viajes/:id para nombre real del cliente, bug fix stale closure, timeout 10s en handleAceptar |
| `ViajeActivoFleteroScreen` | ✅ Funcional | GPS real (expo-location + background task) gateado detrás de "Iniciar viaje" (POST /api/viajes/:id/iniciar) — ya no arranca solo con el primer ping, MapView con posición propia + paradas, mapa expandible + centrar, PATCH CARGANDO/EN_RUTA/DESCARGANDO, timeline reactivo a viaje:estado_cambiado, botón "Cancelar viaje" (POST /cancelar-conductor) visible solo en estado CONDUCTOR_ASIGNADO, botón "Confirmar entrega" en DESCARGANDO (ya no "Escanear QR"). Confirma la parada de origen automáticamente al salir de CARGANDO (mientras el conductor sigue ahí — confirmar-parada exige EN_RUTA/DESCARGANDO y proximidad GPS, así que dejarla para el final la hacía fallar por estar lejos). Si el POST a /iniciar falla del lado del cliente, reconsulta el viaje para no dejar el botón desincronizado del estado real. Espera el fetch inicial antes de renderizar (no muestra la etapa por defecto antes de tener el estado real) |
| `AsignadosScreen` | ✅ Funcional (nueva) | GET /api/viajes/asignados + socket `viaje:asignado`, para conductores afiliados a una empresa que reciben viajes sin tener que aceptarlos — tab nueva en FleteroStack |
| `HistorialFleteroScreen` | ✅ Funcional | API real GET /api/viajes/mis-viajes-conductor, filtros Todos/En curso/Finalizados/Cancelados, duración/puntualidad si vienen en la respuesta |
| `PerfilFleteroScreen` | ✅ Funcional | Datos del usuario, gestión de vehículos (listar/agregar/eliminar), sección "Mis empresas" (afiliarse con código, listar afiliaciones PENDIENTE/ACTIVO, desafiliarse), logout. Abre el modal de alta de vehículo automáticamente si llega desde el popup de `DisponiblesScreen` (route param `abrirVehiculo`) |
| `CobroScreen` | ✅ Funcional | Muestra precio_real y remito PDF reales de route params, navega a DisponiblesHome |
| `CalificacionScreen` | ✅ Funcional | Rating 1-5 + comentario opcional, POST /api/viajes/:id/calificacion, link remito PDF |
| `QREntregaScreen` | ✅ Funcional | Reescrita: ya no escanea QR (`expo-camera` sin uso, contrato eliminó `qr_firmado`) — pide permiso de ubicación y por cada parada pendiente muestra un botón "Confirmar entrega" ("Finalizar viaje" en la última) que manda `POST /confirmar-parada` con `id_parada+lat+lng`. Soporta múltiples paradas, cierre automático al confirmar la última |

### Gerente (nuevo — rol completo)
| Pantalla | Estado | Notas |
|----------|--------|-------|
| `EmpresaHomeScreen` | ✅ Funcional | Dashboard: nombre, CUIT, código de afiliación (regenerar + compartir vía `Share`), calificación promedio, cantidad de conductores activos. Escucha `viaje:requiere_reasignacion` → alerta + navega a asignar |
| `FlotaScreen` | ✅ Funcional | CRUD de vehículos de la flota vía `/api/empresas/:id/vehiculos` (mismo patrón que vehículos propios del conductor) |
| `ConductoresScreen` | ✅ Funcional | Lista conductores PENDIENTE/ACTIVO, aprobar solicitudes, desafiliar |
| `DisponiblesGerenteScreen` | ✅ Funcional | Pull `GET /api/empresas/:id/viajes-disponibles` + push `viaje:disponible` |
| `DetalleViajeGerenteScreen` | ✅ Funcional | Detalle del viaje + botón "Reservar" (`POST /api/viajes/:id/reservar`) |
| `AsignarConductorScreen` | ✅ Funcional | Elegir conductor ACTIVO + vehículo (filtrado por `condiciones_req` del viaje) → `asignar` o `reasignar` según corresponda. Botón "Liberar viaje" (`POST /viajes/:id/cancelar-reserva`) para soltar la reserva sin esperar el timeout de 10min |
| `ViajeActivoGerenteScreen` | ✅ Funcional | Tracking en vivo: mapa, ETA, costo acumulado, timeline, datos de cliente/conductor. Al recibir `viaje:finalizado` muestra link "Ver remito PDF" (o lo pide a `GET /viajes/:id/remito` si se reabre la pantalla ya finalizado) |
| `HistorialEmpresaScreen` | ✅ Funcional | `GET /api/empresas/:id/viajes`, filtros Todos/En curso/Finalizados/Cancelados |
| `PerfilGerenteScreen` | ✅ Funcional | Datos del usuario + logout |

> Nota: helper compartido `src/hooks/useMiEmpresa.js` resuelve la empresa activa del gerente (primera de `GET /api/empresas/mias`) — no hay selector de múltiples empresas todavía, se agregaría ahí si hace falta.

> **Sin probar de punta a punta contra el backend real** — no había una cuenta GERENTE real disponible en esta sesión. El bundle compila sin errores (verificado pidiéndole a Metro que bundlee la app completa), pero falta validar los flujos reales de reservar/asignar/afiliación en dispositivo.

---

## Servicios y Contextos

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `services/api.js` | ✅ | Axios con interceptor JWT automático |
| `services/auth.js` | ✅ | registroCliente, registroConductor via Firebase + backend |
| `services/firebase.js` | ✅ | Inicializa Firebase app (web SDK) |
| `services/socket.js` | ✅ | socket.io-client con Bearer token en auth header |
| `context/AuthContext.js` | ✅ | onAuthStateChanged → POST /api/auth/login → setUser, DEV_MODE via EXPO_PUBLIC_DEV_MODE |
| `context/SocketContext.js` | ✅ | Conecta al login, desconecta al logout |

---

## Navegación

| Stack | Estado | Pantallas |
|-------|--------|-----------|
| `AuthStack` | ✅ | Login → RegisterCliente / RegisterFletero / RegisterGerente → CuentaPendiente |
| `ClienteStack` | ✅ | Bottom tabs: Inicio, Crear, Historial, Perfil + modales de viaje activo |
| `FleteroStack` | ✅ | Bottom tabs: Disponibles, **Asignados** (nueva), Historial, Perfil + DetalleViaje, ViajeActivo |
| `GerenteStack` | ✅ (nueva) | Bottom tabs: Disponibles, Empresa, Historial, Perfil — stacks anidados para reservar/asignar y flota/conductores |
| `RootNavigator` | ✅ | Detecta rol (CLIENTE/CONDUCTOR/FLETERO/GERENTE) y redirige al stack correcto; ADMIN sigue en placeholder "Acceso no disponible" (decisión: panel admin no va en mobile) |

---

## WebSockets — Eventos Implementados

| Evento | Dirección | Dónde | Estado |
|--------|-----------|-------|--------|
| `viaje:disponible` | servidor → conductor | `DisponiblesScreen` | ✅ Agrega a lista + muestra modal |
| `viaje:aceptar` | conductor → servidor | `DisponiblesScreen`, `DetalleViajeScreen` | ✅ |
| `viaje:conductor_asignado` | servidor → room | `DisponiblesScreen`, `DetalleViajeScreen`, `BuscandoFleteroScreen` | ✅ Distingue por `id_usuario_conductor` |
| `viaje:ya_asignado` | servidor → conductor | `DisponiblesScreen`, `DetalleViajeScreen` | ✅ Muestra alerta |
| `viaje:cancelado_sin_conductor` | servidor → cliente | — | ❌ Removido — el backend eliminó el timeout automático de 10min, se sacó el listener de `BuscandoFleteroScreen` |
| `viaje:iniciado` | servidor → room personal cliente | `ViajeActivoScreen` | ✅ Reemplaza el auto-inicio por GPS |
| `viaje:asignado` | servidor → room personal conductor | `AsignadosScreen` | ✅ Refresca la lista de asignados |
| `viaje:reservado` | servidor → room del viaje | `DisponiblesGerenteScreen` | ✅ Saca el viaje de la lista |
| `viaje:reserva_cancelada` | servidor → room del viaje | — | ⚠️ No escuchado todavía (el viaje vuelve al mercado, `DisponiblesGerenteScreen` lo vuelve a ver por `viaje:disponible`) |
| `viaje:requiere_reasignacion` | servidor → room personal gerente | `EmpresaHomeScreen` | ✅ Alert + navega a `AsignarConductorScreen` |
| `conductor:ubicacion` | conductor → servidor | `ViajeActivoFleteroScreen` | ✅ Background task cada 15s, solo después de `POST /iniciar` |
| `mapa:actualizar` | servidor → room | `ViajeActivoScreen` | ✅ Actualiza marcador del conductor |
| `costo:actualizar` | servidor → room | `ViajeActivoScreen` | ✅ Actualiza costo acumulado |
| `viaje:estado_cambiado` | servidor → room | `ViajeActivoFleteroScreen`, `ViajeActivoScreen` | ✅ Timeline reactivo |
| `alerta:desvio` | servidor → room | `ViajeActivoScreen` | ✅ Banner de alerta |
| `alerta:parada` | servidor → room | `ViajeActivoScreen` | ✅ Banner de parada sospechosa |
| `eta:actualizar` | servidor → room | `ViajeActivoScreen`, `ViajeActivoFleteroScreen` | ✅ Muestra "Llega en ~X min" / "Próxima parada en ~X min" |
| `ruta:recalculada` | servidor → room | `ViajeActivoScreen`, `ViajeActivoFleteroScreen` | ✅ Actualiza Polyline en mapa + banner "Ruta recalculada" |
| `viaje:finalizado` | servidor → room | `ViajeActivoScreen`, `ViajeActivoFleteroScreen` | ✅ Cliente → CalificacionScreen, Fletero → CobroScreen |

---

## Problemas Conocidos

| Problema | Causa | Estado |
|----------|-------|--------|
| Login web no funciona | Firebase web SDK vs React Native Firebase SDK se comportan diferente | ❌ Sin resolver |
| Retomar viaje activo | Fletero cierra y vuelve a abrir la app — `DisponiblesScreen` detecta viaje activo y navega automáticamente | ✅ Resuelto |
| Conductor no ve viajes con requisitos | `RegisterFleteroScreen` no registra vehículo ni condiciones → backend filtra por elegibilidad | ❌ Pendiente Fase 1 completa |
| `viaje:ya_asignado` + `viaje:conductor_asignado` doble alert | Conductor que pierde en `DetalleViajeScreen` puede recibir dos alerts | ⚠️ Menor, sin resolver |
| `OfertaScreen` legada | Existía antes de NuevoViajeModal, posiblemente sin uso | ⚠️ Revisar si eliminar |
| Acceptance flow no responde | Backend no procesa `viaje:aceptar` — frontend ya tiene timeout 10s como safety net | ❌ Requiere fix en backend |
| GPS background en Expo Go | `startLocationUpdatesAsync` requiere build nativa — fallback a interval foreground activo | ⚠️ Funciona en foreground, background requiere build nativa |
| MapView no disponible en Expo Go | `react-native-maps` requiere módulo nativo — MapViewWrapper muestra placeholder | ⚠️ Funciona en build nativa |
| Mapa en blanco en iOS | La `googleMapsApiKey` de `app.json` / `AppDelegate.swift` es la misma que la de Firebase (`AIzaSyDpWE…`) y no tiene habilitado **Maps SDK for iOS** → Google Maps carga el tile vacío | ⚠️ Workaround: `MapViewWrapper` deja `PROVIDER_GOOGLE` en `undefined` en iOS, así usa Apple Maps (sin key). Al llegar la key nueva: ponerla en `app.json` + `AppDelegate.swift`, revertir esa línea y recompilar |
| Perfil de aprovisionamiento vencido | El "iOS Team Provisioning Profile" del Apple ID gratuito caducó el 21 Ago 2026 y `expo run:ios` no lo renueva solo | ✅ Resuelto — compilar con `xcodebuild … -allowProvisioningUpdates` lo regenera (ver comando en Variables de Entorno) |
| Transición CARGANDO → EN_RUTA | Confirmado en api.md nuevo: es manual, vía `PATCH /api/viajes/:id/estado` con `estado: 'EN_RUTA'` (agregado a la lista de estados válidos de ese endpoint) | ✅ Resuelto — ya lo hace `ViajeActivoFleteroScreen` |
| `id_usuario_conductor` removido del payload | API nueva no incluye ese campo en `viaje:conductor_asignado` — lógica de navegación actualizada para no depender de él | ✅ Resuelto |
| Cancelación del cliente rota | `ViajeActivoScreen` (cliente) llamaba `PATCH /api/viajes/:id/estado` con `estado: 'CANCELADO'`, que nunca fue válido para rol CLIENTE | ✅ Resuelto — el backend agregó `POST /api/viajes/:id/cancelar-cliente`, ya conectado en `ViajeActivoScreen` y `BuscandoFleteroScreen` |
| GERENTE sin probar contra backend real | No había cuenta GERENTE disponible en la sesión que se implementó el rol completo | ⚠️ Pendiente — el bundle compila (verificado con Metro) pero falta test end-to-end de reservar/asignar/afiliación en dispositivo |
| `viaje:reserva_cancelada` no escuchado | El viaje vuelve al mercado, pero `DisponiblesGerenteScreen` no lo saca proactivamente de otras listas (sí lo vuelve a agregar `viaje:disponible` si se re-publica) | ⚠️ Menor, sin resolver |
| `api.md` desincronizado del código | El archivo en disco había quedado en la versión "Fase 5" (sin zona/iniciar/admin/jerarquía) aunque el código del rol GERENTE ya estaba implementado — probablemente una escritura anterior no se guardó bien | ✅ Resuelto — resincronizado con el contrato completo, verificado contra cada pantalla existente |
| Gerente no podía soltar una reserva | `POST /viajes/:id/cancelar-reserva` existe en el contrato pero nada lo llamaba — un gerente que reservaba y se arrepentía dejaba el viaje bloqueado hasta el timeout de 10min | ✅ Resuelto — botón "Liberar viaje" en `AsignarConductorScreen` |
| Gerente sin acceso al remito | `GET /viajes/:id/remito` acepta rol GERENTE pero `ViajeActivoGerenteScreen` no mostraba nada al finalizar el viaje | ✅ Resuelto — link "Ver remito PDF" usando `remito_url` de `viaje:finalizado` (o fetch de respaldo si la pantalla se reabre) |
| `fecha_programada` mínima desincronizada mobile/backend | `CrearViajeScreen` baja su mínimo a 1 minuto, pero el backend real sigue con `ANTICIPACION_MINIMA_MINUTOS` en 60 (default) — confirmado en dispositivo: el form deja publicar y el backend devuelve 400 `fecha_programada debe ser una fecha ISO futura (al menos 1 hora desde ahora)` | ❌ Pendiente — hay que bajar la variable de entorno en el backend, o subir de nuevo el mínimo del mobile a 60 |
| Botón "Iniciar viaje" quedaba desincronizado | Si el POST a `/api/viajes/:id/iniciar` fallaba del lado del cliente (timeout, cold start) aunque el backend ya hubiera aplicado el cambio, el botón seguía mostrando "Iniciar viaje" y el segundo intento devolvía error de "ya iniciado". El endpoint no emite ningún evento que el fletero escuche | ✅ Resuelto — ante error, `ViajeActivoFleteroScreen` reconsulta `GET /api/viajes/:id` y sincroniza el estado real antes de mostrar un error |
| Confirmación de la parada de origen imposible al final del viaje | `confirmar-parada` exige estado `EN_RUTA`/`DESCARGANDO` + proximidad GPS a la parada. Si la confirmación de la parada de origen se difiere hasta `DESCARGANDO` (como hacía la pantalla de confirmación), el conductor ya está lejos del origen y la valida por proximidad la rechaza | ✅ Resuelto — se confirma automáticamente al salir de `CARGANDO`, mientras el conductor sigue en el origen. Nota: viajes que ya estaban más allá de `CARGANDO` antes de este fix no tienen la parada de origen confirmada retroactivamente |

---

## Próximos Pasos por Fase

### Rediseño v2 "Fleter" (implementado — ver UXUI.md)
- [x] UXUI.md + CLAUDE.md actualizados con el sistema v2
- [x] Mockups de 11 pantallas en canvas (claro + oscuro, ambos roles, login)
- [x] Componente `Isotipo` (theme-aware) en HomeScreen y LoginScreen
- [x] `src/theme.js` reescrito: paletas `palettes.light/dark` v2 con alias legacy (background, surface1, textPrimary…) para compatibilidad; radios v2; export `fonts`
- [x] `src/context/ThemeContext.js`: `useTheme()` + `useThemedStyles()`, persistencia en AsyncStorage (`@fleter/apariencia`), default por rol (conductor → oscuro), modo Sistema con `useColorScheme`
- [x] Selector Claro/Oscuro/Sistema (`SelectorApariencia`) en los 3 perfiles (cliente, conductor, gerente)
- [x] Tipografías cargadas en App.js (Archivo Black, Manrope 400–800, JetBrains Mono, Josefin Sans 600); aplicadas al wordmark del login y al saludo del Home
- [x] Migración de 32 pantallas/componentes al patrón `createStyles(colors)` + `useThemedStyles` (los estilos reaccionan al cambio de tema); `barStyle` dinámico; tema de React Navigation derivado de la paleta
- [x] Regla de contraste v2: texto y spinners sobre botones naranjas pasados a `colors.onAccent` (tinta) — 25 estilos corregidos
- [x] Textos visibles "Movix" → "Fleter" (notificación GPS, permisos de app.json, mensaje de afiliación); el bundleIdentifier `com.movix.fletermobile` NO se tocó para no romper firma
- [x] SVGs del isotipo en `assets/logo/` (claro, oscuro, mono, ícono de app claro/oscuro)
- [ ] Aplicar Manrope al resto de los textos (hoy usan la fuente del sistema) y Archivo Black/Mono a precios, IDs y patentes pantalla por pantalla
- [ ] Ícono nativo de la app (assets/icon.png) regenerado desde app-icon.svg
- [ ] Layout v2 de las cards de viaje (regla de los 9 datos, cards sin sombra) pantalla por pantalla

### Fase 1 (incompleto)
- [ ] Agregar sección de vehículo + condiciones a `RegisterFleteroScreen`
- [ ] Backend: endpoint para registrar vehículo (POST /api/vehiculos o similar)

### Fase 2 (completo)
- [x] `HistorialScreen` (cliente) — GET /api/viajes/mis-viajes, estados con colores, agrupado por mes
- [x] `HistorialFleteroScreen` — GET /api/viajes/mis-viajes-conductor real, filtros Todos/En curso/Finalizados/Cancelados

### Fase 3 (casi completo)
- [ ] Pantalla de espera del cliente con animación (`BuscandoFleteroScreen` existe pero básica)
- [x] Manejar `viaje:cancelado_sin_conductor` en `BuscandoFleteroScreen`
- [ ] Fix doble alert en `DetalleViajeScreen` cuando conductor pierde
- [x] Cancelación de viaje por el conductor (`POST /api/viajes/:id/cancelar-conductor`) en `ViajeActivoFleteroScreen`, solo habilitada en estado `CONDUCTOR_ASIGNADO`

### Fase 4 (completo)
- [x] `react-native-maps` + `expo-task-manager` instalados
- [x] Google Maps API key en app.json (android)
- [x] Plugin `expo-location` con background permissions en app.json
- [x] `src/tasks/locationTask.js` — background GPS task (defineTask + start/stop)
- [x] `ViajeActivoFleteroScreen` — GPS real, MapView, PATCH estados, timeline reactivo
- [x] `ViajeActivoScreen` — MapView con conductor marker, socket mapa:actualizar + costo:actualizar + alerta:desvio

### Fase 5 (completo)
- [x] `QREntregaScreen` — `expo-barcode-scanner` real, permiso de cámara, `POST /api/viajes/:id/confirmar-parada` con `qr_firmado+lat+lng`, modal de ingreso manual
- [x] `ViajeActivoScreen` (cliente) — QR via `GET /api/viajes/:id/qr-paradas` desde CARGANDO, paginador multi-parada, expandible a pantalla completa
- [x] `CalificacionScreen` (cliente) — rating 1-5 + comentario, `POST /api/viajes/:id/calificacion`, link remito PDF
- [x] `CobroScreen` (fletero) — muestra precio_real y remito PDF reales
- [x] `ViajeActivoScreen` navega a `CalificacionScreen` al recibir `viaje:finalizado`
- [x] Fix CARGANDO → EN_RUTA: transición de estado y label de botón agregados en `ViajeActivoFleteroScreen`
- [x] `react-native-qrcode-svg` + `react-native-svg` instalados

### Fase 4 extra (completo)
- [x] `eta:actualizar` en `ViajeActivoScreen` (cliente) y `ViajeActivoFleteroScreen`
- [x] `ruta:recalculada` en ambas pantallas — actualiza Polyline + banner info
- [x] Polyline en mapa exportada desde `MapViewWrapper` y renderizada con `ruta_planeada` del backend
- [x] Retomar viaje activo: `DisponiblesScreen` detecta en mount si hay viaje activo y navega a `ViajeActivoFleteroScreen`
- [x] Google Maps en iOS (antes solo Android) + mapa expandible a pantalla completa + botón centrar (cliente y fletero)

### Fase 6 — Estructura jerárquica: empresas y rol GERENTE (completo, sin probar contra backend real)
- [x] Flujo "Iniciar viaje" manual (`POST /api/viajes/:id/iniciar`) reemplaza el auto-inicio por GPS — gatea el `useEffect` de tracking en `ViajeActivoFleteroScreen`
- [x] `viaje:iniciado` en `ViajeActivoScreen` (cliente)
- [x] Cancelación de búsqueda del cliente (`BuscandoFleteroScreen`, ya no hay timeout automático)
- [x] Zona mostrada en `ConfirmacionViajeScreen` usa la calculada por el servidor, no la elegida por el usuario
- [x] Duración real y puntualidad en `HistorialScreen` y `HistorialFleteroScreen`
- [x] Conductor afiliado: tab "Asignados" + gestión de afiliaciones en `PerfilFleteroScreen`
- [x] Rol GERENTE completo: registro, `GerenteStack`, empresa/flota/conductores, reservar/asignar/reasignar, tracking, historial
- [ ] Probar contra un backend real con cuenta GERENTE (reservar → asignar → iniciar → tracking → finalizar de punta a punta)
- [ ] Escuchar `viaje:reserva_cancelada` en `DisponiblesGerenteScreen`
- [ ] Selector de múltiples empresas en `useMiEmpresa` si un gerente llega a tener más de una

### Fase 7 — Confirmación por GPS y fixes de testing en dispositivo (completo)
- [x] `QREntregaScreen` reescrita: confirmación de entrega por GPS en vez de QR (contrato eliminó `qr_firmado`/`GET /qr-paradas`)
- [x] Panel de QR removido de `ViajeActivoScreen` (cliente) — llamaba a un endpoint que ya no existe
- [x] Popup de alta de vehículo para el fletero sin vehículos registrados
- [x] `DisponiblesScreen`: refetch al recuperar foco + fix de pull-to-refresh
- [x] Selector manual de zona eliminado de `CrearViajeScreen`
- [x] Fix: parada de origen se confirma al salir de `CARGANDO`, no al final del viaje
- [x] Fix: botón "Iniciar viaje" se resincroniza con el backend si el POST falla del lado del cliente
- [x] `ViajeActivoFleteroScreen` espera el estado real antes de renderizar la etapa del viaje
- [ ] Coordinar con backend el valor de `ANTICIPACION_MINIMA_MINUTOS` (mobile ya está en 1 min, backend sigue en 60)

---

## Variables de Entorno

| Variable | Valor actual | Descripción |
|----------|-------------|-------------|
| `EXPO_PUBLIC_DEV_MODE` | `false` | `false` = Firebase real, `true` = mock auth para desarrollo |
| `EXPO_PUBLIC_API_URL` | URL backend | Base URL para axios |
| `EXPO_PUBLIC_SOCKET_URL` | URL backend | URL para socket.io |
