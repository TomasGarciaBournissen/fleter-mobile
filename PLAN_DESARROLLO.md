# FLETER — Plan de Desarrollo MVP

> Documento interno — Equipo Fleter  
> Versión MVP | CABA + Gran Buenos Aires | 2025

---

## Roles del Equipo

| Rol | Responsabilidad |
|-----|----------------|
| **Persona 1 — Backend** | API REST, PostgreSQL + Prisma, WebSockets + matching, algoritmos de mapas y costos, MercadoPago, Firebase Auth, deploy |
| **Persona 2 — Mobile** | App React Native + Expo, pantallas cliente y fletero, GPS background, QR scanner, notificaciones push |
| **Persona 3 — Web** | Panel Next.js, dashboard cliente, mapa en tiempo real, flujo de creación de viaje, historial |

**Regla de dependencia:** Mobile y Web no pueden avanzar sin que el contrato de la API esté documentado. El Backend es siempre el primer paso de cada fase.

---

## Índice de Fases

| Fase | Nombre | Descripción |
|------|--------|-------------|
| **FASE 0** ✅ | Fundaciones — Solo Backend | Scaffold, base de datos, contrato de API, autenticación |
| **FASE 1** 🔄 | Usuarios y Registro | Alta de clientes, fleteros, vehículos y verificación de requisitos |
| **FASE 2** | Creación y Publicación de Viajes | El cliente crea un viaje, el sistema lo publica a los fleteros elegibles |
| **FASE 3** | Matching en Tiempo Real | WebSockets, sistema de oferta simultánea y asignación automática |
| **FASE 4** | El Viaje en Vivo | GPS activo, tracking, estados, algoritmos de costo, detección de desvíos |
| **FASE 5** | Confirmación y Cierre del Viaje | QR por parada, ajuste de precio final, calificación del fletero |
| **FASE 6** | Pagos Completos | Cobro al cliente, fee, ajuste, transferencia al fletero, penalidades |
| **FASE 7** | Cancelaciones y Penalidades | Lógica de cancelación con y sin penalidad para cliente y fletero |
| **FASE 8** | Viajes Programados | Solicitar viaje para fecha futura, disponibilidad de fleteros |
| **FASE 9** | Notificaciones y Alertas | Push notifications completas, historial de alertas, alertas de desvío |
| **FASE 10** | Pulido, Seguridad y Producción | Testing, seguridad, migración a cloud pago, publicación en stores |

---

## FASE 0 — Fundaciones ✅
**Solo Persona 1 — Backend**

Nadie puede arrancar sin que esta fase esté completa. Es el cimiento de todo el sistema.

### Backend
- [x] Definir el esquema completo de la base de datos (usuarios, vehículos, viajes, paradas, estados, pagos, calificaciones, penalidades)
- [x] Crear el proyecto backend (Express, estructura de carpetas, ESLint, .env)
- [x] Conectar PostgreSQL con Prisma (schema.prisma + primera migración)
- [x] Configurar Firebase Authentication (email/password + Google, middleware JWT)
- [x] Documentar el contrato de la API (api.md con endpoints y eventos Socket.io)
- [x] Configurar Redis (estrategia: sesiones activas, coords GPS, rooms de viajes)

---

## FASE 1 — Usuarios y Registro 🔄
**Los tres en paralelo**

Primera fase donde los tres trabajan en simultáneo. El backend construye los endpoints, mobile y web construyen las pantallas consumiendo esos endpoints según el contrato documentado.

### Backend (Persona 1)
- [ ] `POST /api/auth/registro-cliente` — validación Zod, bcrypt, devuelve JWT
- [ ] `POST /api/auth/registro-fletero` — datos personales + vehículo, estado inicial `pendiente_verificacion`
- [ ] `POST /api/auth/login` — email/password y Google OAuth via Firebase
- [ ] Refresh tokens (access token 15 min, refresh 7 días)
- [ ] `GET` y `PUT /api/perfil` — separado por rol del JWT
- [ ] Middleware de roles (CLIENTE, FLETERO, ADMIN) aplicado a cada endpoint

### Mobile (Persona 2) — **Pendiente**
- [ ] **LoginScreen** — email/contraseña + botón Google, validación, manejo de errores
- [ ] **RegisterClienteScreen** — todos los campos requeridos, validación en cliente
- [ ] **RegisterFleteroScreen** — datos personales + datos del vehículo, selector de condiciones (frágil, refrigerado, etc.)
- [ ] **CuentaPendienteScreen** — pantalla post-registro del fletero mientras se verifica
- [ ] **AuthStack** — stack de navegación para usuarios no autenticados (wrapear RootNavigator)
- [ ] **react-native-keychain** — guardar JWT y refresh token de forma segura *(ya implementado en auth.js)*

