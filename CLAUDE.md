# Movix � Contexto para Claude Code

## Qu� es este proyecto
App mobile React Native + Expo para iOS y Android. Marketplace de fletes para PyMEs argentinas (CABA + Gran Buenos Aires). Similar a Uber pero para camiones y fleteros.

## Stack
- React Native + Expo
- React Navigation (dos stacks: cliente y fletero)
- Socket.io client (WebSockets para matching y GPS en tiempo real)
- Axios (REST API)
- react-native-keychain (tokens JWT seguros)
- react-native-background-geolocation (GPS en background � componente m�s cr�tico)
- expo-barcode-scanner (QR por parada)
- expo-notifications + Firebase Cloud Messaging (push notifications)
- MercadoPago SDK (pagos)

## Estructura
src/
  navigation/
    RootNavigator.js   � detecta rol del JWT y redirige al stack correcto
    ClienteStack.js    � stack del cliente
    FleteroStack.js    � stack del fletero
  screens/
    cliente/           � pantallas del lado cliente
    fletero/           � pantallas del lado fletero
  services/
    api.js             � axios con interceptor JWT
    socket.js          � socket.io client
  hooks/
    useAuth.js         � manejo de sesi�n con Keychain
  theme.js             � sistema de dise�o completo

## Sistema de diseño (RESPETAR SIEMPRE)
**Decisiones del dueño del producto (no negociables):**
- Se usa **solo el sistema Fleter** de abajo. **Nunca** el estilo de la skill `mobile-app-ui-design` (sombras suaves, glow, radios grandes, emojis, una sola tipografía): se comparó y quedó descartado. La skill sirve, como mucho, para revisar UX (zona del pulgar, estados vacíos/error), nunca para el estilo visual.
- **Toda pantalla tiene modo claro y modo oscuro.** Ningún color fijo: todo sale de los tokens de `src/theme.js` vía `useTheme()` / `useThemedStyles()`. Antes de dar una pantalla por terminada, verla en los dos modos.
- En el texto visible se dice **«empresa»**, no «PyME» (PyME queda como término interno y de la API). Para el que maneja se dice **«conductor»** (chofer solo donde lo impone la API).
- **El conductor nunca ve el precio del viaje** (el pago es entre la empresa y el conductor, por fuera de la app). La regla de los 9 datos, del lado del conductor, va sin precio.
- Las notas informativas van en **gris** (`<Nota>` sin tipo = neutra), nunca en azul. El color se reserva para aviso (ámbar), error (rojo) y éxito (verde).
- Componentes base en `src/components/ui/` (Pantalla, Boton, Campo, CampoCodigo, Opcion, Chip, Nota, Pasos, HojaCalendario, IsotipoAnimado…): usarlos antes de crear estilos nuevos.

Sistema v2 "Fleter" — la referencia completa vive en `UXUI.md` (leerla antes de tocar UI).
Todo color sale de tokens en `src/theme.js`; ningún hexadecimal suelto en pantallas.
Resumen mínimo:
- Marca: **Fleter** (ya no "Movix"). Eslogan solo en auth/splash.
- Naranja primario: #E85D2A (pressed #D2521F). **Texto chico sobre naranja va en tinta #1B1A17, nunca blanco.** Naranja como texto sobre claro: #A63B14.
- Temas: claro y oscuro para AMBOS roles, conmutable desde Perfil → Apariencia (Claro/Oscuro/Sistema). Defaults: cliente claro, conductor oscuro.
- Tema claro: fondo #FAF7F1, cards #FFFFFF con borde #E8E4DA sin sombra, tinta #1B1A17, metadata #665F50.
- Tema oscuro: fondo #141310, superficie #1C1A16, borde #2E2A24, tinta #F4F0E7, metadata #9E978A.
- Estados del viaje: 5 familias (ámbar/azul/naranja/verde/rojo) × 3 valores (base/ink/soft) — tabla en UXUI.md.
- Tipografías: Archivo Black (precios/títulos), Manrope (UI), Josefin Sans (solo eyebrows/eslogan), JetBrains Mono (IDs, patentes, horas).
- Vocabulario: no se dice "fletes"; voseo rioplatense; formatos es-AR ($12.500, 14:30, AE 421 KL, VJ-2419).
- Regla de los 9 datos: toda card/fila de viaje muestra fecha y hora, origen, paradas, destino, condiciones, distancia, tiempo, precio y estado; nada se trunca, lo que falta dice "A confirmar".

