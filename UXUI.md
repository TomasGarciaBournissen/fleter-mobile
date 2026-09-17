# UX/UI Reference — Fleter (Sistema de diseño v2 · adaptado a mobile)

Fuente: "Fleter — Sistema de diseño v2" (septiembre 2026). El documento original es para la web
(cliente, gerente, admin); acá está adaptado a la app React Native. Todo lo visual sale de
`src/theme.js` — **ningún color hexadecimal fuera de tokens**.

## Marca
- Nombre: **Fleter** (reemplaza a "Movix" en toda la app)
- Eslogan: **«Tu logística, de punta a punta.»** — solo en auth, splash e ícono. Nunca dentro del producto (tabs, headers, notificaciones).
- Isotipo «Carga»: seis cajas estibadas forman la F; la caja oscura (la carga que se sigue) va en la punta del brazo largo, arriba a la derecha. Nunca rotado, sin sombra, sin degradado.
- Personalidad: **Segura — Simple — Control**.

## Las 3 reglas del proyecto
1. **Vocabulario**: no se dice «fletes». Va «logística» o «viaje», con voseo rioplatense:
   «Pedir viaje», «Completá los datos», «Elegí una fecha». Nada de «Seleccione», «OK»,
   «Continuar» a secas, ni jerga («trip», «status», «ETA», «tracking» como texto visible).
   Estados cortos y en gerundio: Buscando, Cargando, En ruta, Entregado.
2. **Información del viaje — 9 datos, siempre, en cualquier estado**: fecha y hora, origen
   (dirección y localidad), cantidad de paradas («Sin paradas», «1 parada»…), destino,
   condiciones de carga (o «Sin condiciones»), distancia en km, tiempo estimado, precio
   estimado (o final), estado. Nada se corta con «…»: la card crece. Lo que falta dice
   «A confirmar». El id del viaje (VJ-2419) acompaña a la fecha, en mono, más chico.
3. **Gráficos**: ninguno decorativo. Grilla horizontal visible, eje Y con valor y unidad en cada
   línea, eje X legible, valor exacto al tocar. Pesos y viajes nunca comparten eje.

## Temas
Los dos roles tienen tema claro y oscuro. Se cambia desde **Perfil → Apariencia** con tres
opciones: Claro / Oscuro / Sistema (sigue el modo del teléfono). Defaults: cliente arranca en
claro, conductor en oscuro. El tema solo redefine tokens semánticos — ningún componente tiene
estilos propios por tema. El naranja `accent #E85D2A` es idéntico en ambos.

## Color — tema claro
El naranja `#E85D2A` no se toca.

| Token | Valor | Uso |
|---|---|---|
| `accent` | `#E85D2A` | botones primarios, activos, marcador origen |
| `accentHover` | `#F06A38` | (web hover; en RN no se usa) |
| `accentPress` | `#D2521F` | pressed state |
| `accentInk` | `#A63B14` | naranja como TEXTO sobre fondo claro (6.4:1) |
| `accentSoft` | `#FBE4D6` | fondo badge "en curso" |
| `accentSofter` | `#FFF1E7` | fondos suaves |
| `bg` | `#FAF7F1` | fondo de toda pantalla |
| `surface` | `#FFFFFF` | cards, tab bar |
| `surface2` | `#F2EDE2` | inputs, cards anidadas |
| `surface3` | `#ECE9E1` | hover/seleccionado |
| `line` | `#E8E4DA` | bordes por defecto |
| `lineStrong` | `#D9D3C5` | bordes marcados, grilla de gráficos |
| `ink` | `#1B1A17` | títulos, valores, precios |
| `ink2` | `#3F3B34` | texto secundario |
| `ink3` | `#665F50` | metadata, placeholders (AA en 11–12px) |
| `ink4` | `#B8B2A2` | SOLO deshabilitado, nunca texto informativo |
| `onAccent` | `#1B1A17` | texto chico sobre naranja (¡tinta, no blanco!) |
| `onAccentLarge` | `#FFFFFF` | solo texto grande sobre naranja: ≥19px bold o ≥24px |
| `onInk` | `#FFFFFF` | texto sobre fondos tinta |

**Regla de contraste sobre naranja**: blanco sobre `#E85D2A` da 3.5:1 → NO pasa AA en texto
chico. Botones y badges naranjas llevan texto en tinta `#1B1A17`. El blanco queda solo para
texto grande (≥19px bold / ≥24px regular).

