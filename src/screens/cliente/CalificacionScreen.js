import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
  TextInput, ActivityIndicator, Alert, Linking, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import api from '../../services/api';
import { formatPrecio } from '../../utils/format';

export default function CalificacionScreen({ navigation, route }) {
  const { viajeId, precioReal, remitoUrl } = route.params ?? {};
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando,   setEnviando]   = useState(false);

  const handleCalificar = async () => {
    if (puntuacion === 0) {
      Alert.alert('Puntuación requerida', 'Seleccioná una puntuación antes de continuar.');
      return;
    }
    setEnviando(true);
    try {
      await api.post(`/api/viajes/${viajeId}/calificacion`, {
        puntuacion,
        ...(comentario.trim() ? { comentario: comentario.trim() } : {}),
      });
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e) {
      const msg = e?.response?.data?.error ?? 'No se pudo enviar la calificación';
      Alert.alert('Error', msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.exitoIcono}>
          <Ionicons name="checkmark" size={40} color={colors.success} />
        </View>
        <Text style={styles.titulo}>¡Viaje finalizado!</Text>
        <Text style={styles.sub}>Tu carga fue entregada correctamente</Text>

        {/* Resumen de costo */}
        {precioReal != null && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumen</Text>
            <View style={styles.fila}>
              <Text style={styles.filaLabel}>Total del viaje</Text>
              <Text style={styles.filaPrecio}>${formatPrecio(precioReal)}</Text>
            </View>
            {remitoUrl ? (
              <TouchableOpacity style={styles.remitoBtn} onPress={() => Linking.openURL(remitoUrl)} activeOpacity={0.85}>
                <Ionicons name="document-outline" size={16} color={colors.primary} />
                <Text style={styles.remitoBtnText}>Ver remito PDF</Text>
                <Ionicons name="open-outline" size={14} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Rating */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Cómo estuvo el fletero?</Text>
          <View style={styles.estrellas}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setPuntuacion(n)} activeOpacity={0.7}>
                <Ionicons
                  name={n <= puntuacion ? 'star' : 'star-outline'}
                  size={42}
                  color={n <= puntuacion ? colors.warning : colors.textHint}
                />
              </TouchableOpacity>
            ))}
          </View>
          {puntuacion > 0 && (
            <Text style={styles.puntuacionLabel}>
              {puntuacion === 5 ? 'Excelente' :
               puntuacion === 4 ? 'Muy bueno' :
               puntuacion === 3 ? 'Bueno' :
               puntuacion === 2 ? 'Regular' : 'Malo'}
            </Text>
          )}
          <TextInput
            style={styles.comentarioInput}
            value={comentario}
            onChangeText={setComentario}
            placeholder="Comentario opcional..."
            placeholderTextColor={colors.textHint}
            multiline
            maxLength={300}
          />
        </View>

        <TouchableOpacity
          style={[styles.btnCalificar, (puntuacion === 0 || enviando) && { opacity: 0.5 }]}
          onPress={handleCalificar}
          disabled={puntuacion === 0 || enviando}
          activeOpacity={0.85}
        >
          {enviando
            ? <ActivityIndicator color={colors.textPrimary} />
            : <Text style={styles.btnCalificarText}>Enviar calificación</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOmitir}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        >
          <Text style={styles.btnOmitirText}>Omitir</Text>
        </TouchableOpacity>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl * 2,
    alignItems: 'center',
  },

  exitoIcono: {
    width: 80, height: 80, borderRadius: radius.full,
    backgroundColor: `${colors.success}22`, borderWidth: 2, borderColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  titulo: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  sub: {
    fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center',
    marginTop: spacing.xs, marginBottom: spacing.xl,
  },

  card: {
    width: '100%',
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },

  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filaLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  filaPrecio: { fontSize: fontSize.h2, fontWeight: '800', color: colors.primary },

  remitoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.md, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  remitoBtnText: { flex: 1, fontSize: fontSize.body, color: colors.primary, fontWeight: '600' },

  estrellas: {
    flexDirection: 'row', justifyContent: 'center',
    gap: spacing.sm, marginBottom: spacing.sm,
  },
  puntuacionLabel: {
    fontSize: fontSize.body, fontWeight: '700', color: colors.warning,
    textAlign: 'center', marginBottom: spacing.md,
  },
  comentarioInput: {
    backgroundColor: colors.surface2, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: fontSize.body, color: colors.textPrimary,
    minHeight: 80, textAlignVertical: 'top',
  },

  btnCalificar: {
    width: '100%',
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.sm,
  },
  btnCalificarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },

  btnOmitir: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  btnOmitirText: { fontSize: fontSize.body, color: colors.textHint, fontWeight: '600' },
});