## Navegaci�n cliente (Bottom Tabs)
- Inicio, Nuevo, Historial, Perfil

## Navegaci�n fletero (Bottom Tabs)
- Disponibles, Activo, Historial

## Pantallas a construir � Cliente
1. Home: saludo, stats (activos/gasto/puntaje), viaje activo card, �ltimos viajes
2. Crear viaje: origen/destino con Places Autocomplete, fecha/hora, paradas, requisitos veh�culo, precio estimado en tiempo real
3. Tracking: mapa con pin fletero en tiempo real, datos fletero, timeline de estados, alertas de desv�o
4. Historial: lista agrupada por mes, estados con colores, montos
5. Perfil: datos personales, m�todo de pago, direcci�n frecuente, notificaciones toggles

## Pantallas a construir � Fletero
1. Disponibles: lista de viajes compatibles con su veh�culo, precio/distancia/requisitos
2. Oferta: detalle viaje + countdown + Aceptar/Rechazar
3. Viaje activo: mapa + pr�xima parada + timeline + bot�n confirmar entrega
4. QR entrega: esc�ner + datos destinatario
5. Cobro/resumen: pago acreditado + desglose + calificaci�n recibida

## Reglas importantes
- El mobile NUNCA calcula nada � solo manda datos al backend y muestra resultados
- Todos los algoritmos (costo, desv�os, matching) viven en el backend
- JWT guardado SIEMPRE con react-native-keychain, NUNCA AsyncStorage
- GPS background requiere testing en dispositivo f�sico real (no simulador)
- El backend todav�a no est� listo � construir con mock data por ahora
- Cuando llegue el contrato de API, reemplazar mock data por llamadas reales

## Estado actual
- Scaffold completo creado
- Navegaci�n base armada (RootNavigator, ClienteStack, FleteroStack con placeholders)
- Sistema de dise�o en src/theme.js
- Servicios base en src/services/ (api.js, socket.js)
- Hook de autenticaci�n en src/hooks/useAuth.js
- Pr�ximo paso: construir las pantallas con mock data respetando el dise�o UX/UI

## Dos roles con experiencias completamente distintas
- CLIENTE: empresa PyME que pide el flete, ve el mapa, recibe alertas
- FLETERO: conductor que acepta viajes, activa GPS, escanea QR

## Registro de progreso — PROGRESO.md
El archivo `PROGRESO.md` en la raíz del proyecto documenta el estado actual de cada pantalla, los commits históricos, los eventos WebSocket implementados, los problemas conocidos y los próximos pasos por fase.

**OBLIGATORIO — actualizar PROGRESO.md antes de dar una tarea por terminada.** No es opcional. Cada vez que se completa una tarea, se agrega una pantalla, se resuelve un bug o se hace un commit significativo, PROGRESO.md debe reflejar el nuevo estado. Específicamente:
- Cambiar el estado de una pantalla (🔧 → ✅, o agregar ❌)
- Agregar la fila del commit en la tabla de historial (hash, fecha, descripción)
- Actualizar "Última actualización" y "Commits totales" en el encabezado
- Mover items de "Próximos pasos" a completados si corresponde
- Registrar nuevos problemas conocidos si aparecen

**El commit de PROGRESO.md va siempre incluido junto con los cambios de código, o inmediatamente después.**

## Documentación del código — docs/ARQUITECTURA.md
`docs/ARQUITECTURA.md` es el documento vivo del código: qué hace cada archivo relevante, cómo se conectan, los flujos de punta a punta, los endpoints y eventos que usa la app y las reglas para escribir código nuevo.

**OBLIGATORIO — actualizarlo en el mismo commit que el cambio de código** cada vez que se:
- agrega, borra, mueve o renombra un archivo de `src/` (o cambia lo que hace)
- agrega o cambia un endpoint, un evento de WebSocket o un servicio
- agrega una pantalla, un stack o cambia un flujo de navegación
- agrega un componente al kit, un hook o una utilidad
- borra código heredado del marketplace

Actualizar también «Última actualización» y sumar una fila en «Registro de cambios de este documento». Si el cambio contradice algo del documento, se corrige el documento, no se deja desactualizado.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

## Contrato de API y pruebas contra staging
- El contrato vigente es `API.md` del repo del backend https://github.com/SamuelNakab/nombre-proyecto-back, **branch `develop`** (es lo que corre en staging). No usar el de `main`.
- Las pruebas de contrato (`scripts/api-tests/`) se corren contra **staging** (`https://nombre-proyecto-back-staging.up.railway.app`), nunca contra producción.