## Color — tema oscuro
Paleta oscura completa (default del lado conductor, disponible también para el cliente):

| Token | Valor |
|---|---|
| `bg` | `#141310` |
| `surface` | `#1C1A16` |
| `surface2` | `#23201B` |
| `surface3` | `#2B2822` |
| `line` | `#2E2A24` |
| `lineStrong` | `#3B362E` |
| `ink` | `#F4F0E7` |
| `ink2` | `#CBC5B8` |
| `ink3` | `#9E978A` |
| `ink4` | `#6B655A` (semántica invertida) |
| `accentInk` | `#F0865A` |
| `accentSoft` | `#3B2116` |
| `accentSofter` | `#2A1B13` |
| `onInk` | `#141310` |

Estados en oscuro: `ok #4DB36E / okInk #7BD397 / okSoft #16301F` ·
`warn #D9A23A / warnInk #E9BC5C / warnSoft #33260A` ·
`err #D95454 / errInk #F09090 / errSoft #3A1717` ·
`info #5C93D6 / infoInk #8DB8EC / infoSoft #14243A`.
El naranja `accent #E85D2A` no cambia.

## Estados del viaje — 5 familias, 9 estados
Fuente única en el código (crear `src/lib/estados.js`). Tres valores por familia:
**base** (íconos, puntos), **ink** (texto chico sobre soft, ≥4.5:1), **soft** (fondo del badge).

| Familia | base | ink | soft | Estados |
|---|---|---|---|---|
| Buscando (ámbar) | `#C98A12` | `#8A5E0B` | `#FBEFCE` | `BUSCANDO_CONDUCTOR` |
| Próximo (azul) | `#2E6FB7` | `#22578F` | `#D8E4F2` | `RESERVADO_POR_EMPRESA`, `CONDUCTOR_ASIGNADO` |
| En curso (naranja) | `#E85D2A` | `#A63B14` | `#FBE4D6` | `EN_CAMINO_A_ORIGEN`, `CARGANDO`, `EN_RUTA`, `DESCARGANDO` |
| Entregado (verde) | `#2F8F4E` | `#1F6B39` | `#DCEFD8` | `FINALIZADO` |
| Cancelado (rojo) | `#B83232` | `#9C2626` | `#F5D9D4` | `CANCELADO` |

Labels: Buscando · Reservado · Asignado · En camino · Cargando · En ruta · Descargando ·
Entregado · Cancelado.
- **Buscando** late (animación de pulso): es el único estado donde el cliente espera algo de la
  plataforma. Si dura más de 20 min, mostrar nota con «Avisar a Fleter».
- **Entregado** recién con foto del remito conformado; sin foto sigue en Descargando.
- Banner/card de viaje activo solo aparece en los 4 estados "en curso".

Marcadores de recorrido: origen = punto `accent` · paradas = punto `ink3` · destino = cuadrado `ink`.

## Tipografía — 4 familias, un rol cada una (nunca mezcladas en un mismo elemento)
- **Archivo Black** (`display`): precios, KPI, h1/h2, títulos de card. Peso único. Tracking -0.02em en grandes.
- **Manrope** (`ui`): toda la UI. 400 body, 500 nav, 600 labels y botones, 700 badges. Mínimo 11px.
- **Josefin Sans** (`accentFont`): SOLO eyebrows y eslogan — 600, mayúsculas, tracking 0.10em.
- **JetBrains Mono** (`mono`): IDs de viaje, patentes, horas, valores de ejes. `.patente` con tracking 0.08em.

Escala:
| Token | px | Uso |
|---|---|---|
| `displayXl` | 44 | precio del viaje |
| `displayLg` | 32 | KPI |
| `displayMd` | 28 | h2 / título de pantalla |
| `displaySm` | 17 | empty states |
| `displayXs` | 14 | título de card |
| `lg` | 16 | lead |
| `md` | 14 | body |
| `sm` | 13 | nav |
| `xs` | 12 | metadata (en `ink3`) |
| `label` | 11.5 | labels 600 uppercase tracking 0.06em |
| `2xs` | 11 | badges 700 |

Formatos es-AR: `$12.500` · `16 sep` · `mar 16 sep 2027` · `14:30` (24h) · semana desde el
lunes · patente `AE 421 KL` · viaje `VJ-2419`.

