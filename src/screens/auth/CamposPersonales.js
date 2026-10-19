import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Campo } from '../../components/ui';

// Los seis campos de datos personales, en el mismo orden para los dos roles.
export default function CamposPersonales({ form, hintTelefono }) {
  const { datos, errores, cambiar } = form;
  const refs = { apellido: useRef(null), dni: useRef(null), telefono: useRef(null), email: useRef(null), contrasena: useRef(null) };
  const siguiente = (k) => () => refs[k].current?.focus();

  return (
    <>
      <View style={s.fila}>
        <Campo style={s.mitad} label="Nombre" value={datos.nombre} onChangeText={cambiar('nombre')} error={errores.nombre}
          autoComplete="given-name" textContentType="givenName" returnKeyType="next" onSubmitEditing={siguiente('apellido')} />
        <Campo style={s.mitad} ref={refs.apellido} label="Apellido" value={datos.apellido} onChangeText={cambiar('apellido')} error={errores.apellido}
          autoComplete="family-name" textContentType="familyName" returnKeyType="next" onSubmitEditing={siguiente('dni')} />
      </View>
      <Campo ref={refs.dni} label="DNI" mono value={datos.dni} onChangeText={cambiar('dni')} error={errores.dni}
        keyboardType="number-pad" returnKeyType="next" onSubmitEditing={siguiente('telefono')} />
      <Campo ref={refs.telefono} label="Teléfono" opcional mono value={datos.telefono} onChangeText={cambiar('telefono')} hint={hintTelefono}
        keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" returnKeyType="next" onSubmitEditing={siguiente('email')} />
      <Campo ref={refs.email} label="Email" value={datos.email} onChangeText={cambiar('email')} error={errores.email}
        keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
        returnKeyType="next" onSubmitEditing={siguiente('contrasena')} />
      <Campo ref={refs.contrasena} label="Contraseña" secreto value={datos.contrasena} onChangeText={cambiar('contrasena')}
        error={errores.contrasena} hint="Mínimo 6 caracteres." autoComplete="new-password" textContentType="newPassword" />
    </>
  );
}

const s = StyleSheet.create({
  fila:  { flexDirection: 'row', gap: 12 },
  mitad: { flex: 1, minWidth: 0 },
});
