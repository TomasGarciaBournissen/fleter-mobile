import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { loginGoogle } from './auth';

WebBrowser.maybeCompleteAuthSession();

// IDs de OAuth del proyecto de Google Cloud vinculado a Firebase.
// Sin ellos el botón avisa que Google todavía no está configurado.
const IDS = {
  webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};
export const GOOGLE_CONFIGURADO = !!IDS.webClientId;

// Abre el selector de cuentas de Google y entra a Firebase con el idToken.
// Una cuenta de Google sin registro en Fleter termina en 404 en /api/auth/login:
// AuthContext lo muestra como error de sesión.
export function useGoogleLogin({ onError }) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    GOOGLE_CONFIGURADO ? IDS : { webClientId: 'sin-configurar' },
  );
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!response) return;
    if (response.type !== 'success') { setCargando(false); return; }
    loginGoogle(response.params.id_token)
      .catch((e) => onError?.(e))
      .finally(() => setCargando(false));
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps

  const entrar = async () => {
    setCargando(true);
    try {
      await promptAsync();
    } catch (e) {
      setCargando(false);
      onError?.(e);
    }
  };

  return { entrar, cargando, listo: GOOGLE_CONFIGURADO && !!request };
}
