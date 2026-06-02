# Fleter Mobile — Registro de Progreso

> Última actualización: 2026-06-02  
> Branch: master | Commits totales: 15

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
| *(próximo)* | 02 Jun 2026 | Fix — escuchar evento error del socket para cancelar spinner cuando backend rechaza viaje:aceptar |

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
| `ViajeActivoScreen` | 🔧 Placeholder | Pantalla existe pero sin GPS real ni tracking (Fase 4) |
| `HistorialScreen` | ✅ Funcional | GET /api/viajes/mis-viajes, agrupado por mes, filtros (Todos/Finalizados/Cancelados/En curso), back button |
| `PerfilScreen` | ✅ Funcional | Nombre y email reales del AuthContext, edición local, logout |

### Fletero
| Pantalla | Estado | Notas |
|----------|--------|-------|
| `DisponiblesScreen` | ✅ Funcional | GET /api/viajes/disponibles + socket `viaje:disponible`, bug fix stale closure en acceptance flow |
| `NuevoViajeModal` | ✅ Funcional | Bottom sheet con countdown 30s, barra animada, Aceptar/Rechazar |
| `DetalleViajeScreen` | ✅ Funcional | Fetch /api/viajes/:id para nombre real del cliente, bug fix stale closure, timeout 10s en handleAceptar |
| `ViajeActivoFleteroScreen` | 🔧 Placeholder | Pantalla existe, sin GPS background real (Fase 4) |
| `HistorialFleteroScreen` | ✅ Funcional | UI completa con filtros y totales, mock data lista para swap a /api/viajes/mis-viajes-conductor |
| `PerfilFleteroScreen` | ✅ Funcional | Muestra datos del usuario, botón logout |
| `CobroScreen` | 🔧 Placeholder | UI básica, sin lógica de pago real (Fase 6) |
| `QREntregaScreen` | 🔧 Placeholder | Scanner preparado, sin lógica de confirmación (Fase 5) |
| `OfertaScreen` | 🔧 Legado | Reemplazada por NuevoViajeModal + DetalleViajeScreen, probablemente se elimina |

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
| `viaje:cancelado_sin_conductor` | servidor → cliente | — | ❌ No implementado |

---

## Problemas Conocidos

| Problema | Causa | Estado |
|----------|-------|--------|
| Login web no funciona | Firebase web SDK vs React Native Firebase SDK se comportan diferente | ❌ Sin resolver |
| Conductor no ve viajes con requisitos | `RegisterFleteroScreen` no registra vehículo ni condiciones → backend filtra por elegibilidad | ❌ Pendiente Fase 1 completa |
| `viaje:ya_asignado` + `viaje:conductor_asignado` doble alert | Conductor que pierde en `DetalleViajeScreen` puede recibir dos alerts | ⚠️ Menor, sin resolver |
| `OfertaScreen` legada | Existía antes de NuevoViajeModal, posiblemente sin uso | ⚠️ Revisar si eliminar |
| Acceptance flow no responde | Backend no procesa `viaje:aceptar` — frontend ya tiene timeout 10s como safety net | ❌ Requiere fix en backend |
| `id_usuario_conductor` removido del payload | API nueva no incluye ese campo en `viaje:conductor_asignado` — lógica de navegación actualizada para no depender de él | ✅ Resuelto |

---

## Próximos Pasos por Fase

### Fase 1 (incompleto)
- [ ] Agregar sección de vehículo + condiciones a `RegisterFleteroScreen`
- [ ] Backend: endpoint para registrar vehículo (POST /api/vehiculos o similar)

### Fase 2 (casi completo)
- [x] `HistorialScreen` (cliente) — GET /api/viajes/mis-viajes, estados con colores, agrupado por mes
- [ ] `HistorialFleteroScreen` — endpoint pendiente en backend (GET /api/viajes/mis-viajes-conductor); UI ya lista

### Fase 3 (casi completo)
- [ ] Pantalla de espera del cliente con animación (`BuscandoFleteroScreen` existe pero básica)
- [ ] Manejar `viaje:cancelado_sin_conductor` en el cliente
- [ ] Fix doble alert en `DetalleViajeScreen` cuando conductor pierde

### Fase 4 (sin empezar)
- GPS background real con `react-native-background-geolocation`
- Emit `fletero:ubicacion` cada 15s
- `ViajeActivoFleteroScreen` con mapa y paradas
- `ViajeActivoScreen` cliente con pin en tiempo real

---

## Variables de Entorno

| Variable | Valor actual | Descripción |
|----------|-------------|-------------|
| `EXPO_PUBLIC_DEV_MODE` | `false` | `false` = Firebase real, `true` = mock auth para desarrollo |
| `EXPO_PUBLIC_API_URL` | URL backend | Base URL para axios |
| `EXPO_PUBLIC_SOCKET_URL` | URL backend | URL para socket.io |
