import React from 'react';
import { Modal, View, Text, Pressable, KeyboardAvoidingView, Keyboard, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';

// Hoja inferior genérica (radio lg 14, agarre arriba). Para elegir algo o
// confirmar una acción que no se puede deshacer. En iOS sube con el teclado
// (si no, una hoja con un campo enfocado queda escondida detrás) y nunca pasa
// del 90 % de la pantalla: el contenido largo lleva su propio ScrollView.
// `alta`: ocupa ese 90 % aunque el contenido sea corto (hojas con un campo para
// escribir: el campo queda fijo arriba y la lista se estira debajo).
// `cerrarConFondo={false}`: tocar afuera solo baja el teclado; se sale con un
// botón de la hoja (para no perder lo que se estaba escribiendo).
export default function HojaInferior({ visible, titulo, bajada, children, onCerrar, alta = false, cerrarConFondo = true }) {
  const s = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.fondo} onPress={cerrarConFondo ? onCerrar : Keyboard.dismiss}
          accessibilityLabel={cerrarConFondo ? 'Cerrar' : 'Bajar el teclado'} />
        <View style={[s.hoja, alta && s.hojaAlta, { paddingBottom: 18 + insets.bottom }]}>
          <View style={s.agarre} />
          {titulo ? <Text style={s.titulo} accessibilityRole="header">{titulo}</Text> : null}
          {bajada ? <Text style={s.bajada}>{bajada}</Text> : null}
          <View style={[s.cuerpo, alta && s.cuerpoAlto]}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (c) => StyleSheet.create({
  flex:   { flex: 1 },
  fondo:  { flex: 1, backgroundColor: c.scrim },
  cuerpo: { marginTop: 14, gap: 10, flexShrink: 1 },
  cuerpoAlto: { flex: 1 },
  hojaAlta: { height: '90%' },
  hoja:   { maxHeight: '90%', backgroundColor: c.surface, borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingHorizontal: 16, paddingTop: 8 },
  agarre: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: c.lineStrong, marginBottom: 14 },
  titulo: { fontFamily: fonts.display, fontSize: 17, color: c.ink },
  bajada: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: c.ink2, marginTop: 4 },
});