## Espaciado, radios, sombras, controles
- Base 4: `sp1 4 · sp2 8 · sp3 12 · sp4 16 · sp5 20 · sp6 24 · sp7 28 · sp8 32 · sp10 40 · sp12 48`
- Padding de card: 18 (`cardPad`) · formularios 22/26 · contenido de pantalla 16 (mobile)
- Radios: `sm 6` (inputs, chips, badges) · `md 10` (cards, botones lg) · `lg 14` (sheets, popovers) · `pill 999`
- Sombras: `shadowCard` (apenas: 0 1px 0 + 0 1px 2px, rgba(27,26,23,.04)) y `shadowPop`
  (hojas/menús). Las cards por defecto van **sin sombra**, con borde `line`; sombra solo si flota.
- Alturas de control: `44` (auth, formularios largos, todo lo táctil — mínimo tap 44) ·
  `36` default · `28` tabs y chips.
- Tab bar: 64px.
- Motion: `fast 120ms · base 180ms · slow 260ms`, easing `cubic-bezier(.2,.7,.2,1)`.

## Componentes (equivalentes RN de las clases BEM)
- **Botón**: primario = fondo `accent`, texto `onAccent` (tinta) 600; pressed `accentPress`.
  Variantes: ink (fondo `ink`, texto `onInk`), ghost (transparente, texto `ink`, pressed `surface3`),
  danger (borde/texto `err`, pressed fondo `errSoft`). **Un primario por vista.**
- **Badge de estado**: fondo `soft`, texto `ink` de su familia, 11px 700. Buscando y los estados
  "en curso" con punto que late.
- **Field**: label 11.5px 600 uppercase `ink3`; input fondo `surface`, borde `line`, radio 6,
  alto 44; foco = borde `accent` + halo suave; hint en `ink3` debajo; error en `errInk`.
- **Card**: fondo `surface`, borde `line`, radio 10, padding 18, sin sombra. `--ink` (card
  oscura para el número que importa): una por pantalla, máximo.
- **Fila de viaje**: los 9 datos etiquetados en dos columnas (patrón mobile del DS), recorrido
  parada por parada con marcadores, sin puntos suspensivos.
- **Detalle de viaje**: pantalla completa (equivalente mobile del drawer): precio grande con
  nota, vehículo y conductor, recorrido completo, mapa, condiciones con descripción, tabla
  «Estimado y real» (faltante = «A confirmar»; cancelado = «No aplica»), línea de tiempo con
  horas. Entregado → botón «Ver remito conformado». Cancelado → nota roja con motivo.
- **Notas y toasts**: nota inline (fondo soft de su familia), toast flotante oscuro. Sin modales
  de confirmación para lo que se puede deshacer.
- **Empty states**: título display 17 + verbo + botón («Todavía no hay viajes este mes. Pedí el
  primero…»).
- **Option cards**: para elegir tipo de vehículo o rol (Utilitario hasta 1.000 kg · Camión chico
  hasta 3.500 kg · Camión grande hasta 12.000 kg).
- **Selector de fecha**: nada de pickers nativos del navegador; en RN usar hoja inferior con
  calendario propio: días de 44px, hora en campo aparte con franjas de 15 min, anticipación
  mínima 1h (0 en staging), semana desde el lunes.
- **Zonas**: tag CABA (info) · Provincia (`#EEEAE0` + `ink2`) · Mixto (warn).

## Navegación
- Cliente (tabs): Inicio · Pedir · Historial · Perfil — «Pedir» destacado en naranja.
- Fletero (tabs): Disponibles · Activo · Historial · Perfil.
- Ítem activo: ícono `accent` + label `ink` 700. Ambos stacks respetan el tema elegido.

## Assets
Los SVGs del isotipo (claro, oscuro, mono, ícono de app) vienen del documento v2 →
copiarlos a `assets/logo/` cuando se implemente. Ícono de app: contenedor naranja radio
grande, cajas blancas, caja de seguimiento oscura.

## Migración desde v1 (lo que muere)
- Paleta crema `#FFF8F2` / marrón `#1A1207` / naranja `#F4711A` → tokens nuevos de arriba.
- Texto blanco sobre naranja en botones → texto en tinta.
- Nombre «Movix» → «Fleter».
- Sombras genéricas en todas las cards → borde `line` sin sombra.
- Truncar direcciones con `numberOfLines={1}` → la card crece, nunca se corta.
