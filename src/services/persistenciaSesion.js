import * as SecureStore from 'expo-secure-store';
import { getReactNativePersistence } from 'firebase/auth';

// La sesión de Firebase (incluye el refresh token) se guarda en el llavero del
// sistema (Keychain en iOS, Keystore en Android), nunca en AsyncStorage.
// SecureStore acepta claves de [A-Za-z0-9._-] y valores de hasta ~2 KB, así que
// la clave se normaliza y el valor se parte en pedazos.
const TAM_PEDAZO = 1800;
const clave = (k) => k.replace(/[^A-Za-z0-9._-]/g, '_');

const almacenSeguro = {
  async getItem(k) {
    const base = clave(k);
    const cant = await SecureStore.getItemAsync(`${base}.n`);
    if (cant == null) return null;
    let valor = '';
    for (let i = 0; i < Number(cant); i += 1) {
      const pedazo = await SecureStore.getItemAsync(`${base}.${i}`);
      if (pedazo == null) return null;
      valor += pedazo;
    }
    return valor;
  },
  async setItem(k, valor) {
    const base = clave(k);
    await this.removeItem(k);
    const pedazos = Math.max(1, Math.ceil(valor.length / TAM_PEDAZO));
    for (let i = 0; i < pedazos; i += 1) {
      await SecureStore.setItemAsync(`${base}.${i}`, valor.slice(i * TAM_PEDAZO, (i + 1) * TAM_PEDAZO));
    }
    await SecureStore.setItemAsync(`${base}.n`, String(pedazos));
  },
  async removeItem(k) {
    const base = clave(k);
    const cant = await SecureStore.getItemAsync(`${base}.n`);
    await SecureStore.deleteItemAsync(`${base}.n`);
    for (let i = 0; i < Number(cant || 0); i += 1) {
      await SecureStore.deleteItemAsync(`${base}.${i}`);
    }
  },
};

export const persistenciaSesion = getReactNativePersistence(almacenSeguro);
