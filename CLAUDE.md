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

## Sistema de dise�o (RESPETAR SIEMPRE)
- Fondo:              #FFF8F2  (crema calido)
- Superficie 1:       #FFFFFF  (cards, bottom bar)
- Superficie 2:       #FFF3EA  (inputs, cards anidadas)
- Superficie 3:       #FFE4CC  (bordes, separadores)
- Naranja primario:   #F4711A  (botones, activos, precios)
- Naranja oscuro:     #D4601A  (pressed state)
- Texto 100%:         #1A1207  (t�tulos)
- Texto 65%:          rgba(26,18,7,0.65)  (subt�tulos)
- Texto 35%:          rgba(26,18,7,0.35)  (hints, placeholders)
- Error/desv�o:       #D93025
- Warning/fr�gil:     #E59700
- �xito:              #22A45D

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
