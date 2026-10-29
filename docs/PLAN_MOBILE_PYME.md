# Fleter Mobile — Plan de desarrollo (modelo PyME + conductores)

> Propuesta aprobada el 2026-10-19. Contrato: `API.md` del backend, branch `develop` (staging).
> Diseño: `UXUI.md` + `src/theme.js`.

## Estado (29 oct 2026)

| Fase | Estado | Dónde se ve |
|---|---|---|
| 0 — Base | ✅ con dos desvíos (ver abajo) | kit `src/components/ui/` y `components/viaje/`, `src/services/`, `useEnVivo`, `RootNavigator` |
| 1 — Entrada y alta | ✅ | `src/screens/auth/`, `src/screens/onboarding/` (commit `7df9b87`) |
| 2 — Conductor | ✅ | `ConductorStack`, `src/screens/conductor/` (commit `9d3c39b`) |
| 3 — Empresa | ✅ | `PymeStack`, `EmpresaContext`, `src/screens/empresa/` (16 pantallas) |
| 4 — Cierre | ⏳ depende del backend y de decisiones del dueño | `ISSUES.md` #1 a #4 |

**La explicación de cómo se cumple cada ítem, archivo por archivo, está en `docs/ARQUITECTURA.md` §9.**
Cada fase se diseñó primero como prototipo HTML (`prototype/fleter-mobile-fase{1,2,3}-*.html`), se aprobó y se
programó; se verificó en Expo web en claro y oscuro, y el contrato se probó contra staging con `scripts/api-tests/`.

Desvíos respecto de este plan, todos acordados o explicados:
- **Flags del marketplace:** no se agregaron `MARKETPLACE_HABILITADO` ni `CALIFICACIONES_HABILITADAS`; el código viejo no
  se monta (el router no lo alcanza) y sigue en sus carpetas hasta que el dueño decida borrarlo.
