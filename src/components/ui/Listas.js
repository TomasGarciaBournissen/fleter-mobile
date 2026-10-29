import React, { Children } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';

export const iniciales = (nombre = '') => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

// Cuadrado 36×36 con iniciales o un ícono (personas, empresas, ítems de Más)
export function Avatar({ nombre, icono, punteado, style }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  return (
    <View style={[s.avatar, punteado && s.avatarPunteado, style]}>
      {icono
        ? <MaterialCommunityIcons name={icono} size={18} color={colors.ink2} />
        : <Text style={s.avatarTexto}>{iniciales(nombre)}</Text>}
    </View>
  );
}

// Caja con filas separadas por una línea (el patrón .lista del prototipo)
export function Lista({ children, style }) {
  const s = useThemedStyles(createStyles);
  const filas = Children.toArray(children).filter(Boolean);
  return (
    <View style={[s.lista, style]}>
      {filas.map((f, i) => <View key={f.key ?? i} style={i > 0 && s.borde}>{f}</View>)}
    </View>
  );
}

// Fila de lista: algo a la izquierda, título y bajada, y a la derecha un
// chevron, una acción en texto o lo que se pase en `derecha`.
export function Fila({ izquierda, titulo, sub, derecha, accion, accionPeligro, chevron, onPress, onAccion, accessibilityLabel }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  // Sin onPress es una vista: así una acción en texto adentro sigue tocándose
  const Caja = onPress ? Pressable : View;
  return (
    <Caja
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={onPress ? ({ pressed }) => [s.fila, pressed && { backgroundColor: colors.surface2 }] : s.fila}
    >
      {izquierda}
      <View style={s.textos}>
        {typeof titulo === 'string' ? <Text style={s.titulo}>{titulo}</Text> : titulo}
        {sub ? <Text style={s.sub}>{sub}</Text> : null}
      </View>
      {derecha}
      {accion ? (
        <Text onPress={onAccion} accessibilityRole="button" suppressHighlighting style={[s.accion, accionPeligro && { color: colors.errorInk }]}>{accion}</Text>
      ) : null}
      {chevron ? <MaterialCommunityIcons name="chevron-right" size={20} color={colors.ink3} /> : null}
    </Caja>
  );
}

// Título de sección en Archivo Black 14 con una nota chica a la derecha
export function Seccion({ titulo, nota, children, style }) {
  const s = useThemedStyles(createStyles);
  return (
    <View style={style}>
      <View style={s.seccion}>
        <Text style={s.seccionTitulo} accessibilityRole="header">{titulo}</Text>
        {nota ? <Text style={s.sub}>{nota}</Text> : null}
      </View>
      {children}
    </View>
  );
}

// Estado vacío: ícono en un cuadrado, título y qué va a aparecer acá
export function Vacio({ icono = 'package-variant', titulo, texto, centrado, children }) {
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  return (
    <View style={[s.vacio, centrado && s.vacioCentrado]}>
      <View style={s.vacioIcono}><MaterialCommunityIcons name={icono} size={26} color={colors.ink3} /></View>
      <Text style={[s.vacioTitulo, centrado && { textAlign: 'center' }]}>{titulo}</Text>
      {texto ? <Text style={[s.vacioTexto, centrado && { textAlign: 'center' }]}>{texto}</Text> : null}
      {children}
    </View>
  );
}

// Filtros de una sola opción (Activos / En curso / Terminados)
export function Filtros({ opciones, valor, onCambiar, style }) {
  const s = useThemedStyles(createStyles);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[{ flexGrow: 0 }, style]} contentContainerStyle={s.filtros}>
      {opciones.map((o) => {
        const on = o.id === valor;
        return (
          <Pressable key={o.id} onPress={() => onCambiar(o.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[s.filtro, on && s.filtroOn]}>
            <Text style={[s.filtroTexto, on && s.filtroTextoOn]}>{o.titulo}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  avatar:        { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarPunteado:{ borderStyle: 'dashed', borderColor: c.lineStrong },
  avatarTexto:   { fontFamily: fonts.uiBold, fontSize: 13, color: c.ink2 },
  lista:         { borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface, overflow: 'hidden' },
  borde:         { borderTopWidth: 1, borderTopColor: c.line },
  fila:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 56 },
  textos:        { flex: 1, minWidth: 0 },
  titulo:        { fontFamily: fonts.uiBold, fontSize: 14, color: c.ink },
  sub:           { fontFamily: fonts.ui, fontSize: 12, lineHeight: 17, color: c.ink3, marginTop: 1 },
  accion:        { fontFamily: fonts.uiBold, fontSize: 13, color: c.accentInk, paddingVertical: 6 },
  seccion:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 22, marginBottom: 10 },
  seccionTitulo: { fontFamily: fonts.display, fontSize: 14, color: c.ink },
  vacio:         { marginTop: 56 },
  vacioCentrado: { marginTop: 110, alignItems: 'center', paddingHorizontal: 18 },
  vacioIcono:    { width: 56, height: 56, borderRadius: 14, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  vacioTitulo:   { fontFamily: fonts.display, fontSize: 18, color: c.ink },
  vacioTexto:    { fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: c.ink3, marginTop: 6, maxWidth: 320 },
  filtros:       { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filtro:        { height: 32, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surface, justifyContent: 'center' },
  filtroOn:      { backgroundColor: c.ink, borderColor: c.ink },
  filtroTexto:   { fontFamily: fonts.uiSemiBold, fontSize: 13, color: c.ink2 },
  filtroTextoOn: { color: c.onInk },
});