### Web (Persona 3)
- [ ] Formulario de login con email/contraseña y botón Google
- [ ] Formulario de registro de cliente con todos los campos
- [ ] Pantalla de recupero de contraseña
- [ ] Layout base Next.js con sidebar y rutas protegidas
- [ ] JWT guardado en cookie httpOnly segura
- [ ] Página de perfil del cliente (ver y editar datos)

---

## FASE 2 — Creación y Publicación de Viajes
**Los tres en paralelo**

El cliente puede crear una solicitud de viaje especificando todos los requisitos. El backend valida, calcula el precio estimado y publica el viaje a los fleteros elegibles.

### Backend (Persona 1)
- [ ] `POST /api/viajes` — origen, destino, fecha, requisitos del vehículo, tipo de zona (CABA/Provincia/Mixto), validación Zod
- [ ] Algoritmo de estimación de costo inicial (Google Distance Matrix API, lógica por hora en CABA / por km en Provincia / mixto)
- [ ] Filtro de fleteros elegibles al crear el viaje (consulta DB por características de vehículo)
- [ ] `GET /api/viajes/disponibles` — solo viajes compatibles con el vehículo del fletero, ordenados por fecha

### Mobile (Persona 2)
- [ ] **CrearViajeScreen** — selector de zona, Google Places Autocomplete para origen/destino, fecha/hora futura, requisitos del vehículo, precio estimado en tiempo real
- [ ] **ConfirmacionViajeScreen** — resumen antes de confirmar, botón de confirmar que llama al endpoint, pantalla de éxito con ID
- [ ] **DisponiblesScreen** (fletero) — lista de viajes compatibles, cada item con origen/destino/fecha/precio/requisitos
- [ ] **DetalleViajeScreen** (fletero) — mapa con origen y destino, distancia/tiempo/precio estimado, botón "Aceptar viaje" (se activa en Fase 3)
- [ ] **HistorialClienteScreen** — lista de viajes del cliente agrupada por mes (`GET /api/viajes/mis-viajes`), badge de estado con color (buscando/asignado/en curso/finalizado/cancelado), precio estimado vs real, tap para ver detalle del viaje
- [ ] **HistorialFleteroScreen** — lista de viajes completados/cancelados del conductor agrupada por mes, monto cobrado por viaje, calificación recibida ⚠️ *endpoint pendiente en API — backend debe agregar `GET /api/viajes/mis-viajes-conductor`*

### Web (Persona 3)
- [ ] Formulario de creación de viaje con mapa interactivo de Google Maps
- [ ] Selector visual de requisitos con íconos
- [ ] Precio estimado en tiempo real
- [ ] Página de confirmación con desglose (precio base + fee)
- [ ] Dashboard actualizado con viajes en estado "Buscando fletero"

---

## FASE 3 — Matching en Tiempo Real
**WebSockets — Alta complejidad**

El núcleo del nuevo modelo de negocio. El viaje se ofrece simultáneamente a todos los fleteros elegibles via WebSocket. El primero en aceptar queda asignado.

**Dependencia:** Requiere endpoints de creación de viaje (Fase 2) funcionando.

### Backend (Persona 1)
- [ ] Configurar rooms de Socket.io por viaje (ID del viaje = room ID)
- [ ] Emitir evento `viaje:disponible` a todos los fleteros elegibles conectados
- [ ] Lógica de aceptación atómica en PostgreSQL (transacción + "primero en aceptar")
- [ ] Evento `viaje:ya_asignado` para el fletero que llega tarde
- [ ] Temporizador de cancelación automática (BullMQ job) si ningún fletero acepta
- [ ] Emitir `viaje:fletero_asignado` al cliente con datos del fletero (nombre, foto del vehículo, calificación)

### Mobile (Persona 2)
- [ ] Conexión al WebSocket al hacer login (fletero escucha `viaje:disponible`)
- [ ] Modal/pantalla emergente de nuevo viaje con countdown y botón grande "Aceptar"
- [ ] Botón de rechazar sin consecuencias
- [ ] Emitir `viaje:aceptar` y manejar respuesta (éxito → viaje asignado | `ya_asignado` → mensaje)
- [ ] Pantalla de espera para cliente con animación de búsqueda
- [ ] Transición automática al recibir `viaje:fletero_asignado`

