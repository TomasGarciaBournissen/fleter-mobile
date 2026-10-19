import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StatusBar, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';

// Esqueleto de toda pantalla: zona segura, barra de estado del tema,
// contenido con scroll y un pie fijo para las acciones (zona del pulgar).
// `onVolver` muestra el botón de volver arriba a la izquierda.
export default function Pantalla({ children, pie, pieConLinea = false, onVolver, derecha, scroll = true, contenidoStyle, edges = ['top', 'bottom'], refreshControl }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const Cuerpo = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <StatusBar barStyle={colors.barStyle} backgroundColor={colors.bg} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Cuerpo
          style={styles.flex}
          contentContainerStyle={scroll ? [styles.cuerpo, contenidoStyle] : undefined}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={scroll ? refreshControl : undefined}
        >
          {onVolver || derecha ? (
            <View style={styles.arriba}>
              {onVolver ? (
              <Pressable
                onPress={onVolver}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                hitSlop={8}
                style={({ pressed }) => [styles.volver, pressed && { backgroundColor: colors.surface3 }]}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color={colors.ink} />
              </Pressable>
              ) : <View />}
              {derecha}
            </View>
          ) : null}
          {scroll ? children : <View style={[styles.cuerpo, styles.flex, contenidoStyle]}>{children}</View>}
        </Cuerpo>
        {pie ? <View style={[styles.pie, pieConLinea && styles.pieLinea]}>{pie}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (c) => StyleSheet.create({
  safe:     { flex: 1, backgroundColor: c.bg },
  flex:     { flex: 1 },
  cuerpo:   { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
  arriba:   { height: 44, marginLeft: -10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  volver:   { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pie:      { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 10, backgroundColor: c.bg },
  pieLinea: { borderTopWidth: 1, borderTopColor: c.line },
});
