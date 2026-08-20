# Fleter Mobile — Registro de Progreso

> Última actualización: 2026-08-19  
> Branch: master | Commits totales: 33

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
| `CrearViajeScreen` | ✅ Funcional | Google Places Legacy API para origen/destino/paradas, coords reales en payload, POST /api/viajes/estimar-costo |
| `ConfirmacionViajeScreen` | ✅ Funcional | Resumen + POST /api/viajes, navega a BuscandoFletero |
| `BuscandoFleteroScreen` | ✅ Funcional | Animación de búsqueda, escucha `viaje:conductor_asignado` via socket, botón "Cancelar búsqueda" (POST /cancelar-cliente, funciona en BUSCANDO_CONDUCTOR ya que el timeout automático de 10min se eliminó del backend) |
| `ViajeActivoScreen` | ✅ Funcional | MapView con marcador del conductor en tiempo real, mapa expandible a pantalla completa + botón centrar, Google Maps en iOS y Android, mapa:actualizar, alerta:desvio, timeline de estados, escucha `viaje:iniciado` (reemplaza el auto-inicio por GPS), botón cancelar (POST /cancelar-cliente) solo en CONDUCTOR_ASIGNADO, QR por parada via GET /qr-paradas, expandible, paginador si hay múltiples paradas, viaje:finalizado |
| `HistorialScreen` | ✅ Funcional | GET /api/viajes/mis-viajes, agrupado por mes, filtros (Todos/Finalizados/Cancelados/En curso), back button |
| `PerfilScreen` | ✅ Funcional | Nombre y email reales del AuthContext, edición local, logout |

### Fletero
| Pantalla | Estado | Notas |
|----------|--------|-------|
| `DisponiblesScreen` | ✅ Funcional | GET /api/viajes/disponibles + socket `viaje:disponible`, bug fix stale closure en acceptance flow |
| `NuevoViajeModal` | ✅ Funcional | Bottom sheet con countdown 30s, barra animada, Aceptar/Rechazar |
| `DetalleViajeScreen` | ✅ Funcional | Fetch /api/viajes/:id para nombre real del cliente, bug fix stale closure, timeout 10s en handleAceptar |
| `ViajeActivoFleteroScreen` | ✅ Funcional | GPS real (expo-location + background task) gateado detrás de "Iniciar viaje" (POST /api/viajes/:id/iniciar) — ya no arranca solo con el primer ping, MapView con posición propia + paradas, mapa expandible + centrar, PATCH CARGANDO/EN_RUTA/DESCARGANDO, timeline reactivo a viaje:estado_cambiado, botón "Cancelar viaje" (POST /cancelar-conductor) visible solo en estado CONDUCTOR_ASIGNADO |
| `AsignadosScreen` | ✅ Funcional (nueva) | GET /api/viajes/asignados + socket `viaje:asignado`, para conductores afiliados a una empresa que reciben viajes sin tener que aceptarlos — tab nueva en FleteroStack |
| `HistorialFleteroScreen` | ✅ Funcional | API real GET /api/viajes/mis-viajes-conductor, filtros Todos/En curso/Finalizados/Cancelados, duración/puntualidad si vienen en la respuesta |
| `PerfilFleteroScreen` | ✅ Funcional | Datos del usuario, gestión de vehículos (listar/agregar/eliminar), sección "Mis empresas" (afiliarse con código, listar afiliaciones PENDIENTE/ACTIVO, desafiliarse), logout |
| `CobroScreen` | ✅ Funcional | Muestra precio_real y remito PDF reales de route params, navega a DisponiblesHome |
| `CalificacionScreen` | ✅ Funcional | Rating 1-5 + comentario opcional, POST /api/viajes/:id/calificacion, link remito PDF |
| `QREntregaScreen` | ✅ Funcional | `expo-camera` (migrado desde `expo-barcode-scanner`, deprecado y sin build contra Expo SDK 54), validación POST /confirmar-parada con lat/lng, soporta múltiples paradas, modal manual, cierre automático al confirmar última parada |

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
| Transición CARGANDO → EN_RUTA | Confirmado en api.md nuevo: es manual, vía `PATCH /api/viajes/:id/estado` con `estado: 'EN_RUTA'` (agregado a la lista de estados válidos de ese endpoint) | ✅ Resuelto — ya lo hace `ViajeActivoFleteroScreen` |
| `id_usuario_conductor` removido del payload | API nueva no incluye ese campo en `viaje:conductor_asignado` — lógica de navegación actualizada para no depender de él | ✅ Resuelto |
| Cancelación del cliente rota | `ViajeActivoScreen` (cliente) llamaba `PATCH /api/viajes/:id/estado` con `estado: 'CANCELADO'`, que nunca fue válido para rol CLIENTE | ✅ Resuelto — el backend agregó `POST /api/viajes/:id/cancelar-cliente`, ya conectado en `ViajeActivoScreen` y `BuscandoFleteroScreen` |
| GERENTE sin probar contra backend real | No había cuenta GERENTE disponible en la sesión que se implementó el rol completo | ⚠️ Pendiente — el bundle compila (verificado con Metro) pero falta test end-to-end de reservar/asignar/afiliación en dispositivo |
| `viaje:reserva_cancelada` no escuchado | El viaje vuelve al mercado, pero `DisponiblesGerenteScreen` no lo saca proactivamente de otras listas (sí lo vuelve a agregar `viaje:disponible` si se re-publica) | ⚠️ Menor, sin resolver |
| `api.md` desincronizado del código | El archivo en disco había quedado en la versión "Fase 5" (sin zona/iniciar/admin/jerarquía) aunque el código del rol GERENTE ya estaba implementado — probablemente una escritura anterior no se guardó bien | ✅ Resuelto — resincronizado con el contrato completo, verificado contra cada pantalla existente |
| Gerente no podía soltar una reserva | `POST /viajes/:id/cancelar-reserva` existe en el contrato pero nada lo llamaba — un gerente que reservaba y se arrepentía dejaba el viaje bloqueado hasta el timeout de 10min | ✅ Resuelto — botón "Liberar viaje" en `AsignarConductorScreen` |
| Gerente sin acceso al remito | `GET /viajes/:id/remito` acepta rol GERENTE pero `ViajeActivoGerenteScreen` no mostraba nada al finalizar el viaje | ✅ Resuelto — link "Ver remito PDF" usando `remito_url` de `viaje:finalizado` (o fetch de respaldo si la pantalla se reabre) |

---

## Próximos Pasos por Fase

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

---

## Variables de Entorno

| Variable | Valor actual | Descripción |
|----------|-------------|-------------|
| `EXPO_PUBLIC_DEV_MODE` | `false` | `false` = Firebase real, `true` = mock auth para desarrollo |
| `EXPO_PUBLIC_API_URL` | URL backend | Base URL para axios |
| `EXPO_PUBLIC_SOCKET_URL` | URL backend | URL para socket.io |
