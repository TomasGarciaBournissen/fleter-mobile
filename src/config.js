// Modo desarrollo: sin Firebase ni backend, con usuarios de prueba.
// Se apaga con EXPO_PUBLIC_DEV_MODE=false en .env.
export const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE !== 'false';
