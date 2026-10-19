import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useThemedStyles } from '../../context/ThemeContext';
import { DEV_MODE } from '../../config';
import { fonts } from '../../theme';
import { loginEmail } from '../../services/auth';
import { useGoogleLogin, GOOGLE_CONFIGURADO } from '../../services/google';
import { mensajeDeError } from '../../utils/errores';
import { emailValido } from '../../utils/formularios';
import { Pantalla, Marca, Titulo, Campo, Boton, Separador, Enlace, Nota } from '../../components/ui';
import GoogleLogo from '../../components/GoogleLogo';

export default function LoginScreen({ navigation }) {
  const s = useThemedStyles(createStyles);
  const { mockLogin, errorSesion, setErrorSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const refContrasena = useRef(null);

  const google = useGoogleLogin({ onError: (e) => setError(mensajeDeError(e)) });
  const errorVisible = error || errorSesion;

  const entrar = async () => {
    setError(''); setErrorSesion('');
    if (DEV_MODE) {
      // Sin Firebase: un email con «conductor» o «martin» entra como conductor
      mockLogin(/conductor|martin/i.test(email) ? 'CONDUCTOR' : 'CLIENTE');
      return;
    }
    if (!emailValido(email) || !contrasena) {
      setError('Completá tu email y tu contraseña.');
      return;
    }
    setCargando(true);
    try {
      await loginEmail(email.trim().toLowerCase(), contrasena);
      // AuthContext detecta la sesión y RootNavigator cambia de stack
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  };

  const entrarConGoogle = () => {
    setError(''); setErrorSesion('');
    if (!GOOGLE_CONFIGURADO) {
      setError('Entrar con Google todavía no está disponible en esta versión. Entrá con tu email.');
      return;
    }
    google.entrar();
  };

  return (
    <Pantalla
      pie={
        <>
          <Boton titulo="Entrar" onPress={entrar} cargando={cargando} />
          <Separador />
          <Boton
            titulo="Entrar con Google"
            variante="borde"
            icono={<GoogleLogo size={20} />}
            cargando={google.cargando}
            onPress={entrarConGoogle}
          />
          <Text style={s.crear}>
            ¿Todavía no tenés cuenta? <Enlace onPress={() => navigation.navigate('TipoCuenta')}>Creala</Enlace>
          </Text>
        </>
      }
    >
      <Marca style={{ marginTop: 20 }} />
      <Titulo style={{ marginTop: 40 }}>Entrá a tu cuenta</Titulo>

      <Campo
        label="Email"
        value={email}
        onChangeText={(t) => { setEmail(t); setError(''); }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => refContrasena.current?.focus()}
        error={!!errorVisible}
      />
      <Campo
        ref={refContrasena}
        label="Contraseña"
        value={contrasena}
        onChangeText={(t) => { setContrasena(t); setError(''); }}
        secreto
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={entrar}
        error={errorVisible}
      />
      <View style={s.olvide}>
        <Enlace style={{ fontSize: 13 }} onPress={() => navigation.navigate('RecuperarContrasena', { email })}>Olvidé mi contraseña</Enlace>
      </View>
      {DEV_MODE ? <Nota tipo="info">Modo desarrollo: entrás sin contraseña. Con «conductor» en el email entrás como conductor.</Nota> : null}
    </Pantalla>
  );
}

const createStyles = (c) => StyleSheet.create({
  olvide: { alignItems: 'flex-end', marginTop: 12 },
  crear:  { textAlign: 'center', fontFamily: fonts.ui, fontSize: 14, color: c.ink2, marginTop: 6 },
});
