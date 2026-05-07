import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';

const VIAJES_MOCK = [
  {
    id: 'v-001',
    origen: 'Palermo Hollywood',
    destino: 'San Telmo',
    paradas: 1,
    distanciaKm: 8.4,
    precio: 14500,
    requisitos: ['Frágil'],
    descripcion: 'Mueble de 3 cajones, bien embalado.',
    publicadoHace: '2 min',
  },
  {
    id: 'v-002',
    origen: 'Recoleta',
    destino: 'Belgrano',
    paradas: 0,
    distanciaKm: 5.1,
    precio: 9800,
    requisitos: [],
    descripcion: 'Cajas de ropa, 4 bultos medianos.',
    publicadoHace: '5 min',
  },
  {
    id: 'v-003',
    origen: 'Villa Urquiza',
    destino: 'Microcentro',
    paradas: 2,
    distanciaKm: 14.2,
    precio: 22000,
    requisitos: ['Carga pesada', 'Refrigerado'],
    descripcion: 'Heladera y lavarropas.',
    publicadoHace: '8 min',
  },
  {
    id: 'v-004',
    origen: 'Caballito',
    destino: 'Flores',
    paradas: 0,
    distanciaKm: 3.8,
    precio: 7500,
    requisitos: ['Documentos'],
    descripcion: 'Sobre cerrado, documentación legal.',
    publicadoHace: '12 min',
  },
  {
    id: 'v-005',
    origen: 'Núñez',
    destino: 'San Isidro',
    paradas: 1,
    distanciaKm: 18.5,
    precio: 28000,
    requisitos: ['Frágil'],
    descripcion: 'Cuadros y objetos de arte.',
    publicadoHace: '15 min',
  },
];

const TAG_COLORS = {
  'Frágil': colors.warning,
  'Refrigerado': '#4FC3F7',
  'Carga pesada': colors.textSecondary,
  'Documentos': colors.textSecondary,
};

function TagRequisito({ label }) {
  const color = TAG_COLORS[label] || colors.textSecondary;
  return (
    <View style={[styles.tag, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

function ViajeCard({ viaje, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={styles.rutaBlock}>
          <View style={styles.rutaDots}>
            <View style={styles.dotOrigen} />
            <View style={styles.rutaLinea} />
            <View style={styles.dotDestino} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rutaValor}>{viaje.origen}</Text>
            {viaje.paradas > 0 && (
              <Text style={styles.paradasText}>
                {viaje.paradas} parada{viaje.paradas > 1 ? 's' : ''}
              </Text>
            )}
            <Text style={[styles.rutaValor, { marginTop: viaje.paradas > 0 ? 2 : spacing.xs }]}>
              {viaje.destino}
            </Text>
          </View>
        </View>
        <View style={styles.precioBlock}>
          <Text style={styles.precio}>${viaje.precio.toLocaleString('es-AR')}</Text>
          <Text style={styles.distancia}>{viaje.distanciaKm} km</Text>
        </View>
      </View>

      {viaje.descripcion ? (
        <Text style={styles.descripcion} numberOfLines={1}>{viaje.descripcion}</Text>
      ) : null}

      <View style={styles.cardBottom}>
        <View style={styles.tagsRow}>
          {viaje.requisitos.map((r) => <TagRequisito key={r} label={r} />)}
        </View>
        <Text style={styles.tiempo}>{viaje.publicadoHace}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DisponiblesScreen({ navigation }) {
  const [viajes] = useState(VIAJES_MOCK);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Disponibles</Text>
          <Text style={styles.headerSub}>{viajes.length} viajes cerca tuyo</Text>
        </View>
        <View style={styles.activoBadge}>
          <View style={styles.activoDot} />
          <Text style={styles.activoText}>En línea</Text>
        </View>
      </View>

      <FlatList
        data={viajes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <ViajeCard
            viaje={item}
            onPress={() => navigation.navigate('Oferta', { viaje: item })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioText}>No hay viajes disponibles por ahora</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  activoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.primary}22`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
  },
  activoDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.primary },
  activoText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.primary },

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  rutaBlock: { flex: 1, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  rutaDots: { alignItems: 'center', paddingTop: 3, width: 12 },
  dotOrigen: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  rutaLinea: { width: 2, height: 22, backgroundColor: colors.surface3, marginVertical: 2 },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  rutaValor: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  paradasText: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },

  precioBlock: { alignItems: 'flex-end' },
  precio: { fontSize: fontSize.h2, fontWeight: '800', color: colors.primary },
  distancia: { fontSize: fontSize.caption, color: colors.textHint, marginTop: 2 },

  descripcion: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  tagsRow: { flexDirection: 'row', gap: spacing.xs, flex: 1, flexWrap: 'wrap' },
  tag: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 10, fontWeight: '700' },
  tiempo: { fontSize: fontSize.caption, color: colors.textHint },

  vacio: { alignItems: 'center', paddingTop: 60 },
  vacioText: { fontSize: fontSize.body, color: colors.textHint },
});
