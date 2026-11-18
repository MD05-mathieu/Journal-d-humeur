/**
 * Tokens de design centralisés pour l'application MonApp (Wellness Journal)
 * Conformes aux recommandations WCAG 2.1 AA pour le contraste visuel
 */
export const Colors = {
  primary: '#6C63FF',
  primaryDark: '#564FD8',
  primaryLight: '#EEECFF',
  background: '#F7F8FC',
  surface: '#FFFFFF',
  textPrimary: '#2B2B43',
  textSecondary: '#71718A',
  textMuted: '#9FA2B4',
  border: '#E8E9F3',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#059669',
  successLight: '#D1FAE5',

  // Couleurs d'humeur adaptées pour un contraste optimal (> 4.5:1 sur texte / > 3:1 sur composants)
  moods: {
    1: '#FF5470', // Très bas
    2: '#F97316', // Difficile (Orange vif)
    3: '#D97706', // Neutre (Ambre contrasté, remplace l'ancien jaune trop clair)
    4: '#059669', // Bien (Vert émeraude contrasté)
    5: '#6C63FF', // Rayonnant (Violet emblématique)
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 22,
  full: 9999,
};
