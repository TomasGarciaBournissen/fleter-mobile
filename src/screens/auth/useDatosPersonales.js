import { useState } from 'react';
import { emailValido, formatearDni, soloDigitos } from '../../utils/formularios';

// Campos y validación comunes al alta de usuario de empresa y de conductor.
// Devuelve el estado del formulario, los errores por campo y el body para la API.
export default function useDatosPersonales(inicial = {}) {
  const [datos, setDatos] = useState({ nombre: '', apellido: '', dni: '', email: '', telefono: '', contrasena: '', ...inicial });
  const [errores, setErrores] = useState({});

  const cambiar = (campo) => (valor) => {
    setDatos((d) => ({ ...d, [campo]: campo === 'dni' ? formatearDni(valor) : valor }));
    setErrores((e) => ({ ...e, [campo]: '' }));
  };

  const validar = () => {
    const e = {};
    if (!datos.nombre.trim()) e.nombre = 'Escribí tu nombre.';
    if (!datos.apellido.trim()) e.apellido = 'Escribí tu apellido.';
    const dni = soloDigitos(datos.dni);
    if (dni.length < 7 || dni.length > 9) e.dni = 'El DNI tiene entre 7 y 9 números.';
    if (!emailValido(datos.email)) e.email = 'Revisá el email: falta la @ o el dominio.';
    if (datos.contrasena.length < 6) e.contrasena = 'La contraseña necesita al menos 6 caracteres.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const body = () => {
    const b = {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      dni: soloDigitos(datos.dni),
      email: datos.email.trim().toLowerCase(),
      contrasena: datos.contrasena,
    };
    if (datos.telefono.trim()) b.telefono = datos.telefono.trim();
    return b;
  };

  return { datos, errores, setErrores, cambiar, validar, body };
}
