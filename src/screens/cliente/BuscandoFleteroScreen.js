import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, Animated, Easing, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import { useSocket } from '../../context/SocketContext';

export default function BuscandoFleteroScreen({ navigation, route }) {
  const { idViaje } = route.params ?? {};
  const { socket } = useSocket();

  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const makePulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.8, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1,   duration: 900, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
        ])
      ).start();

    makePulse(pulse1, 0);
    makePulse(pulse2, 300);
    makePulse(pulse3, 600);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onAsignado = (data) => {
      navigation.replace('ViajeActivo', { viajeId: data.id_viaje, conductor: data.conductor, vehiculo: data.vehiculo });
    };

    const onCancelado = (data) => {
      if (idViaje && Number(data.id_viaje) !== Number(idViaje)) return;
      Alert.alert(
        'Sin fletero disponible',
        data.mensaje ?? 'No se encontró un fletero en el tiempo límite. Podés volver a publicar el viaje.',
        [{ text: 'Volver al inicio', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) }]
      );
    };

    socket.on('viaje:conductor_asignado',      onAsignado);
    socket.on('viaje:cancelado_sin_conductor', onCancelado);
    return () => {
      socket.off('viaje:conductor_asignado',      onAsignado);
      socket.off('viaje:cancelado_sin_conductor', onCancelado);
    };
  }, [socket, navigation, idViaje]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.wrap}>
        {/* Animación de pulsos */}
        <View style={styles.pulseWrap}>
          {[pulse1, pulse2, pulse3].map((anim, i) => (
            <Animated.View
              key={i}
              style={[styles.pulseRing, { transform: [{ scale: anim }], opacity: anim.interpolate({ inputRange: [1, 1.8], outputRange: [0.35, 0] }) }]}
            />
          ))}
          <View style={styles.icono}>
            <Ionicons name="car" size={32} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.titulo}>Buscando fletero...</Text>
        <Text style={styles.sub}>
          Tu viaje fue publicado a todos los fleteros disponibles.{'\n'}
          El primero en aceptar quedará asignado.
        </Text>

        {idViaje && (
          <View style={styles.idCard}>
            <Text style={styles.idLabel}>Viaje</Text>
            <Text style={styles.idValor}>#{idViaje}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.btnCancelar}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          activeOpacity={0.8}
        >
          <Text style={styles.btnCancelarText}>Volver al inicio</Text>
        </TouchableOpacity>
        <Text style={styles.nota}>
          El viaje sigue activo. Te avisamos cuando un fletero acepte.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  pulseWrap: {
    width: 120, height: 120,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, borderColor: colors.primary,
  },
  icono: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: `${colors.primary}22`,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  iconoText: { fontSize: 32 },

  titulo: {
    fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', marginBottom: spacing.sm,
  },
  sub: {
    fontSize: fontSize.body, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl,
  },

  idCard: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    alignItems: 'center', marginBottom: spacing.xl,
  },
  idLabel: { fontSize: fontSize.caption, color: colors.textHint },
  idValor: { fontSize: fontSize.h2, fontWeight: '800', color: colors.primary, marginTop: 2 },

  btnCancelar: {
    borderWidth: 1, borderColor: colors.surface3,
    borderRadius: radius.lg, paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  btnCancelarText: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },
  nota: {
    fontSize: fontSize.caption, color: colors.textHint,
    textAlign: 'center', marginTop: spacing.sm,
  },
});