- **`PLAN_DESARROLLO.md`** no se reescribió: lo reemplazan este documento y `docs/CAMBIO_DE_ENFOQUE.md`. `CLAUDE.md` sí.
- **Fase 2, Mis viajes:** en vez de agrupar por empresa, cada card dice de qué empresa es; los vencidos están en Historial.
  ETA y desvíos no llegan al conductor porque el backend se los manda solo a la empresa (ISSUES.md #3).
- **Fase 3, pestañas:** quedaron Inicio, Viajes, Nuevo, **Alertas**, Más (elegido en la revisión del prototipo);
  Conductores entra desde Más.
- **Fase 3, rechazados:** el backend no reasigna un viaje rechazado; «Asignar a otro» crea uno nuevo con los mismos datos.
- **Fase 3, series:** sus viajes se editan, reasignan y cancelan uno por uno (así lo define el contrato); la serie
  entera solo se cancela.

## Principios
- **Dos tipos de cuenta:** `CLIENTE` (usuario de PyME, `RESPONSABLE` o `MIEMBRO`) y `CONDUCTOR`.
  Gerente, marketplace, calificaciones y QR quedan apagados detrás de flags (`MARKETPLACE_HABILITADO`,
  `CALIFICACIONES_HABILITADAS`), con el código archivado en `src/screens/_marketplace/`, sin borrar.
- **Vocabulario:** "conductor" en la UI (chofer solo donde lo impone la API). Voseo, formatos es-AR.
- **Una pantalla a la vez:** diseño → pantalla con tokens → lógica (reusando lo que ya funciona)
  → prueba contra staging → `PROGRESO.md` → commit. Cada pantalla se muestra antes de seguir.
- **Reglas fijas:** el mobile no calcula nada; refetch por REST al reconectar el socket y al volver a
  primer plano; radio de 50 m nunca hardcodeado; regla de los 9 datos en toda card de viaje.

## Fase 0 — Base (sin pantallas nuevas)
1. Mergear `claude/freight-marketplace-pivot-l08445` (docs, prototipo, pruebas de API).
2. Reescribir `CLAUDE.md` y `PLAN_DESARROLLO.md` con el modelo nuevo y las decisiones
   (SaaS + comisión en etapa 2, dashboard solo web, "conductor").
3. Kit de componentes compartidos: `Pantalla`, `Boton`, `Campo`, `CodigoInvitacion` (XXXXX-XXXXX),
   `ChipEstado` (los 9 estados nuevos), `CardViaje` (9 datos), `FilaParada`, `Vacio`, `ErrorBanner`.
4. Servicios por dominio: `organizaciones`, `invitaciones`, `viajesPyme`, `viajesConductor`,
   `lugares`, `series`, `vehiculos`. Hook `useEventosEnVivo` (socket + refetch al reconectar).
5. Navegación nueva: `AuthStack` → (onboarding si hace falta) → `PymeStack` | `ConductorStack`.

## Fase 1 — Auth y onboarding
| # | Pantalla | Reusa |
|---|---|---|
| 1.1 | Splash / carga de sesión | AuthContext |
| 1.2 | **Login** (email + Google, recuperar contraseña) | LoginScreen |
| 1.3 | Elegir tipo de cuenta (PyME / Conductor) | — |
| 1.4 | Registro PyME (usuario `CLIENTE`) | RegisterClienteScreen |
| 1.5 | Registro conductor (+ primer vehículo y condiciones) | RegisterFleteroScreen, PerfilFletero |
| 1.6 | Onboarding PyME huérfana: **Crear PyME** (CUIT) o **Unirme con código** | — |
| 1.7 | Onboarding conductor: **Canjear código** de una PyME (opcional, se puede saltar) | afiliación |

## Fase 2 — Conductor (bottom tabs: Viajes, Historial, Perfil)
| # | Pantalla | Endpoints principales |
|---|---|---|
| 2.1 | **Mis viajes**: hoy / próximos, agrupados por PyME, avisos de `VENCIDO` | `GET /choferes/viajes`, `viaje:asignado`, `serie:asignada` |
| 2.2 | Detalle + **Confirmar** (elegir vehículo) / **Rechazar** | `/confirmar`, `/rechazar` |
| 2.3 | **Viaje activo**: iniciar en el origen, parada por parada (llegué → Salir), GPS en 2º plano, ETA, desvíos | `/iniciar`, `/salir`, `/confirmar-parada`, `conductor:ubicacion` |
| 2.4 | Viaje finalizado: resumen estimado vs. real + remito PDF | `viaje:finalizado` |
| 2.5 | Historial | `GET /choferes/viajes?…` |
| 2.6 | Perfil: datos, vehículos, **Mis PyMEs** (canjear / desvincularme con confirmación), apariencia | `/choferes/mis-organizaciones`, `/conductores/mis-vehiculos` |

## Fase 3 — PyME (bottom tabs: Inicio, Viajes, Nuevo, Conductores, Más → quedó Inicio, Viajes, Nuevo, Alertas, Más)
| # | Pantalla | Endpoints principales |
|---|---|---|
| 3.1 | **Inicio**: en curso ahora, próximos de hoy, sin confirmar / por vencer, alertas | `GET /organizaciones/:id/viajes`, sockets |
| 3.2 | **Nuevo viaje**: lugares guardados, hasta 10 paradas, fecha/hora, condiciones, conductor + precio estimado; opción "repetir" → serie | `POST …/viajes`, `POST …/series` |
| 3.3 | **Seguimiento en vivo**: mapa, ETA, timeline por parada, estimado vs. real, remito | `GET …/viajes/:id`, `mapa:actualizar`… |
| 3.4 | Editar / reasignar / cancelar viaje (y alcance en series) | `PUT`, `/reasignar`, `/cancelar` |
| 3.5 | **Viajes**: lista con filtros (activos, programados, finalizados, cancelados/vencidos) | `GET …/viajes?grupo=` |
| 3.6 | **Conductores**: lista, invitar (código una sola vez + compartir), desvincular con vista previa | `/invitaciones`, `/choferes` |
| 3.7 | Lugares guardados (CRUD) | `/lugares` |
| 3.8 | Series (lista, detalle, cancelar) | `/series` |
| 3.9 | Equipo: miembros, roles, invitar miembro (solo responsable), salir | `/miembros`, `/invitaciones` |
| 3.10 | Perfil + datos de la PyME + apariencia | `PUT /organizaciones/:id`, `PUT /auth/perfil` |

## Fase 4 — Cierre
- Push notifications (cuando el backend integre FCM; ver `ISSUES.md` #2).
- Remito con foto (cuando el backend lo defina).
- Desvincular con vista previa / bloqueo en curso (según cómo se resuelva `ISSUES.md` #1).
- Pruebas en dispositivo físico (GPS en 2º plano), accesibilidad, limpieza del código del marketplace.

## Fuera de alcance del mobile
Dashboard de métricas y facturación (web), panel admin, marketplace (etapa 2).
