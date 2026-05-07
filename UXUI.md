# UX/UI Reference — Movix

## Paleta de colores
- Verde primario:    #10B954  (acciones, activos, precios, pin mapa)
- Verde oscuro:      #148840  (header fletero, pressed state)
- Verde noche:       #0A1A0F  (header exclusivo modo fletero)
- Negro base:        #0A0A0A  (fondo de todas las pantallas)
- Superficie 1:      #181818  (cards, bottom bar, status bar)
- Superficie 2:      #242424  (fields, cards anidadas, inputs)
- Superficie 3:      #2E2E2E  (bordes, hover states, separadores)
- Blanco 100%:       #FFFFFF  (títulos, valores, precios)
- Blanco 65%:        rgba(255,255,255,0.65)  (subtítulos, info secundaria)
- Blanco 35%:        rgba(255,255,255,0.35)  (labels, placeholders, hints)
- Rojo:              #F14444  (desvío, cancelar, error, destino en mapa)
- Ámbar:             #F5A623  (advertencia, frágil, en espera)
- Verde estado:      #1DB954  (entregado, activo, confirmado)

## Tipografía
- Fuentes candidatas: Archivo Black, Manrope, Josefin Sans
- H1: grande, bold — títulos de pantalla
- H2: medium — secciones
- Texto normal: regular
- Captions: pequeño, 65% opacity

## Personalidad de marca
- Segura · Simple · Control

## Navegación — Cliente (Bottom Tabs)
- Inicio
- Nuevo (crear viaje)
- Historial
- Perfil

## Navegación — Fletero (Bottom Tabs)
- Disponibles
- Activo
- Historial

## Pantallas Cliente
1. Home: stats (activos, gasto mes, puntaje) + viaje activo + últimos viajes
2. Crear viaje: origen, destino, fecha/hora, paradas, requisitos, precio estimado
3. Tracking: mapa + datos fletero + timeline de estados + alertas de desvío
4. Historial: lista agrupada por mes con estados y montos
5. Perfil: datos, método de pago, dirección frecuente, notificaciones

## Pantallas Fletero
1. Disponibles: lista de viajes con precio, distancia, requisitos
2. Oferta: detalle del viaje + countdown + Aceptar/Rechazar
3. Viaje activo: mapa + próxima parada + timeline + botón confirmar entrega
4. QR entrega: escáner + datos del destinatario
5. Cobro: resumen final + pago acreditado + calificación recibida

## Componentes clave
- Cards: fondo #181818, bordes #2E2E2E
- Botón primario: fondo #10B954, texto negro, bold
- Botón secundario: borde #2E2E2E, texto blanco
- Tags/chips: Frágil=#F5A623, Refrigerado=#2E2E2E, Carga pesada=#2E2E2E
- Alertas: fondo rojo translúcido, texto #F14444
- Estados activos: badge verde #10B954
- Estados cancelados: badge rojo #F14444
