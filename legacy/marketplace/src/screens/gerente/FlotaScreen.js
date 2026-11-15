import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Modal, TextInput, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, radius } from '../../theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import api from '../../services/api';
import { useMiEmpresa } from '../../hooks/useMiEmpresa';

let colors;
let styles;

const TIPOS_VEHICULO = ['furgon', 'camioneta', 'camion', 'pick-up', 'utilitario'];

const CONDICIONES = [
  { id: 'FRAGIL',       label: 'Frágil',        color: '#E59700' },
  { id: 'REFRIGERADO',  label: 'Refrigerado',   color: '#4FC3F7' },
  { id: 'CARGA_PESADA', label: 'Carga pesada',  color: '#90A4AE' },
  { id: 'PELIGROSO',    label: 'Peligroso',     color: '#D93025' },
  { id: 'VOLUMINOSO',   label: 'Voluminoso',    color: '#90A4AE' },
];

const FORM_VACIO = {
  patente: '', marca: '', modelo: '',
  anio: '', color: '', tipo_vehiculo: '',
  condiciones: [],
};

function CondTag({ id }) {
  const c = CONDICIONES.find(x => x.id === id);
  const color = c?.color ?? colors.textSecondary;
  return (
    <View style={[styles.tag, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}>
      <Text style={[styles.tagText, { color }]}>{c?.label ?? id}</Text>
    </View>
  );
}

function VehiculoCard({ v, onEliminar }) {
  return (
    <View style={styles.vehCard}>
      <View style={styles.vehTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.vehPatente}>{v.patente}</Text>
          <Text style={styles.vehNombre}>{v.marca} {v.modelo} · {v.anio}</Text>
          <Text style={styles.vehTipo}>{v.tipo_vehiculo} · {v.color}</Text>
        </View>
        <TouchableOpacity onPress={() => onEliminar(v)} style={styles.eliminarBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
      {v.condiciones?.length > 0 && (
        <View style={styles.tagsRow}>
          {v.condiciones.map(c => <CondTag key={c.condicion} id={c.condicion} />)}
        </View>
      )}
    </View>
  );
}

export default function FlotaScreen() {
  colors = useTheme().colors;
  styles = useThemedStyles(createStyles);
  const { idEmpresa } = useMiEmpresa();
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form,      setForm]      = useState(FORM_VACIO);

  const cargarVehiculos = useCallback(async () => {
    if (!idEmpresa) return;
    setCargando(true);
    try {
      const { data } = await api.get(`/api/empresas/${idEmpresa}/vehiculos`);
      setVehiculos(data);
    } catch {
      setVehiculos([]);
    } finally {
      setCargando(false);
    }
  }, [idEmpresa]);

  useEffect(() => { cargarVehiculos(); }, [cargarVehiculos]);

  const abrirModal = () => { setForm(FORM_VACIO); setModalOpen(true); };

  const toggleCondicion = (id) => {
    setForm(prev => ({
      ...prev,
      condiciones: prev.condiciones.includes(id)
        ? prev.condiciones.filter(c => c !== id)
        : [...prev.condiciones, id],
    }));
  };

  const handleGuardar = async () => {
    const { patente, marca, modelo, anio, color, tipo_vehiculo } = form;
    if (!patente || !marca || !modelo || !anio || !color || !tipo_vehiculo) {
      Alert.alert('Campos incompletos', 'Completá todos los campos obligatorios.');
      return;
    }
    setGuardando(true);
    try {
      const { data } = await api.post(`/api/empresas/${idEmpresa}/vehiculos`, {
        ...form,
        anio: parseInt(form.anio, 10),
      });
      setVehiculos(prev => [...prev, data]);
      setModalOpen(false);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar el vehículo.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (v) => {
    Alert.alert(
      'Dar de baja vehículo',
      `¿Eliminar ${v.marca} ${v.modelo} (${v.patente})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/empresas/${idEmpresa}/vehiculos/${v.id_vehiculo}`);
              setVehiculos(prev => prev.filter(x => x.id_vehiculo !== v.id_vehiculo));
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.barStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flota</Text>
        <TouchableOpacity style={styles.agregarBtn} onPress={abrirModal}>
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.agregarText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cargando ? (
          <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.lg }} />
        ) : vehiculos.length === 0 ? (
          <View style={styles.vehVacio}>
            <Ionicons name="car-outline" size={32} color={colors.textHint} />
            <Text style={styles.vehVacioText}>Todavía no hay vehículos en la flota</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {vehiculos.map((v, i) => (
              <React.Fragment key={v.id_vehiculo}>
                {i > 0 && <View style={styles.divider} />}
                <VehiculoCard v={v} onEliminar={handleEliminar} />
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" statusBarTranslucent>
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.modalCerrar}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitulo}>Nuevo vehículo</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <CampoTexto label="Patente *" value={form.patente} onChangeText={v => setForm(p => ({ ...p, patente: v.toUpperCase() }))} placeholder="ABC123" maxLength={8} autoCapitalize="characters" />
              <CampoTexto label="Marca *" value={form.marca} onChangeText={v => setForm(p => ({ ...p, marca: v }))} placeholder="Ford" />
              <CampoTexto label="Modelo *" value={form.modelo} onChangeText={v => setForm(p => ({ ...p, modelo: v }))} placeholder="Transit" />
              <CampoTexto label="Año *" value={form.anio} onChangeText={v => setForm(p => ({ ...p, anio: v }))} placeholder="2022" keyboardType="numeric" maxLength={4} />
              <CampoTexto label="Color *" value={form.color} onChangeText={v => setForm(p => ({ ...p, color: v }))} placeholder="Blanco" />

              <Text style={styles.campoLabel}>Tipo de vehículo *</Text>
              <View style={styles.tiposRow}>
                {TIPOS_VEHICULO.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tipoChip, form.tipo_vehiculo === t && styles.tipoChipActivo]}
                    onPress={() => setForm(p => ({ ...p, tipo_vehiculo: t }))}
                  >
                    <Text style={[styles.tipoChipText, form.tipo_vehiculo === t && styles.tipoChipTextActivo]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.campoLabel}>Condiciones habilitadas</Text>
              <View style={styles.condRow}>
                {CONDICIONES.map(c => {
                  const activo = form.condiciones.includes(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.condChip, activo && { borderColor: `${c.color}88`, backgroundColor: `${c.color}22` }]}
                      onPress={() => toggleCondicion(c.id)}
                    >
                      <Text style={[styles.condChipText, activo && { color: c.color }]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.btnGuardar, guardando && { opacity: 0.6 }]}
                onPress={handleGuardar}
                disabled={guardando}
                activeOpacity={0.85}
              >
                {guardando
                  ? <ActivityIndicator color={colors.onAccent} />
                  : <Text style={styles.btnGuardarText}>Guardar vehículo</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function CampoTexto({ label, value, onChangeText, placeholder, keyboardType, maxLength, autoCapitalize }) {
  return (
    <View style={styles.campoWrap}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput
        style={styles.campoInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textHint}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.h1, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  agregarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary,
    backgroundColor: `${colors.primary}12`,
  },
  agregarText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.primary },

  card: {
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surface3, padding: spacing.md,
  },

  vehVacio: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.xs },
  vehVacioText: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },

  vehCard: { paddingVertical: spacing.sm },
  vehTop: { flexDirection: 'row', alignItems: 'flex-start' },
  vehPatente: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary, letterSpacing: 1 },
  vehNombre: { fontSize: fontSize.body, color: colors.textPrimary, marginTop: 2 },
  vehTipo: { fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  eliminarBtn: { padding: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  tag: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.surface3, marginVertical: spacing.xs },

  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.surface3,
  },
  modalCerrar: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  modalTitulo: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary },
  modalScroll: { flex: 1 },
  modalContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },

  campoWrap: { marginBottom: spacing.xs },
  campoLabel: { fontSize: fontSize.caption, fontWeight: '700', color: colors.textHint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.xs },
  campoInput: {
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.surface3,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 48,
    fontSize: fontSize.body, color: colors.textPrimary,
  },

  tiposRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  tipoChip: {
    borderWidth: 1, borderColor: colors.surface3, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  tipoChipActivo: { backgroundColor: `${colors.primary}22`, borderColor: colors.primary },
  tipoChipText: { fontSize: fontSize.caption, color: colors.textSecondary, fontWeight: '600' },
  tipoChipTextActivo: { color: colors.primary },

  condRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  condChip: {
    borderWidth: 1, borderColor: colors.surface3, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  condChipText: { fontSize: fontSize.caption, color: colors.textSecondary, fontWeight: '600' },

  btnGuardar: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  btnGuardarText: { fontSize: fontSize.h3, fontWeight: '800', color: colors.onAccent },
});
