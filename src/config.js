// Modo desarrollo: sin Firebase ni backend, con usuarios de prueba.
// Apagado por defecto: solo se prende con EXPO_PUBLIC_DEV_MODE=true en .env,
// así un build sin .env nunca sale con datos de prueba.
export const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