### Web (Persona 3)
- [ ] Conexión al WebSocket del viaje y escucha de `viaje:fletero_asignado`
- [ ] Animación de búsqueda en el dashboard
- [ ] Pantalla de fletero asignado con datos (nombre, foto, patente, calificación)
- [ ] Manejo de cancelación por tiempo límite con opción de re-publicar

---

## FASE 4 — El Viaje en Vivo
**GPS, Tracking y Algoritmos**

Una vez asignado el fletero, comienza el viaje real. El GPS del fletero se activa en background, el cliente ve el pin moviéndose en tiempo real.

**Dependencia:** Requiere matching funcionando (Fase 3) y WebSockets configurados.

### Backend (Persona 1)
- [ ] Socket handler `fletero:ubicacion` — recibe coords cada 15s, guarda en Redis, reenvía vía `mapa:actualizar`
- [ ] Algoritmo de detección de desvíos con Turf.js (`nearestPointOnLine`)
- [ ] Algoritmo de paradas sospechosas en CABA (velocidad < 3 km/h por >5 min fuera de paradas)
- [ ] Acumulador de costo en tiempo real, emite `costo:actualizar` cada 60s
- [ ] `PATCH /api/viajes/:id/estado` — estados automáticos (GPS) y manuales (fletero)

### Mobile (Persona 2)
- [ ] **GPS en background** — `react-native-background-geolocation`, frecuencia 15s, funciona con pantalla apagada *(componente más crítico del mobile)*
- [ ] Emitir `fletero:ubicacion` con lat/lng/timestamp, manejar falta de conexión guardando localmente
- [ ] **ViajeActivoFleteroScreen** — mapa con ruta, lista de paradas, estado visible, botones "Terminé de cargar/descargar"
- [ ] **ViajeActivoScreen** (cliente) — pin del fletero en tiempo real, ETA actualizado, costo acumulado, alertas visibles sobre mapa

### Web (Persona 3)
- [ ] Mapa en tiempo real con Google Maps JS SDK, mover marcador suavemente con cada actualización
- [ ] Panel de viaje activo: estado, ETA, costo acumulado, lista de paradas con estado
- [ ] Banner de alertas de desvío y parada sospechosa con historial

---

## FASE 5 — Confirmación y Cierre del Viaje
**QR, Ajuste de Precio y Calificación**

### Backend (Persona 1)
- [ ] Generación de QR único por parada (librería `qrcode`, firma digital del servidor)
- [ ] `POST /api/viajes/:id/confirmar-parada` — validar QR, estado del viaje, posición GPS del fletero
- [ ] Cálculo del costo final (tiempo real CABA + km reales Provincia) y ajuste vs estimado
- [ ] `POST /api/viajes/:id/calificacion` — 1 a 5 estrellas, actualiza promedio del fletero
- [ ] Emitir `viaje:finalizado` al room con costo final y ajuste, luego limpiar Redis

### Mobile (Persona 2)
- [ ] **QREntregaScreen** — `expo-barcode-scanner`, manejo de QR inválido/fuera de rango/ya confirmado
- [ ] Pantalla de confirmación exitosa por parada, transición automática al finalizar
- [ ] **CalificacionScreen** (cliente) — pantalla obligatoria de estrellas post-viaje
- [ ] **ResumenFinalFleteroScreen** — paradas confirmadas, tiempo total, distancia, monto a cobrar

### Web (Persona 3)
- [ ] Mostrar QRs generados por parada (descargables + compartir por WhatsApp/email)
- [ ] Pantalla de cierre: costo estimado vs real, ajuste aplicado, desglose
- [ ] Generación de remito PDF automático al finalizar

---

## FASE 6 — Pagos Completos
**MercadoPago — Cobro, Fee y Transferencias**

**Dependencia:** Requiere el viaje completo funcionando (Fases 1–5). No se puede testear pagos sin un flujo de viaje real.

### Backend (Persona 1)
- [ ] Configurar MercadoPago Marketplace (credenciales producción y sandbox separados)
- [ ] Cobro al cliente antes del viaje (tokenizar método de pago, retener precio estimado + fee)
- [ ] Lógica de fee: `precio_cliente = precio_base * (1 + fee_porcentaje)`
- [ ] Ajuste del pago al finalizar (cobrar diferencia o reembolso parcial)
- [ ] Transferencia al fletero tras el ajuste final
- [ ] `POST /api/webhooks/mercadopago` — verificar firma, idempotencia, eventos: aprobado/rechazado/reembolso
- [ ] `GET /api/pagos/historial` — para clientes y fleteros

