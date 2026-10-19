# Fleter — Cambio de enfoque: de marketplace de fletes a herramienta de gestión para PyMEs

> Documento de constancia. Registra qué cambió en la aplicación, por qué, qué decisiones se tomaron
> y en qué estado está cada parte.
> Fecha: 19 de octubre de 2026 · Branch: `claude/freight-marketplace-pivot-l08445`.

---

## 1. Resumen

Fleter nació como un **marketplace de fletes**, un "Uber para camiones": una PyME publicaba un viaje,
cualquier fletero cercano con un vehículo compatible lo aceptaba y la app cobraba un porcentaje.

El producto cambió de enfoque. **Fleter es ahora una herramienta B2B de gestión de viajes para PyMEs
que trabajan con sus propios choferes de confianza.** La PyME carga el viaje y se lo asigna a un chofer
que ya conoce. El chofer lo confirma con su vehículo, lo hace con la app (GPS, parada por parada) y al
final queda un remito. La app cobra una **suscripción mensual fija** a la PyME y es **gratis para el
chofer**.

El marketplace **no se descarta**: queda como **segunda fase**, con otra forma (ver §6). Su código se
conserva en el backend, apagado con un flag.

| | Antes (marketplace) | Ahora (gestión para PyMEs) |
|---|---|---|
| Quién hace el viaje | Cualquier fletero disponible que lo acepte | Un chofer de confianza que elige la PyME |
| Cómo se asigna | Publicación abierta + aceptación (el primero gana) | Asignación directa; el chofer confirma o rechaza |
| Relación PyME–chofer | Ocasional, entre desconocidos | Estable: el chofer se vincula a la PyME con un código |
| Usuarios del lado empresa | Una cuenta "cliente" | Una **organización** (PyME) con varios miembros y roles |
| Ingreso de la app | Porcentaje (fee) de cada viaje | Suscripción mensual fija por PyME |
| Pago al chofer | Por la app | Fuera de la app (la app solo registra el precio) |
| Valor principal | Encontrar quién lleve la carga | Saber dónde está cada viaje y tener constancia de cada entrega |

---

## 2. Por qué cambiamos

1. **El problema real de la PyME chica no es encontrar un fletero, es coordinar a los que ya tiene.**
   Las PyMEs objetivo (1 a 5 choferes, hasta ~100 viajes por mes) ya trabajan con choferes de
   confianza y coordinan todo por WhatsApp y planillas: no saben si el camión salió, si llegó ni
   cuándo, y el remito tarda días en volver.
2. **Un marketplace necesita masa crítica de los dos lados desde el día uno.** Sin choferes no hay
   PyMEs y sin PyMEs no hay choferes. Una herramienta que sirve con *un* cliente y *sus* choferes se
   puede vender desde el primer día.
3. **Confianza.** Entregar mercadería a un desconocido es la principal barrera de los marketplaces de
   fletes. Con choferes propios esa barrera no existe.
4. **Ingreso predecible.** Una suscripción fija es más simple de vender y de proyectar que un
   porcentaje sobre viajes que además obliga a mover dinero por la app.
5. **La herramienta construye el marketplace.** Cada PyME que se suma trae a sus choferes, con su
   historial verificado en la app. Eso es la base de la fase 2 (§6).

---

## 3. Cómo funciona ahora

### 3.1 Identidad: PyMEs, miembros y choferes

- **PyME (organización):** la crea un usuario, que queda como `RESPONSABLE`. Puede sumar más usuarios
  como `MIEMBRO` con un código de invitación. Siempre hay al menos un responsable.
- **Chofer:** cuenta propia y gratuita. Se vincula a una o varias PyMEs canjeando un código de
  invitación (formato `XXXXX-XXXXX`, un solo uso, vence a las 72 h). Una PyME nunca ve con qué otras
  trabaja su chofer.
- Los roles del marketplace (gerente de empresa de logística, afiliaciones, reservas) quedan dormidos.

### 3.2 Ciclo del viaje

