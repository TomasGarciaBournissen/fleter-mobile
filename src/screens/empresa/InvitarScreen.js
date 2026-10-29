import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Share, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { fonts } from '../../theme';
import { crearInvitacion } from '../../services/empresa';
import { diaCorto, hora } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Titulo, Bajada, Boton, Nota } from '../../components/ui';

const TEXTOS = {
  CHOFER: {
    titulo: 'Pasale este código a tu conductor',
    bajada: 'Lo carga desde su app al crear la cuenta o desde su perfil. Sirve una sola vez.',
    mensaje: (org, codigo) => `Sumate a ${org} en Fleter: bajate la app, entrá como conductor y cargá este código: ${codigo}`,
  },
  MIEMBRO: {
    titulo: 'Pasale este código a la persona de tu equipo',
    bajada: 'Lo carga en la app al crear su cuenta de empresa, con «Unirme con un código». Sirve una sola vez.',
    mensaje: (org, codigo) => `Sumate a ${org} en Fleter: creá tu cuenta de empresa y elegí «Unirme con un código»: ${codigo}`,
  },
};

// Genera un código de invitación y lo muestra una única vez: el backend solo
// guarda un hash, así que no se puede volver a ver (si se pierde, se revoca
// y se genera otro). tipo: CHOFER | MIEMBRO (este último, solo responsables).
export default function InvitarScreen({ navigation, route }) {
  const tipo = route.params?.tipo ?? 'CHOFER';
  const { colors } = useTheme();
  const s = useThemedStyles(createStyles);
  const { idOrg, organizacion } = useEmpresa();
  const [inv, setInv] = useState(null);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const t = TEXTOS[tipo];

  useEffect(() => {
    crearInvitacion(idOrg, tipo).then(setInv).catch((e) => setError(mensajeDeError(e, 'No pudimos generar el código. Probá de nuevo en unos minutos.')));
  }, [idOrg, tipo]);

  const copiar = async () => {
    await Clipboard.setStringAsync(inv.codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };
  const compartir = () => Share.share({ message: t.mensaje(organizacion?.nombre ?? 'mi empresa', inv.codigo) }).catch(() => {});

  return (
    <Pantalla onVolver={() => navigation.goBack()} pie={<Boton titulo="Listo" onPress={() => navigation.goBack()} deshabilitado={!inv && !error} />}>
      <Titulo>{t.titulo}</Titulo>
      <Bajada>{t.bajada}</Bajada>
      {error ? <Nota tipo="error">{error}</Nota> : null}
      {!inv && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}
      {inv ? (
        <>
          <View style={s.codigo} accessible accessibilityLabel={`Código ${inv.codigo.split('').join(' ')}`}>
            <Text style={s.codigoTexto} selectable>{inv.codigo}</Text>
            <Text style={s.vence}>Vence el {diaCorto(inv.fecha_vencimiento)} a las {hora(inv.fecha_vencimiento)}</Text>
          </View>
          <View style={s.botones}>
            <View style={{ flex: 1 }}>
              <Boton titulo={copiado ? 'Copiado' : 'Copiar'} variante="borde" onPress={copiar}
                icono={<MaterialCommunityIcons name={copiado ? 'check' : 'content-copy'} size={18} color={colors.ink} />} />
            </View>
            <View style={{ flex: 1 }}>
              <Boton titulo="Compartir" variante="borde" onPress={compartir}
                icono={<MaterialCommunityIcons name="share-variant-outline" size={18} color={colors.ink} />} />
            </View>
          </View>
          <Nota>Por seguridad no lo vas a poder ver de nuevo. Si se pierde, revocalo y generá otro.</Nota>
        </>
      ) : null}
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  codigo:      { marginTop: 22, borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface, paddingVertical: 22, paddingHorizontal: 16, alignItems: 'center' },
  codigoTexto: { fontFamily: fonts.monoMedium, fontSize: 30, letterSpacing: 3.6, color: c.ink },
  vence:       { fontFamily: fonts.ui, fontSize: 12, color: c.ink3, marginTop: 8 },
  botones:     { flexDirection: 'row', gap: 10, marginTop: 12 },
});