### Mobile (Persona 2)
- [ ] Pantalla para agregar método de pago (tarjeta o cuenta MP)
- [ ] Confirmación del monto antes de pagar + pantalla de pago procesado
- [ ] Historial de pagos (cliente) y historial de cobros (fletero)
- [ ] Botón para vincular cuenta de MercadoPago (fletero)

### Web (Persona 3)
- [ ] Tabla de historial de gastos con columnas: fecha, origen/destino, estimado, ajuste, final, fee
- [ ] Gestión de método de pago (agregar/cambiar/eliminar)
- [ ] Exportar reporte en PDF

---

## FASE 7 — Cancelaciones y Penalidades

### Backend (Persona 1)
- [ ] `PATCH /api/viajes/:id/cancelar` — lógica de tiempo desde la asignación, umbral de penalidad
- [ ] Penalidad para cliente (cobrar % del estimado) y para fletero (descontar del próximo cobro)
- [ ] Reembolso automático (total sin penalidad, parcial con penalidad)

### Mobile (Persona 2)
- [ ] Botón de cancelar en viaje pendiente/activo (cliente y fletero) con modal de confirmación + monto de penalidad
- [ ] Pantalla de viaje cancelado con desglose
- [ ] Al cancelar fletero → viaje se republica automáticamente

### Web (Persona 3)
- [ ] Estado "Cancelado" en el dashboard con detalle de penalidad
- [ ] Botón para crear viaje nuevo con los mismos datos
- [ ] Notificación inmediata si el fletero cancela el viaje del cliente

---

## FASE 8 — Viajes Programados

### Backend (Persona 1)
- [ ] Publicación inmediata de viajes futuros via WebSocket al crearse
- [ ] Gestión de disponibilidad del fletero por fecha y horario
- [ ] Job de recordatorio previo al viaje (BullMQ)
- [ ] Lógica de cancelación con umbrales distintos (medidos en días)

### Mobile (Persona 2)
- [ ] DateTimePicker en el formulario de creación (validar fecha futura, mínimo X horas)
- [ ] Sección de viajes futuros aceptados (fletero) con countdown
- [ ] Recibir y navegar desde notificación de recordatorio

### Web (Persona 3)
- [ ] Sección de viajes programados en el dashboard
- [ ] Vista de calendario de viajes (opcional para clientes frecuentes)

---

## FASE 9 — Notificaciones y Alertas

### Backend (Persona 1)
- [ ] `notifications.service.js` centralizado (FCM) con métodos por tipo
- [ ] Jobs asincrónicos con BullMQ (sin bloquear el request)
- [ ] Tabla `notificaciones` en DB, `GET /api/notificaciones`
- [ ] Tipos: nuevo viaje, fletero asignado, viaje próximo, desvío, parada sospechosa, entrega confirmada, viaje finalizado, pago procesado, cancelación

### Mobile (Persona 2)
- [ ] Integrar `expo-notifications` (pedir permiso, registrar token en backend al login)
- [ ] **NotificacionesScreen** — lista cronológica, íconos por tipo, navegar al recurso
- [ ] Badge de no leídas en tab + ícono de app

### Web (Persona 3)
- [ ] Campana en header con badge de no leídas y dropdown
- [ ] Página completa de historial con filtros
- [ ] Toast en tiempo real vía WebSocket

---

## FASE 10 — Pulido, Seguridad y Producción

### Backend (Persona 1)
- [ ] Auditoría OWASP: validación de inputs, rate limiting, Helmet, CORS, verificación de webhooks MP
- [ ] Testing de carga del sistema de matching (concurrencia, race conditions)
- [ ] Migración a Railway (backend), Supabase (DB), Cloudflare R2 (archivos)
- [ ] Cloudflare + dominio (DDoS, WAF, SSL, rate limiting)
- [ ] Integrar Sentry en backend, web y mobile

### Mobile (Persona 2)
- [ ] Testing en dispositivo físico real (iPhone y Android) — GPS background, QR, push notifications **no funcionan en simulador**
- [ ] Publicación App Store (cuenta Apple Developer USD 99/año, TestFlight primero)
- [ ] Publicación Google Play (cuenta USD 25 único, Internal Testing Track primero)
- [ ] Prueba piloto con 2–3 PyMEs conocidas antes del lanzamiento oficial

### Web (Persona 3)
- [ ] Optimización Core Web Vitals Next.js (lazy loading, imágenes, memoria del mapa)
- [ ] Landing page pública con SEO y CTA de registro
- [ ] Testing end-to-end: mínimo 5 viajes completos incluyendo cancelaciones, ajustes y alertas de desvío
