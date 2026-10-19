import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useThemedStyles } from '../../context/ThemeContext';
import { DEV_MODE } from '../../config';
import { fonts } from '../../theme';
import { registroCliente } from '../../services/auth';
import { mensajeDeError } from '../../utils/errores';
import { Pantalla, Pasos, Titulo, Boton, Nota, Enlace } from '../../components/ui';
import CamposPersonales from './CamposPersonales';
import useDatosPersonales from './useDatosPersonales';

// Paso 1 de 2 del alta de empresa: la cuenta de la persona. Sin CUIT ni
// empresa acá (son campos legacy del endpoint). Al crearla, Firebase abre la
// sesión y RootNavigator lleva al paso 2 («¿Tu empresa ya usa Fleter?»).
export default function RegistroEmpresaScreen({ navigation }) {
  const s = useThemedStyles(createStyles);
  const { mockLogin } = useAuth();
  const form = useDatosPersonales();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const crear = async () => {
    setError('');
    if (!form.validar()) return;
    setCargando(true);
    try {
      await registroCliente(form.body());
      if (DEV_MODE) mockLogin('CLIENTE_SIN_EMPRESA');
    } catch (err) {
      const msg = mensajeDeError(err);
      if (/email/i.test(msg)) form.setErrores((e) => ({ ...e, email: msg }));
      else if (/DNI/.test(msg)) form.setErrores((e) => ({ ...e, dni: msg }));
      else setError(msg);
      setCargando(false);
    }
  };

  return (
    <Pantalla
      onVolver={() => navigation.goBack()}
      pieConLinea
      pie={
        <>
          <Boton titulo="Crear mi cuenta" onPress={crear} cargando={cargando} />
          <Text style={s.legal}>
            Al crearla aceptás los <Enlace style={s.legalEnlace}>términos</Enlace> y la <Enlace style={s.legalEnlace}>política de privacidad</Enlace>.
          </Text>
        </>
      }
    >
      <Pasos actual={1} total={2} etiqueta="tus datos" />
      <Titulo>Creá tu cuenta</Titulo>
      <CamposPersonales form={form} />
      {error ? <Nota tipo="error">{error}</Nota> : null}
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  legal:       { textAlign: 'center', fontFamily: fonts.ui, fontSize: 12, lineHeight: 17, color: c.ink3 },
  legalEnlace: { fontSize: 12 },
});
