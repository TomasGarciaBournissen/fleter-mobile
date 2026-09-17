// Sistema de diseño v2 "Fleter" — referencia completa en UXUI.md.
// Dos paletas (claro/oscuro) con los mismos keys; el tema activo lo sirve
// ThemeContext (src/context/ThemeContext.js). Ningún hexadecimal fuera de acá.
//
// Cada paleta expone los nombres v2 (bg, ink, accent, line…) y además los
// alias legacy de v1 (background, surface1, textPrimary, primary…) para que
// el código existente siga funcionando mientras se migra.

const light = {
  // Fondos y superficies
  bg:            '#FAF7F1',
  surface:       '#FFFFFF',
  surface2:      '#F2EDE2',
  surface3:      '#ECE9E1',
  line:          '#E8E4DA',
  lineStrong:    '#D9D3C5',

  // Tinta
  ink:           '#1B1A17',
  ink2:          '#3F3B34',
  ink3:          '#665F50',
  ink4:          '#B8B2A2',   // SOLO deshabilitado, nunca texto informativo
  onInk:         '#FFFFFF',

  // Naranja — no se toca. Texto chico sobre naranja va en tinta (onAccent).
  accent:        '#E85D2A',
  accentPress:   '#D2521F',
  accentInk:     '#A63B14',   // naranja como TEXTO sobre fondo claro (6.4:1)
  accentSoft:    '#FBE4D6',
  accentSofter:  '#FFF1E7',
  onAccent:      '#1B1A17',
  onAccentLarge: '#FFFFFF',   // solo texto grande: ≥19px bold o ≥24px regular

  // Estados (base / ink / soft)
  success:       '#2F8F4E',
  successInk:    '#1F6B39',
  successSoft:   '#DCEFD8',
  warning:       '#C98A12',
  warningInk:    '#8A5E0B',
  warningSoft:   '#FBEFCE',
  error:         '#B83232',
  errorInk:      '#9C2626',
  errorSoft:     '#F5D9D4',
  info:          '#2E6FB7',
  infoInk:       '#22578F',
  infoSoft:      '#D8E4F2',

  // Sistema
  barStyle:      'dark-content',
};

const dark = {
  bg:            '#141310',
  surface:       '#1C1A16',
  surface2:      '#23201B',
  surface3:      '#2B2822',
  line:          '#2E2A24',
  lineStrong:    '#3B362E',

  ink:           '#F4F0E7',
  ink2:          '#CBC5B8',
  ink3:          '#9E978A',
  ink4:          '#6B655A',
  onInk:         '#141310',

  accent:        '#E85D2A',
  accentPress:   '#D2521F',
  accentInk:     '#F0865A',
  accentSoft:    '#3B2116',
  accentSofter:  '#2A1B13',
  onAccent:      '#1B1A17',
  onAccentLarge: '#FFFFFF',

  success:       '#4DB36E',
  successInk:    '#7BD397',
  successSoft:   '#16301F',
  warning:       '#D9A23A',
  warningInk:    '#E9BC5C',
  warningSoft:   '#33260A',
  error:         '#D95454',
  errorInk:      '#F09090',
  errorSoft:     '#3A1717',
  info:          '#5C93D6',
  infoInk:       '#8DB8EC',
  infoSoft:      '#14243A',

  barStyle:      'light-content',
};

// Alias legacy v1 → tokens v2 (mismos keys en ambas paletas)
function conAliases(p) {
  return {
    ...p,
    background:    p.bg,
    surface1:      p.surface,
    primary:       p.accent,
    primaryDark:   p.accentPress,
    nightHeader:   p.ink,
    textPrimary:   p.ink,
    textSecondary: p.ink2,
    textHint:      p.ink3,
  };
}

export const palettes = {
  light: conAliases(light),
  dark:  conAliases(dark),
};

// Export legacy: paleta clara estática. Solo para código todavía no migrado
// a useTheme(); las pantallas migradas reciben `colors` del ThemeContext.
export const colors = palettes.light;

// Tipografías (cargadas en App.js con expo-font / @expo-google-fonts)
// Roles fijos: display = precios/KPI/títulos · ui = todo lo demás ·
// mono = IDs de viaje, patentes, horas · accent = SOLO eyebrows y eslogan.
export const fonts = {
  display:    'ArchivoBlack_400Regular',
  ui:         'Manrope_400Regular',
  uiMedium:   'Manrope_500Medium',
  uiSemiBold: 'Manrope_600SemiBold',
  uiBold:     'Manrope_700Bold',
  uiExtraBold:'Manrope_800ExtraBold',
  mono:       'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  accent:     'JosefinSans_600SemiBold',
};

export const fontSize = {
  h1:      28,
  h2:      20,
  h3:      16,
  body:    14,
  caption: 12,
  // Escala v2 adicional
  displayXl: 44,   // precio del viaje
  displayLg: 32,   // KPI
  label:     11.5, // labels 600 uppercase, tracking 0.06em
  badge:     11,   // badges 700
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
};

// v2: sm 6 (inputs, chips, badges) · md 10 (cards, botones) · lg 14 (sheets)
export const radius = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  24,
  full: 999,
};
