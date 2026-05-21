# UX/UI Reference — Movix

## Paleta de colores
- Naranja primario:   #F4711A  (acciones, activos, precios, pin mapa)
- Naranja oscuro:     #D4601A  (header fletero, pressed state)
- Naranja noche:      #4A1E00  (header exclusivo modo fletero)
- Crema base:         #FFF8F2  (fondo de todas las pantallas)
- Superficie 1:       #FFFFFF  (cards, bottom bar, status bar)
- Superficie 2:       #FFF3EA  (fields, cards anidadas, inputs)
- Superficie 3:       #FFE4CC  (bordes, hover states, separadores)
- Marrón 100%:        #1A1207  (títulos, valores, precios)
- Marrón 65%:         rgba(26,18,7,0.65)  (subtítulos, info secundaria)
- Marrón 35%:         rgba(26,18,7,0.35)  (labels, placeholders, hints)
- Rojo:               #D93025  (desvío, cancelar, error, destino en mapa)
- Ámbar:              #E59700  (advertencia, frágil, en espera)
- Verde estado:       #22A45D  (entregado, activo, confirmado)

## Tipografía
- Fuentes candidatas: Archivo Black, Manrope, Josefin Sans
- H1: grande, bold — títulos de pantalla
- H2: medium — secciones
- Texto normal: regular
- Captions: pequeño, 65% opacity

## Personalidad de marca
- Segura — Simple — Control

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
- Cards: fondo #FFFFFF, bordes #FFE4CC
- Botón primario: fondo #F4711A, texto blanco, bold
- Botón secundario: borde #FFE4CC, texto #1A1207
- Tags/chips: Frágil=#E59700, Refrigerado=#FFF3EA, Carga pesada=#FFF3EA
- Alertas: fondo rojo translúcido, texto #D93025
- Estados activos: badge naranja #F4711A
- Estados cancelados: badge rojo #D93025