```
ASIGNADO ──confirmar──▶ CONFIRMADO ──iniciar en el origen──▶ CARGANDO ──salir──▶ EN_RUTA
                                                                                   │
              FINALIZADO ◀──salir de la última── DESCARGANDO ◀──confirmar parada───┘
                                                     (y "salir" vuelve a EN_RUTA hasta la última)
Finales: RECHAZADO · VENCIDO · CANCELADO · FINALIZADO
```

1. **La PyME crea el viaje** con un chofer asignado (vinculado y con un vehículo que cumpla las
   condiciones). Cualquier miembro puede crear, editar, reasignar y cancelar.
2. **El chofer lo confirma** eligiendo uno de sus vehículos, o lo **rechaza**.
3. **El chofer lo inicia estando en el origen** (a 50 m como máximo) y dentro de una ventana: desde
   1 h antes hasta 1,5 h después de la hora programada. Si no se confirma o no se inicia a tiempo,
   pasa solo a `VENCIDO`.
4. **Parada por parada:** "Salir" de una parada → manejar → confirmar la llegada a la siguiente (por
   proximidad, en orden) → "Salir"… Salir de la última finaliza el viaje y genera el **remito PDF** a
   nombre de la PyME.
5. Se registran **tiempos estimados y reales** de manejo y de peón (carga y descarga) por viaje y por
   parada, con tráfico real de Google (Routes API).
6. **Desvincular a un chofer** cancela todos sus viajes con esa PyME, incluso uno en curso.

### 3.3 Herramientas de la PyME

- **Seguimiento en vivo:** mapa con la posición del chofer, ETA, alertas de desvío y de parada
  sospechosa (WebSocket).
- **Lugares guardados:** direcciones frecuentes con nombre ("Depósito Pilar"). El chofer nunca ve el
  nombre, solo la dirección.
- **Viajes recurrentes (series):** diario, ciertos días de la semana, semanal o mensual. Generan de una
  vez todos los viajes de los próximos 30 días. Cada viaje se gestiona por separado.

### 3.4 Precio

Cada viaje tiene **un solo precio**, informativo, para el registro de la PyME. Lo calcula el backend
(tarifa por tiempo en CABA y por distancia en Provincia, hora pico) y se confirma con el GPS al cerrar.
La app **no mueve dinero**: ni cobra el viaje ni le paga al chofer.

---

## 4. Decisiones de producto

| # | Decisión |
|---|---|
| 1 | El sistema es cerrado: cada PyME trabaja con sus propios choferes. El marketplace se apaga (flag `MARKETPLACE_HABILITADO=false`) pero su código se conserva. |
| 2 | El chofer **tiene que usar la app**: el GPS arranca al iniciar el viaje y sigue en segundo plano. |
| 3 | Solo el chofer inicia y avanza el viaje, y se valida por ubicación. La PyME no puede marcarlo como hecho. |
| 4 | Un solo precio por viaje, informativo. Sin fee y sin pagos por la app. |
| 5 | Ingreso: suscripción mensual fija por PyME (rango pensado: USD 20–40). Gratis para el chofer. |
| 6 | El chofer puede estar vinculado a varias PyMEs; cada PyME ve solo sus viajes. |
| 7 | Alta por código de invitación de un solo uso que vence a las 72 h. |
| 8 | Las calificaciones quedan apagadas (flag `CALIFICACIONES_HABILITADAS=false`); los viajes de PyME no se califican. |
| 9 | El QR por parada se reemplazó por confirmación por proximidad GPS (50 m). |
| 10 | Los datos y viajes del marketplace se archivan, no se borran. |

---

## 5. Estado de la implementación

### Backend (repo `nombre-proyecto-back`, branch `develop` → staging)

