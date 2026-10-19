// Traduce errores de Firebase y del backend a mensajes en voseo que dicen
// qué pasó y qué hacer. Nunca muestra códigos técnicos.

const FIREBASE = {
  'auth/invalid-credential': 'El email o la contraseña no coinciden. Revisalos, o recuperá la contraseña si no te acordás.',
  'auth/wrong-password': 'El email o la contraseña no coinciden. Revisalos, o recuperá la contraseña si no te acordás.',
  'auth/user-not-found': 'El email o la contraseña no coinciden. Revisalos, o recuperá la contraseña si no te acordás.',
  'auth/invalid-email': 'Ese email no tiene un formato válido.',
  'auth/too-many-requests': 'Hubo demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisá internet y probá de nuevo.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Escribinos para revisarla.',
};

// Mensajes del backend (API.md) → texto para la persona
const BACKEND = {
  'El email ya esta registrado': 'Ya hay una cuenta con ese email. Entrá con ella o usá otro.',
  'El DNI ya esta registrado': 'Ya hay una cuenta con ese DNI.',
  'La patente ya esta registrada': 'Esa patente ya está cargada en otra cuenta.',
  'Codigo invalido': 'El código no es válido. Puede haber vencido o ya se usó: pedí uno nuevo.',
  'Ya perteneces a una PyME': 'Tu cuenta ya está en una empresa.',
  'Ya estas vinculado a esta PyME': 'Ya trabajás con esta empresa.',
  'Demasiados intentos. Proba de nuevo en unos minutos': 'Hubo demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'Usuario no registrado': 'No hay una cuenta de Fleter con ese usuario. Creá una cuenta primero.',
};

export function mensajeDeError(err, porDefecto = 'Algo salió mal. Probá de nuevo en unos segundos.') {
  if (!err) return porDefecto;
  if (err.code && FIREBASE[err.code]) return FIREBASE[err.code];
  const api = err?.response?.data?.error;
  if (api) {
    if (BACKEND[api]) return BACKEND[api];
    if (/cuit/i.test(api) && /registrad|existe|uso/i.test(api)) return 'Ya hay una empresa registrada con ese CUIT. Pedile a alguien de tu empresa un código para sumarte.';
    if (/cuit/i.test(api)) return 'Revisá el CUIT: tiene que tener 11 números.';
    if (err.response.status === 400) return api; // validaciones del backend, ya en castellano
  }
  if (err.message === 'Network Error') return 'No hay conexión con Fleter. Revisá internet y probá de nuevo.';
  return porDefecto;
}
