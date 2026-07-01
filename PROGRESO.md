# Fleter Mobile — Registro de Progreso

> Última actualización: 2026-07-01  
> Branch: master | Commits totales: 31

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

---

## Estado Actual por Pantalla

### Auth
| Pantalla | Estado | Notas |
|----------|--------|-------|
| `LoginScreen` | ✅ Funcional | Firebase Auth real. Funciona en mobile, **falla en web** (SDK diferente) |
| `RegisterClienteScreen` | ✅ Funcional | POST /api/auth/registro-cliente |
| `RegisterFleteroScreen` | ⚠️ Incompleto | Falta sección de **vehículo y condiciones** — solo pide datos personales + licencia |
| `CuentaPendienteScreen` | ✅ Funcional | Pantalla post-registro conductor, muestra estado de revisión |

### Cliente
| Pantalla | Estado | Notas |
|----------|--------|-------|
| `HomeScreen` | ✅ Funcional | Últimos 3 viajes reales vía GET /api/viajes/mis-viajes, pull-to-refresh, FAB nuevo viaje |
| `CrearViajeScreen` | ✅ Funcional | Google Places Legacy API para origen/destino/paradas, coords reales en payload, POST /api/viajes/estimar-costo |
| `ConfirmacionViajeScreen` | ✅ Funcional | Resumen + POST /api/viajes, navega a BuscandoFletero |
| `BuscandoFleteroScreen` | ✅ Funcional | Animación de búsqueda, escucha `viaje:conductor_asignado` via socket |
| `ViajeActivoScreen` | ✅ Funcional | MapView con marcador del conductor en tiempo real, mapa:actualizar, alerta:desvio, timeline de estados, QR por parada via GET /qr-paradas, expandible, paginador si hay múltiples paradas, viaje:finalizado |
| `HistorialScreen` | ✅ Funcional | GET /api/viajes/mis-viajes, agrupado por mes, filtros (Todos/Finalizados/Cancelados/En curso), back button |
| `PerfilScreen` | ✅ Funcional | Nombre y email reales del AuthContext, edición local, logout |

### Fletero
| Pantalla | Estado | Notas |
|----------|--------|-------|
| `DisponiblesScreen` | ✅ Funcional | GET /api/viajes/disponibles + socket `viaje:disponible`, bug fix stale closure en acceptance flow |
| `NuevoViajeModal` | ✅ Funcional | Bottom sheet con countdown 30s, barra animada, Aceptar/Rechazar |
| `DetalleViajeScreen` | ✅ Funcional | Fetch /api/viajes/:id para nombre real del cliente, bug fix stale closure, timeout 10s en handleAceptar |
| `ViajeActivoFleteroScreen` | ✅ Funcional | GPS real (expo-location + background task), MapView con posición propia + paradas, PATCH CARGANDO/DESCARGANDO, timeline reactivo a viaje:estado_cambiado, botón "Cancelar viaje" (POST /cancelar-conductor) visible solo en estado CONDUCTOR_ASIGNADO |
| `HistorialFleteroScreen` | ✅ Funcional | API real GET /api/viajes/mis-viajes-conductor, filtros Todos/En curso/Finalizados/Cancelados |
| `PerfilFleteroScreen` | ✅ Funcional | Datos del usuario, gestión de vehículos (listar/agregar/eliminar), logout |
| `CobroScreen` | ✅ Funcional | Muestra precio_real y remito PDF reales de route params, navega a DisponiblesHome |
| `CalificacionScreen` | ✅ Funcional | Rating 1-5 + comentario opcional, POST /api/viajes/:id/calificacion, link remito PDF |
| `QREntregaScreen` | ✅ Funcional | expo-barcode-scanner real, validación POST /confirmar-parada con lat/lng, soporta múltiples paradas, modal manual, cierre automático al confirmar última parada |

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
| `AuthStack` | ✅ | Login → RegisterCliente / RegisterFletero → CuentaPendiente |
| `ClienteStack` | ✅ | Bottom tabs: Inicio, Crear, Historial, Perfil + modales de viaje activo |
| `FleteroStack` | ✅ | Bottom tabs: Disponibles, Historial, Perfil + DetalleViaje, ViajeActivo |
| `RootNavigator` | ✅ | Detecta rol del JWT y redirige al stack correcto |

---

## WebSockets — Eventos Implementados

| Evento | Dirección | Dónde | Estado |
|--------|-----------|-------|--------|
| `viaje:disponible` | servidor → conductor | `DisponiblesScreen` | ✅ Agrega a lista + muestra modal |
| `viaje:aceptar` | conductor → servidor | `DisponiblesScreen`, `DetalleViajeScreen` | ✅ |
| `viaje:conductor_asignado` | servidor → room | `DisponiblesScreen`, `DetalleViajeScreen`, `BuscandoFleteroScreen` | ✅ Distingue por `id_usuario_conductor` |
| `viaje:ya_asignado` | servidor → conductor | `DisponiblesScreen`, `DetalleViajeScreen` | ✅ Muestra alerta |
| `viaje:cancelado_sin_conductor` | servidor → cliente | `BuscandoFleteroScreen` | ✅ Alert con mensaje y botón volver al inicio |
| `conductor:ubicacion` | conductor → servidor | `ViajeActivoFleteroScreen` | ✅ Background task cada 15s |
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
| Transición CARGANDO → EN_RUTA | No documentada en api.md — frontend asume que el backend la auto-dispara con GPS | ⚠️ Pendiente confirmar con backend |
| `id_usuario_conductor` removido del payload | API nueva no incluye ese campo en `viaje:conductor_asignado` — lógica de navegación actualizada para no depender de él | ✅ Resuelto |
| Cancelación del cliente rota | `ViajeActivoScreen` (cliente) llama `PATCH /api/viajes/:id/estado` con `estado: 'CANCELADO'`, pero el contrato solo permite rol `CONDUCTOR` y valores `CARGANDO`/`DESCARGANDO` en ese endpoint — no hay endpoint de cancelación documentado para el cliente | ❌ Pendiente, requiere endpoint nuevo en backend |

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
- [x] `RootNavigator` maneja rol `GERENTE`/`ADMIN` con pantalla "Acceso no disponible"

---

## Variables de Entorno

| Variable | Valor actual | Descripción |
|----------|-------------|-------------|
| `EXPO_PUBLIC_DEV_MODE` | `false` | `false` = Firebase real, `true` = mock auth para desarrollo |
| `EXPO_PUBLIC_API_URL` | URL backend | Base URL para axios |
| `EXPO_PUBLIC_SOCKET_URL` | URL backend | URL para socket.io |
