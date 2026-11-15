# Marketplace (guardado)

Código de la versión anterior de Fleter (fleteros que aceptaban ofertas, gerentes de empresas de
transporte). Se sacó de `src/` el 15 nov 2026 por decisión del dueño: queda guardado, no borrado.

No se compila: Metro solo empaqueta lo que `App.js` importa y nada de la app actual importa esta carpeta.
Las rutas son las originales (`legacy/marketplace/src/...` = `src/...`), así que volver a ponerlo es:

```bash
git mv legacy/marketplace/src/screens/fletero src/screens/fletero   # y lo mismo con cada carpeta o archivo
```

y volver a montar el stack en `src/navigation/RootNavigator.js` (`FLETERO` → `FleteroStack`,
`GERENTE` → `GerenteStack`). El último commit con todo en `src/` es `a8097cb`.

Contenido: pantallas `cliente/`, `fletero/`, `gerente/`, `auth/_marketplace/`; stacks `ClienteStack`,
`FleteroStack`, `GerenteStack`; `hooks/useMiEmpresa.js`, `utils/format.js`, `utils/vehiculo.js`,
`components/LocationPickerModal.js`.
