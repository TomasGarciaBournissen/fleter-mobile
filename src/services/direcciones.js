import { DEV_MODE } from '../config';

// Búsqueda de direcciones con Google Places (API nueva, v1), la misma que usaba
// LocationPickerModal. Devuelve { direccion, lat, lng } listo para una parada.
// Sin clave en modo desarrollo, busca en una lista de direcciones de ejemplo.
const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

const EJEMPLOS = [
  { direccion: 'Av. Mitre 1450, Vicente López', lat: -34.5266, lng: -58.4728 },
  { direccion: 'Av. Mitre 1450, Avellaneda', lat: -34.6620, lng: -58.3650 },
  { direccion: 'Av. Cabildo 2040, Belgrano, CABA', lat: -34.5610, lng: -58.4560 },
  { direccion: 'Av. Maipú 2100, Olivos', lat: -34.5100, lng: -58.4890 },
  { direccion: 'Av. Centenario 200, San Isidro', lat: -34.4708, lng: -58.5129 },
  { direccion: 'Av. Rivadavia 6800, Flores, CABA', lat: -34.6294, lng: -58.4633 },
  { direccion: 'Av. Santa Fe 3200, Palermo, CABA', lat: -34.5880, lng: -58.4110 },
  { direccion: 'Panamericana km 26, Don Torcuato', lat: -34.4920, lng: -58.6280 },
];

export const BUSQUEDA_DISPONIBLE = DEV_MODE || !!PLACES_KEY;

// Sugerencias para lo que se escribió: [{ id, titulo, detalle }]
export async function buscarDirecciones(texto) {
  if (!PLACES_KEY) {
    if (!DEV_MODE) throw new Error('Falta EXPO_PUBLIC_GOOGLE_PLACES_KEY');
    const q = texto.toLowerCase();
    return EJEMPLOS.filter((e) => e.direccion.toLowerCase().includes(q)).map((e, i) => {
      const [titulo, ...resto] = e.direccion.split(',');
      return { id: `dev-${i}`, titulo: titulo.trim(), detalle: resto.join(',').trim(), ubicacion: e };
    });
  }
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': PLACES_KEY },
    body: JSON.stringify({ input: texto, includedRegionCodes: ['ar'], languageCode: 'es' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return (json.suggestions ?? []).filter((s) => s.placePrediction).map((s) => ({
    id: s.placePrediction.placeId,
    titulo: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text?.text ?? '',
    detalle: s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
  }));
}

// Coordenadas de una sugerencia elegida
export async function resolverDireccion(sugerencia) {
  if (sugerencia.ubicacion) return sugerencia.ubicacion;
  const res = await fetch(`https://places.googleapis.com/v1/places/${sugerencia.id}`, {
    headers: { 'X-Goog-Api-Key': PLACES_KEY, 'X-Goog-FieldMask': 'location,formattedAddress' },
  });
  const json = await res.json();
  if (!res.ok || !json.location) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return {
    direccion: json.formattedAddress ?? [sugerencia.titulo, sugerencia.detalle].filter(Boolean).join(', '),
    lat: json.location.latitude,
    lng: json.location.longitude,
  };
}
