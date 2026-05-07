import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';

const REQUISITOS = [
  { id: 'fragil', label: 'Frágil', color: colors.warning },
  { id: 'refrigerado', label: 'Refrigerado', color: colors.textSecondary },
  { id: 'pesado', label: 'Carga pesada', color: colors.textSecondary },
  { id: 'documentos', label: 'Documentos', color: colors.textSecondary },
];

function Campo({ label, placeholder, value, onChangeText, multiline }) {
  return (
    <View style={styles.campoWrapper}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={colors.textHint}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

function TagRequisito({ label, color, activo, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tag, activo && { borderColor: color, backgroundColor: `${color}22` }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.tagText, activo && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Parada({ numero, value, onChangeText, onRemove }) {
  return (
    <View style={styles.paradaRow}>
      <View style={styles.paradaNum}>
        <Text style={styles.paradaNumText}>{numero}</Text>
      </View>
      <TextInput
        style={[styles.input, { flex: 1 }]}
        placeholder="Dirección de parada"
        placeholderTextColor={colors.textHint}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity onPress={onRemove} style={styles.paradaRemove}>
        <Text style={styles.paradaRemoveText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CrearViajeScreen({ navigation }) {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [paradas, setParadas] = useState([]);
  const [requisitos, setRequisitos] = useState([]);
  const [precioSugerido, setPrecioSugerido] = useState('');
  const [negociable, setNegociable] = useState(true);

  const toggleRequisito = (id) => {
    setRequisitos((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const agregarParada = () => {
    setParadas((prev) => [...prev, '']);
  };

  const actualizarParada = (i, val) => {
    setParadas((prev) => prev.map((p, idx) => (idx === i ? val : p)));
  };

  const eliminarParada = (i) => {
    setParadas((prev) => prev.filter((_, idx) => idx !== i));
  };

  const puedePublicar = origen.trim() && destino.trim() && fecha.trim() && hora.trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo viaje</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Ruta */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitle}>Ruta</Text>
          <View style={styles.card}>
            <View style={styles.rutaInputRow}>
              <View style={styles.rutaDots}>
                <View style={styles.dotOrigen} />
                <View style={styles.rutaLinea} />
                <View style={styles.dotDestino} />
              </View>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <TextInput
                  style={styles.inputRuta}
                  placeholder="Origen"
                  placeholderTextColor={colors.textHint}
                  value={origen}
                  onChangeText={setOrigen}
                />
                <View style={styles.separadorRuta} />
                <TextInput
                  style={styles.inputRuta}
                  placeholder="Destino"
                  placeholderTextColor={colors.textHint}
                  value={destino}
                  onChangeText={setDestino}
                />
              </View>
            </View>
          </View>

          {/* Paradas */}
          {paradas.map((p, i) => (
            <Parada
              key={i}
              numero={i + 1}
              value={p}
              onChangeText={(v) => actualizarParada(i, v)}
              onRemove={() => eliminarParada(i)}
            />
          ))}
          <TouchableOpacity style={styles.btnSecundario} onPress={agregarParada}>
            <Text style={styles.btnSecundarioText}>+ Agregar parada</Text>
          </TouchableOpacity>
        </View>

        {/* Fecha y hora */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitle}>Cuándo</Text>
          <View style={styles.filaDos}>
            <View style={{ flex: 1 }}>
              <Campo label="Fecha" placeholder="dd/mm/aaaa" value={fecha} onChangeText={setFecha} />
            </View>
            <View style={{ flex: 1 }}>
              <Campo label="Hora" placeholder="HH:MM" value={hora} onChangeText={setHora} />
            </View>
          </View>
        </View>

        {/* Carga */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitle}>Carga</Text>
          <Campo
            label="Descripción"
            placeholder="Qué vas a transportar..."
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
          />
          <Text style={styles.campoLabel}>Requisitos</Text>
          <View style={styles.tagsRow}>
            {REQUISITOS.map((r) => (
              <TagRequisito
                key={r.id}
                label={r.label}
                color={r.color}
                activo={requisitos.includes(r.id)}
                onPress={() => toggleRequisito(r.id)}
              />
            ))}
          </View>
        </View>

        {/* Precio */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitle}>Precio</Text>
          <Campo
            label="Precio sugerido ($)"
            placeholder="Ej: 15000"
            value={precioSugerido}
            onChangeText={setPrecioSugerido}
          />
          <View style={styles.negociableRow}>
            <Text style={styles.negociableLabel}>Precio negociable</Text>
            <Switch
              value={negociable}
              onValueChange={setNegociable}
              trackColor={{ false: colors.surface3, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        {/* Estimado */}
        {precioSugerido ? (
          <View style={styles.estimadoCard}>
            <Text style={styles.estimadoLabel}>Precio estimado</Text>
            <Text style={styles.estimadoValor}>
              ${Number(precioSugerido).toLocaleString('es-AR')}
            </Text>
            {negociable && (
              <Text style={styles.estimadoNota}>El fletero puede contraofertar</Text>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Botón publicar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnPublicar, !puedePublicar && styles.btnPublicarDisabled]}
          disabled={!puedePublicar}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPublicarText}>Publicar viaje</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: {
    fontSize: fontSize.h2,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 100 },

  seccion: { marginBottom: spacing.lg },
  seccionTitle: {
    fontSize: fontSize.h3,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  rutaInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rutaDots: { alignItems: 'center', width: 12, gap: 3 },
  dotOrigen: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  rutaLinea: { width: 2, height: 28, backgroundColor: colors.surface3 },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  separadorRuta: { height: 1, backgroundColor: colors.surface3 },
  inputRuta: {
    fontSize: fontSize.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },

  campoWrapper: { marginBottom: spacing.sm },
  campoLabel: {
    fontSize: fontSize.caption,
    color: colors.textHint,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },

  filaDos: { flexDirection: 'row', gap: spacing.sm },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  tag: {
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: { fontSize: fontSize.caption, color: colors.textSecondary, fontWeight: '600' },

  negociableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  negociableLabel: { fontSize: fontSize.body, color: colors.textPrimary },

  estimadoCard: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  estimadoLabel: { fontSize: fontSize.caption, color: colors.textSecondary },
  estimadoValor: { fontSize: 32, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  estimadoNota: { fontSize: fontSize.caption, color: colors.textHint },

  paradaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  paradaNum: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paradaNumText: { fontSize: fontSize.caption, color: colors.textSecondary, fontWeight: '700' },
  paradaRemove: { padding: spacing.xs },
  paradaRemoveText: { fontSize: 14, color: colors.error },

  btnSecundario: {
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnSecundarioText: { fontSize: fontSize.body, color: colors.textSecondary, fontWeight: '600' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface3,
  },
  btnPublicar: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnPublicarDisabled: { opacity: 0.4 },
  btnPublicarText: { fontSize: fontSize.h3, fontWeight: '800', color: '#000' },
});