| Paso | Qué incluye | Estado en staging |
|---|---|---|
| 1 — Identidad | PyMEs, miembros, roles, invitaciones, vínculo de choferes | ✅ Probado: 109/109 |
| 2 — Viaje interno | Asignar, confirmar, rechazar, iniciar en el origen, cancelar, desvincular, `VENCIDO` | ✅ Probado: 124/124 |
| 3 — Tiempos y paradas | Routes API con tráfico, manejo + peón, ciclo parada por parada con "Salir" | ✅ Probado: 157/157 |
| 4 — Lugares y series | Lugares guardados, viajes recurrentes, máximo 10 paradas | ✅ Probado: 113/113 |

Las pruebas de contrato están en `scripts/api-tests/` y se corren contra staging. El contrato vigente
es `API.md` del branch `develop` del backend.

**Pendiente o a confirmar con el backend:** el error 503 cuando Google no responde (no se pudo simular),
el estado `SUSPENDIDA` de una PyME, la suscripción y su cobro, notificaciones push, y unos cortes
breves de WebSocket que aparecieron en las pruebas (pueden ser de la red del entorno de pruebas).

### Mobile (este repo)

- La app todavía tiene las pantallas del **marketplace** (cliente y fletero). Hay que rehacerlas para
  el modelo nuevo: PyME (crear y seguir viajes, choferes, lugares, series) y chofer (confirmar,
  iniciar, parada por parada, GPS en segundo plano).
- Referencias para construirlas: el prototipo `prototype/fleter-empresa-prototype.html`, el plan
  `docs/PIVOT_EMPRESA_BACKEND.md` y el sistema de diseño de `UXUI.md`.
- Al reconectar el WebSocket, la app tiene que volver a pedir el estado por REST: los eventos que se
  emiten durante un corte no se reenvían.

### Plan original vs. lo que se implementó

`docs/PIVOT_EMPRESA_BACKEND.md` fue la propuesta inicial. El backend la implementó con algunos
cambios, y **lo que vale es `API.md` de develop**:

| Plan original | Implementado |
|---|---|
| Desaparece el rol CLIENTE; la empresa es el GERENTE | Se mantiene `CLIENTE` como "usuario de PyME" dentro de una organización |
| Estados visibles `PROGRAMADO → EN_CURSO → FINALIZADO` | `ASIGNADO → CONFIRMADO → CARGANDO / EN_RUTA / DESCARGANDO → FINALIZADO`, más `RECHAZADO` y `VENCIDO` |
| Chofer activo en una sola empresa a la vez | Puede estar vinculado a varias PyMEs |
| Recurrencia semanal o mensual | Diaria, días de la semana, semanal o mensual, 30 días por vez |
| Panel web para la empresa | Pendiente de definir; la API sirve a web y mobile por igual |

---

## 6. Hacia dónde va: el marketplace como fase 2

El marketplace vuelve, pero distinto al original. La idea:

- **Horas ociosas.** Los choferes de una PyME tienen horas libres entre sus viajes. Fleter ofrece esa
  disponibilidad a otras PyMEs de la red.
- **Choferes de confianza, no desconocidos.** Cada chofer del marketplace ya trabaja todos los días
  para otra PyME y tiene un historial verificado en la app: viajes completados, GPS, paradas
  confirmadas por ubicación y remitos. Esa es la diferencia con un grupo de WhatsApp o un clasificado.
- **El chofer gana más** con horas que hoy no usa, y **la PyME consigue capacidad extra** sin
  contratar. Fleter cobra un porcentaje de cada viaje del marketplace.
- **La herramienta arma el marketplace:** cada PyME que se suma trae a sus choferes a la red.

---

## 7. Documentos relacionados

| Documento | Qué tiene |
|---|---|
| `docs/PIVOT_EMPRESA_BACKEND.md` | Plan técnico inicial del pivot para el backend (modelo de datos, contrato, hitos) |
| `prototype/fleter-empresa-prototype.html` | Prototipo interactivo del panel de la PyME |
| `scripts/api-tests/` | Pruebas de contrato de los pasos 1 a 4 contra staging |
| `PROGRESO.md` | Historial de commits y estado del proyecto |
| `API.md` en `nombre-proyecto-back` (branch `develop`) | Contrato vigente de la API |
