import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { fonts } from '../../theme';
import { recuperarContrasena } from '../../services/auth';
import { mensajeDeError } from '../../utils/errores';
import { emailValido } from '../../utils/formularios';
import { Pantalla, Titulo, Bajada, Campo, Boton, Nota } from '../../components/ui';

const ESPERA_REENVIO = 60; // segundos, para no llenar la casilla

export default function RecuperarContrasenaScreen({ navigation, route }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return undefined;
    const t = setTimeout(() => setEspera((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const mandar = async () => {
    setError('');
    if (!emailValido(email)) { setError('Escribí el email con el que creaste la cuenta.'); return; }
    setCargando(true);
    try {
      await recuperarContrasena(email.trim().toLowerCase());
      setEnviado(true);
      setEspera(ESPERA_REENVIO);
    } catch (err) {
      // Firebase no dice si el email existe; solo mostramos errores de formato o de red
      if (err?.code === 'auth/user-not-found') { setEnviado(true); setEspera(ESPERA_REENVIO); }
      else setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  };

  const reloj = `${Math.floor(espera / 60)}:${String(espera % 60).padStart(2, '0')}`;

  if (enviado) {
    return (
      <Pantalla
        onVolver={() => setEnviado(false)}
        pie={
          <Boton
            deshabilitado={espera > 0}
            cargando={cargando}
            onPress={mandar}
            titulo={espera > 0 ? `Volver a enviar en ${reloj}` : 'Volver a enviar'}
          />
        }
      >
        <Titulo>Revisá tu email</Titulo>
        <Bajada>
          Mandamos el link a <Text style={{ fontFamily: fonts.uiBold, color: colors.ink }}>{email.trim()}</Text>. Vence en 1 hora.
        </Bajada>
        <Nota>Si no te llega en unos minutos, buscalo en spam o promociones.</Nota>
      </Pantalla>
    );
  }

  return (
    <Pantalla onVolver={() => navigation.goBack()} pie={<Boton titulo="Mandar link" onPress={mandar} cargando={cargando} />}>
      <Titulo>Recuperá tu contraseña</Titulo>
      <Bajada>Te mandamos un link a tu email para que crees una nueva.</Bajada>
      <Campo
        label="Email de tu cuenta"
        value={email}
        onChangeText={(t) => { setEmail(t); setError(''); }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        returnKeyType="send"
        onSubmitEditing={mandar}
        error={error}
        style={{ marginTop: 28 }}
      />
    </Pantalla>
  );
}
