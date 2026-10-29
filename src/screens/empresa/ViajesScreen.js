import React, { useCallback, useState } from 'react';
import { View, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { listarViajes, listarSeries } from '../../services/viajesEmpresa';
import { diaCorto } from '../../utils/fechas';
import { etiquetaFrecuencia } from '../../utils/series';
import { mensajeDeError } from '../../utils/errores';
import useEnVivo from '../../hooks/useEnVivo';
import { Pantalla, Titulo, Filtros, Seccion, Vacio, Nota } from '../../components/ui';
import TarjetaViajeEmpresa from '../../components/empresa/TarjetaViajeEmpresa';

const FILTROS = [
  { id: 'activos', titulo: 'Activos' },
  { id: 'en_curso', titulo: 'En curso' },
  { id: 'historial', titulo: 'Terminados' },
];
const EVENTOS = ['viaje:asignado', 'serie:asignada', 'viaje:editado', 'viaje:confirmado', 'viaje:rechazado', 'viaje:iniciado', 'viaje:estado_cambiado', 'viaje:finalizado', 'viaje:cancelado', 'viaje:vencido'];
const VACIOS = {
  activos: ['No hay viajes por hacer', 'Los que cargues aparecen acá hasta que terminan.'],
  en_curso: ['Ningún viaje en curso', 'Cuando un conductor inicia un viaje en el origen, lo seguís desde acá.'],
  historial: ['Todavía no terminó ningún viaje', 'Acá quedan los entregados, rechazados, vencidos y cancelados.'],
};

// «Hoy, jue 22 oct» · «Mañana, vie 23 oct» · «Ayer, mié 21 oct» · «Lun 26 oct»
function tituloDia(iso) {
  const d = new Date(iso);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const n = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - hoy) / 86400000);
  const dia = diaCorto(d);
  if (n === 0) return `Hoy, ${dia}`;
  if (n === 1) return `Mañana, ${dia}`;
  if (n === -1) return `Ayer, ${dia}`;
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}`;
}

// Viajes de la empresa por día, con filtros. Los de un viaje repetido llevan
// la marca de su frecuencia.
export default function ViajesScreen({ navigation }) {
  const { colors } = useTheme();
  const { idOrg } = useEmpresa();
  const [filtro, setFiltro] = useState('activos');
  const [viajes, setViajes] = useState(null);
  const [series, setSeries] = useState({});
  const [error, setError] = useState('');
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async (f = filtro) => {
    try {
      setViajes(await listarViajes(idOrg, { grupo: f }));
      setError('');
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos cargar los viajes. Tirá para abajo para reintentar.'));
    }
  }, [idOrg, filtro]);

  useFocusEffect(useCallback(() => {
    cargar();
    listarSeries(idOrg).then((l) => setSeries(Object.fromEntries(l.map((x) => [x.id_serie, etiquetaFrecuencia(x)])))).catch(() => {});
  }, [cargar, idOrg]));
  useEnVivo(EVENTOS, () => cargar());

  const cambiar = (f) => { setFiltro(f); setViajes(null); cargar(f); };
  const refrescar = async () => { setRefrescando(true); await cargar(); setRefrescando(false); };

  // Activos y en curso del más cercano al más lejano; terminados al revés
  const orden = filtro === 'historial' ? -1 : 1;
  const lista = [...(viajes ?? [])].sort((a, b) => orden * (new Date(a.fecha_programada) - new Date(b.fecha_programada)));
  const dias = [];
  lista.forEach((v) => {
    const t = tituloDia(v.fecha_programada);
    const g = dias.find((x) => x.titulo === t);
    if (g) g.viajes.push(v); else dias.push({ titulo: t, viajes: [v] });
  });

  return (
    <Pantalla edges={['top']} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.accent} />}>
      <Titulo style={{ marginTop: 12 }}>Viajes</Titulo>
      <Filtros opciones={FILTROS} valor={filtro} onCambiar={cambiar} style={{ marginTop: 14 }} />
      {error ? <Nota tipo="error">{error}</Nota> : null}
      {viajes === null && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}
      {viajes && !viajes.length ? <Vacio icono="format-list-bulleted" titulo={VACIOS[filtro][0]} texto={VACIOS[filtro][1]} /> : null}
      {dias.map((d) => (
        <Seccion key={d.titulo} titulo={d.titulo} nota={`${d.viajes.length} ${d.viajes.length === 1 ? 'viaje' : 'viajes'}`}>
          <View style={s.grupo}>
            {d.viajes.map((v) => (
              <TarjetaViajeEmpresa key={v.id_viaje} viaje={v} marcaSerie={v.id_serie ? series[v.id_serie] : null} onPress={() => navigation.navigate('Viaje', { id: v.id_viaje })} />
            ))}
          </View>
        </Seccion>
      ))}
    </Pantalla>
  );
}

const s = StyleSheet.create({ grupo: { gap: 10 } });
