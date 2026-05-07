# Movix — Contexto para Claude Code

## Qué es este proyecto
App mobile React Native + Expo para iOS y Android. Marketplace de fletes para PyMEs argentinas (CABA + Gran Buenos Aires). Similar a Uber pero para camiones y fleteros.

## Stack
- React Native + Expo
- React Navigation (dos stacks: cliente y fletero)
- Socket.io client (WebSockets para matching y GPS en tiempo real)
- Axios (REST API)
- react-native-keychain (tokens JWT seguros)
- react-native-background-geolocation (GPS en background — componente más crítico)
- expo-barcode-scanner (QR por parada)
- expo-notifications + Firebase Cloud Messaging (push notifications)
- MercadoPago SDK (pagos)

## Estructura
src/
  navigation/
    RootNavigator.js   — detecta rol del JWT y redirige al stack correcto
    ClienteStack.js    — stack del cliente
    FleteroStack.js    — stack del fletero
  screens/
    cliente/           — pantallas del lado cliente
    fletero/           — pantallas del lado fletero
  services/
    api.js             — axios con interceptor JWT
    socket.js          — socket.io client
  hooks/
    useAuth.js         — manejo de sesión con Keychain
  theme.js             — sistema de diseño completo

## Sistema de diseño (RESPETAR SIEMPRE)
- Fondo:         #0A0A0A
- Superficie 1:  #181818  (cards, bottom bar)
- Superficie 2:  #242424  (inputs, cards anidadas)
- Superficie 3:  #2E2E2E  (bordes, separadores)
- Verde primario:#10B954  (botones, activos, precios)
- Verde oscuro:  #148840  (pressed state)
- Blanco 100%:   #FFFFFF  (títulos)
- Blanco 65%:    rgba(255,255,255,0.65)  (subtítulos)
- Blanco 35%:    rgba(255,255,255,0.35)  (hints, placeholders)
- Error/desvío:  #F14444
- Warning/frágil:#F5A623
- Éxito:         #1DB954

## Navegación cliente (Bottom Tabs)
- Inicio, Nuevo, Historial, Perfil

## Navegación fletero (Bottom Tabs)
- Disponibles, Activo, Historial

## Pantallas a construir — Cliente
1. Home: saludo, stats (activos/gasto/puntaje), viaje activo card, últimos viajes
2. Crear viaje: origen/destino con Places Autocomplete, fecha/hora, paradas, requisitos vehículo, precio estimado en tiempo real
3. Tracking: mapa con pin fletero en tiempo real, datos fletero, timeline de estados, alertas de desvío
4. Historial: lista agrupada por mes, estados con colores, montos
5. Perfil: datos personales, método de pago, dirección frecuente, notificaciones toggles

## Pantallas a construir — Fletero
1. Disponibles: lista de viajes compatibles con su vehículo, precio/distancia/requisitos
2. Oferta: detalle viaje + countdown + Aceptar/Rechazar
3. Viaje activo: mapa + próxima parada + timeline + botón confirmar entrega
4. QR entrega: escáner + datos destinatario
5. Cobro/resumen: pago acreditado + desglose + calificación recibida

## Reglas importantes
- El mobile NUNCA calcula nada — solo manda datos al backend y muestra resultados
- Todos los algoritmos (costo, desvíos, matching) viven en el backend
- JWT guardado SIEMPRE con react-native-keychain, NUNCA AsyncStorage
- GPS background requiere testing en dispositivo físico real (no simulador)
- El backend todavía no está listo — construir con mock data por ahora
- Cuando llegue el contrato de API, reemplazar mock data por llamadas reales

## Estado actual
- Scaffold completo creado
- Navegación base armada (RootNavigator, ClienteStack, FleteroStack con placeholders)
- Sistema de diseño en src/theme.js
- Servicios base en src/services/ (api.js, socket.js)
- Hook de autenticación en src/hooks/useAuth.js
- Próximo paso: construir las pantallas con mock data respetando el diseño UX/UI

## Dos roles con experiencias completamente distintas
- CLIENTE: empresa PyME que pide el flete, ve el mapa, recibe alertas
- FLETERO: conductor que acepta viajes, activa GPS, escanea QR
