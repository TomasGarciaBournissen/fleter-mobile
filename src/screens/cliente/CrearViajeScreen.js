import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, Alert, Platform, Modal, KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius } from '../../theme';
import api from '../../services/api';
import LocationPickerModal from '../../components/LocationPickerModal';
import { formatKm, formatHoras, formatPrecio } from '../../utils/format';

const ZONAS = [
  { id: 'CABA',      label: 'CABA',      sub: '$/hora' },
  { id: 'PROVINCIA', label: 'Provincia', sub: '$/km' },
  { id: 'MIXTO',     label: 'Mixto',     sub: 'hora + km' },
];

const CONDICIONES = [
  { id: 'FRAGIL',       label: 'Frágil',       color: colors.warning },
  { id: 'REFRIGERADO',  label: 'Refrigerado',  color: '#4FC3F7' },
  { id: 'CARGA_PESADA', label: 'Carga pesada', color: colors.textSecondary },
  { id: 'PELIGROSO',    label: 'Peligroso',    color: colors.error },
  { id: 'VOLUMINOSO',   label: 'Voluminoso',   color: colors.textSecondary },
];

function formatFechaHora(d) {
  const fecha = d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' });
  const hora  = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${fecha} · ${hora}`;
}

const MIN_DATE = () => new Date(Date.now() + 60 * 60 * 1000);

// { lat, lng, direccion } | null
function LocationField({ value, placeholder, onPress }) {
  return (
    <TouchableOpacity style={styles.locationField} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        {value
          ? <Text style={styles.locationValor} numberOfLines={1}>{value.direccion}</Text>
          : <Text style={styles.locationPlaceholder}>{placeholder}</Text>
        }
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textHint} />
    </TouchableOpacity>
  );
}

function ZonaSelector({ value, onChange }) {
  return (
    <View style={styles.zonaRow}>
      {ZONAS.map(z => (
        <TouchableOpacity
          key={z.id}
          style={[styles.zonaChip, value === z.id && styles.zonaChipActivo]}
          onPress={() => onChange(z.id)}
          activeOpacity={0.8}
        >
          <Text style={[styles.zonaLabel, value === z.id && styles.zonaLabelActivo]}>{z.label}</Text>
          <Text style={[styles.zonaSub,   value === z.id && styles.zonaSubActivo]}>{z.sub}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CondChip({ item, activo, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, activo && { borderColor: item.color, backgroundColor: `${item.color}18` }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, activo && { color: item.color }]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

export default function CrearViajeScreen({ navigation }) {
  const [origen,      setOrigen]      = useState(null); // { lat, lng, direccion }
  const [destino,     setDestino]     = useState(null);
  const [paradas,     setParadas]     = useState([]);   // array de { lat, lng, direccion }
  const [zona,        setZona]        = useState('CABA');
  const [fechaHora,   setFechaHora]   = useState(() => {
    const d = new Date(); d.setHours(d.getHours() + 2, 0, 0, 0); return d;
  });
  const [mostrarPicker,  setMostrarPicker]  = useState(false);
  const [modoPicker,     setModoPicker]     = useState('date');
  const [descripcion,    setDescripcion]    = useState('');
  const [condiciones,    setCondiciones]    = useState([]);
  const [estimado,       setEstimado]       = useState(null);
  const [calculando,     setCalculando]     = useState(false);
  const [pickerTarget,   setPickerTarget]   = useState(null); // 'origen' | 'destino' | index

  const abrirPicker = (target) => setPickerTarget(target);

  const handleLocationSelected = (loc) => {
    if (pickerTarget === 'origen')  setOrigen(loc);
    else if (pickerTarget === 'destino') setDestino(loc);
    else if (typeof pickerTarget === 'number') {
      setParadas(prev => prev.map((p, i) => i === pickerTarget ? loc : p));
    }
    setPickerTarget(null);
    setEstimado(null);
  };

  const agregarParada = () => setParadas(prev => [...prev, null]);
  const quitarParada  = (i) => setParadas(prev => prev.filter((_, j) => j !== i));

  const handleZona = (z) => { setZona(z); setEstimado(null); };

  const abrirDatePicker = () => { setModoPicker('date'); setMostrarPicker(true); };

  const onChangePicker = (event, selected) => {
    if (Platform.OS === 'android') {
      setMostrarPicker(false);
      if (event.type === 'dismissed') return;
      const nueva = selected ?? fechaHora;
      if (modoPicker === 'date') {
        const merged = new Date(nueva);
        merged.setHours(fechaHora.getHours(), fechaHora.getMinutes(), 0, 0);
        setFechaHora(merged);
        setModoPicker('time');
        setMostrarPicker(true);
      } else {
        const merged = new Date(fechaHora);
        merged.setHours(nueva.getHours(), nueva.getMinutes(), 0, 0);
        setFechaHora(merged);
      }
    } else {
      if (selected) setFechaHora(selected);
    }
  };

  const toggleCond = (id) =>
    setCondiciones(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const fechaValida   = fechaHora > MIN_DATE();
  const puedeCalcular = !!origen && !!destino && fechaValida;
  const puedePublicar = puedeCalcular && !!estimado;

  const buildParadas = () => [
    origen,
    ...paradas.filter(Boolean),
    destino,
  ].map(p => ({ lat: p.lat, lng: p.lng, direccion: p.direccion }));

  const handleCalcular = async () => {
    setCalculando(true);
    setEstimado(null);
    try {
      const { data } = await api.post('/api/viajes/estimar-costo', {
        zona,
        paradas: buildParadas(),
        fecha_programada: fechaHora.toISOString(),
      });
      setEstimado(data);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo calcular el precio');
    } finally {
      setCalculando(false);
    }
  };

  const handlePublicar = () => {
    const payload = {
      zona,
      paradas: buildParadas(),
      fecha_programada: fechaHora.toISOString(),
      ...(condiciones.length > 0 && { condiciones_requeridas: condiciones }),
    };
    navigation.navigate('ConfirmacionViaje', { payload, estimado });
  };

  const tituloModal = pickerTarget === 'origen' ? 'Seleccionar origen'
    : pickerTarget === 'destino' ? 'Seleccionar destino'
    : typeof pickerTarget === 'number' ? `Parada ${pickerTarget + 1}`
    : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <LocationPickerModal
        visible={pickerTarget !== null}
        titulo={tituloModal}
        onSelect={handleLocationSelected}
        onClose={() => setPickerTarget(null)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo viaje</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Zona ─────────────────────────────────────────── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionLabel}>ZONA</Text>
          <ZonaSelector value={zona} onChange={handleZona} />
        </View>

        {/* ── Ruta ─────────────────────────────────────────── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionLabel}>RUTA</Text>
          <View style={styles.card}>
            <View style={styles.rutaRow}>
              <View style={styles.rutaDots}>
                <View style={styles.dotOrigen} />
                <View style={styles.rutaLinea} />
                <View style={styles.dotDestino} />
              </View>
              <View style={{ flex: 1 }}>
                <LocationField
                  value={origen}
                  placeholder="Origen"
                  onPress={() => abrirPicker('origen')}
                />
                <View style={styles.separador} />
                <LocationField
                  value={destino}
                  placeholder="Destino"
                  onPress={() => abrirPicker('destino')}
                />
              </View>
            </View>
          </View>

          {paradas.map((p, i) => (
            <View key={i} style={styles.paradaRow}>
              <View style={styles.paradaBadge}>
                <Text style={styles.paradaBadgeText}>{i + 1}</Text>
              </View>
              <TouchableOpacity
                style={[styles.paradaField, { flex: 1 }]}
                onPress={() => abrirPicker(i)}
                activeOpacity={0.7}
              >
                {p
                  ? <Text style={styles.locationValor} numberOfLines={1}>{p.direccion}</Text>
                  : <Text style={styles.locationPlaceholder}>Toca para elegir parada</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => quitarParada(i)}
                style={styles.paradaRemove}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.btnSecundario} onPress={agregarParada}>
            <Text style={styles.btnSecundarioText}>+ Agregar parada intermedia</Text>
          </TouchableOpacity>
        </View>

        {/* ── Cuándo ───────────────────────────────────────── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionLabel}>CUÁNDO</Text>
          <TouchableOpacity style={styles.fechaBtn} onPress={abrirDatePicker} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.campoLabel}>Fecha y hora</Text>
              <Text style={[styles.fechaBtnValor, !fechaValida && { color: colors.error }]}>
                {formatFechaHora(fechaHora)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textHint} />
          </TouchableOpacity>
          {!fechaValida && (
            <Text style={styles.fechaError}>Debe ser al menos 1 hora desde ahora</Text>
          )}
        </View>

        {mostrarPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={fechaHora}
            mode={modoPicker}
            display="default"
            minimumDate={MIN_DATE()}
            onChange={onChangePicker}
          />
        )}

        {Platform.OS === 'ios' && (
          <Modal visible={mostrarPicker} transparent animationType="slide">
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setMostrarPicker(false)}>
                    <Text style={styles.pickerListo}>Listo</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={fechaHora}
                  mode="datetime"
                  display="spinner"
                  minimumDate={MIN_DATE()}
                  onChange={onChangePicker}
                  locale="es-AR"
                  textColor={colors.textPrimary}
                  style={{ width: '100%', backgroundColor: colors.background }}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* ── Carga y requisitos ────────────────────────────── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionLabel}>CARGA</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, { marginBottom: spacing.sm }]}
            placeholder="Describí qué vas a transportar (opcional)"
            placeholderTextColor={colors.textHint}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.campoLabel}>Requisitos del vehículo</Text>
          <View style={styles.chipsRow}>
            {CONDICIONES.map(c => (
              <CondChip key={c.id} item={c} activo={condiciones.includes(c.id)} onPress={() => toggleCond(c.id)} />
            ))}
          </View>
        </View>

        {/* ── Calcular precio ──────────────────────────────── */}
        <TouchableOpacity
          style={[styles.btnCalcular, (!puedeCalcular || calculando) && styles.btnOff]}
          onPress={handleCalcular}
          disabled={!puedeCalcular || calculando}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnCalcularText, (!puedeCalcular || calculando) && { opacity: 0.4 }]}>
            {calculando ? 'Calculando...' : estimado ? 'Recalcular precio' : '$ Calcular precio estimado'}
          </Text>
        </TouchableOpacity>

        {estimado && (
          <View style={styles.estimadoCard}>
            <Text style={styles.estimadoSub}>Precio estimado</Text>
            <Text style={styles.estimadoValor}>
              ${formatPrecio(estimado.precio_estimado)}
            </Text>
            <View style={styles.estimadoDetRow}>
              <Text style={styles.estimadoDet}>{formatKm(estimado.desglose?.distancia_km)}</Text>
              <Text style={styles.estimadoSep}>·</Text>
              <Text style={styles.estimadoDet}>{formatHoras(estimado.desglose?.tiempo_horas)} estimadas</Text>
            </View>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnPublicar, !puedePublicar && styles.btnOff]}
          disabled={!puedePublicar}
          onPress={handlePublicar}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPublicarText}>
            {estimado ? 'Ver resumen →' : 'Calculá el precio para continuar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon:    { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 120 },

  seccion:      { marginBottom: spacing.lg },
  seccionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textHint,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm,
  },

  // Zona
  zonaRow:      { flexDirection: 'row', gap: spacing.sm },
  zonaChip:     {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.surface3,
    backgroundColor: colors.surface1,
  },
  zonaChipActivo:  { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
  zonaLabel:       { fontSize: fontSize.body, fontWeight: '700', color: colors.textSecondary },
  zonaLabelActivo: { color: colors.primary },
  zonaSub:         { fontSize: 10, color: colors.textHint, marginTop: 2 },
  zonaSubActivo:   { color: `${colors.primary}99` },

  // Ruta card
  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  rutaRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rutaDots:   { alignItems: 'center', width: 12 },
  dotOrigen:  { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  rutaLinea:  { width: 2, height: 44, backgroundColor: colors.surface3, marginVertical: 3 },
  dotDestino: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.error },
  separador:  { height: 1, backgroundColor: colors.surface3 },

  // Location field
  locationField: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  locationDot:         { width: 8, height: 8, borderRadius: 4 },
  locationValor:       { fontSize: fontSize.body, color: colors.textPrimary, fontWeight: '600' },
  locationPlaceholder: { fontSize: fontSize.body, color: colors.textHint },
  locationChevron:     { fontSize: 18, color: colors.textHint },

  // Paradas
  paradaRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  paradaBadge: {
    width: 22, height: 22, borderRadius: radius.full,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  paradaBadgeText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  paradaField:     {
    borderWidth: 1, borderColor: colors.surface3, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    backgroundColor: colors.surface1,
  },
  paradaRemove: { padding: spacing.xs },

  // Inputs
  campoLabel: { fontSize: fontSize.caption, color: colors.textHint, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: colors.surface1, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: fontSize.body, color: colors.textPrimary,
  },
  inputMultiline: { height: 72, textAlignVertical: 'top', paddingTop: spacing.sm },

  // Fecha
  fechaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  fechaBtnIcono:   { fontSize: 20 },
  fechaBtnValor:   { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary, marginTop: 2 },
  fechaBtnChevron: { fontSize: 22, color: colors.textHint, fontWeight: '300' },
  fechaError:      { fontSize: fontSize.caption, color: colors.error, marginTop: 4, marginLeft: 4 },

  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  pickerSheet:   {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
  },
  pickerHeader:  {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.surface3,
  },
  pickerListo: { fontSize: fontSize.body, fontWeight: '700', color: colors.primary },

  // Condiciones
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4 },
  chip: {
    borderWidth: 1, borderColor: colors.surface3, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.surface1,
  },
  chipText: { fontSize: fontSize.caption, color: colors.textSecondary, fontWeight: '600' },

  // Botón secundario
  btnSecundario: {
    borderWidth: 1, borderColor: colors.surface3, borderRadius: radius.md,
    paddingVertical: spacing.sm, alignItems: 'center',
    marginTop: spacing.xs, backgroundColor: colors.surface1,
  },
  btnSecundarioText: { fontSize: fontSize.body, color: colors.textSecondary, fontWeight: '600' },

  // Calcular
  btnCalcular: {
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
    marginBottom: spacing.md, backgroundColor: colors.surface1,
  },
  btnCalcularText: { fontSize: fontSize.h3, fontWeight: '700', color: colors.primary },
  btnOff:          { opacity: 0.45 },

  // Estimado
  estimadoCard: {
    backgroundColor: `${colors.primary}12`, borderRadius: radius.lg,
    borderWidth: 1, borderColor: `${colors.primary}44`,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg,
  },
  estimadoSub:    { fontSize: fontSize.caption, fontWeight: '600', color: colors.textSecondary },
  estimadoValor:  { fontSize: 40, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  estimadoDetRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  estimadoDet:    { fontSize: fontSize.body, color: colors.textSecondary },
  estimadoSep:    { color: colors.textHint },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.surface3,
  },
  btnPublicar: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  btnPublicarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary },
});
