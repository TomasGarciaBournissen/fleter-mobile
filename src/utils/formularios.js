// Formato y validación de los campos de alta. Solo presentación: el backend
// vuelve a validar y normaliza (CUIT sin guiones, código sin guion, etc.).

export const soloDigitos = (v = '') => v.replace(/\D/g, '');

// 30512774 → 30.512.774
export function formatearDni(v = '') {
  const d = soloDigitos(v).slice(0, 9);
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// 30712345671 → 30-71234567-1
export function formatearCuit(v = '') {
  const d = soloDigitos(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

// Código de invitación: 10 caracteres alfanuméricos, mostrados XXXXX-XXXXX
export function limpiarCodigo(v = '') {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}
export function formatearCodigo(v = '') {
  const c = limpiarCodigo(v);
  return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
}

// Patente: AE421KL → AE 421 KL · ABC123 → ABC 123
export function formatearPatente(v = '') {
  const p = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  if (/^[A-Z]{2}\d{3}[A-Z]{1,2}$/.test(p)) return `${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;
  if (/^[A-Z]{3}\d{1,3}$/.test(p)) return `${p.slice(0, 3)} ${p.slice(3)}`;
  return p;
}
export const limpiarPatente = (v = '') => v.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const emailValido = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// 31/12/2027
export function fechaCorta(d) {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
