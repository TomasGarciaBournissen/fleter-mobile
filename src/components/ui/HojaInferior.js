import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles } from '../../context/ThemeContext';
import { fonts } from '../../theme';

// Hoja inferior genérica (radio lg 14, agarre arriba). Para elegir algo o
// confirmar una acción que no se puede deshacer.
export default function HojaInferior({ visible, titulo, bajada, children, onCerrar }) {
  const s = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={s.fondo} onPress={onCerrar} accessibilityLabel="Cerrar" />
      <View style={[s.hoja, { paddingBottom: 18 + insets.bottom }]}>
        <View style={s.agarre} />
        {titulo ? <Text style={s.titulo} accessibilityRole="header">{titulo}</Text> : null}
        {bajada ? <Text style={s.bajada}>{bajada}</Text> : null}
        <View style={{ marginTop: 14, gap: 10 }}>{children}</View>
      </View>
    </Modal>
  );
}

const createStyles = (c) => StyleSheet.create({
  fondo:  { flex: 1, backgroundColor: c.scrim },
  hoja:   { backgroundColor: c.surface, borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingHorizontal: 16, paddingTop: 8 },
  agarre: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: c.lineStrong, marginBottom: 14 },
  titulo: { fontFamily: fonts.display, fontSize: 17, color: c.ink },
  bajada: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: c.ink2, marginTop: 4 },
});
