import { browserLocalPersistence } from 'firebase/auth';

// En web la sesión queda en el almacenamiento del navegador.
export const persistenciaSesion = browserLocalPersistence;
