// Shared UI utilities and tokens
export const BRAND_COLORS = {
  primary: '#10b981',
  primaryLight: '#ecfdf5',
  primaryDark: '#065f46',
  accent: '#6ee7b7',
  danger: '#ef4444',
  warning: '#f59e0b',
  surface: '#ffffff',
  background: '#f4f4f5',
  text: {
    primary: '#18181b',
    secondary: '#71717a',
    muted: '#a1a1aa',
  },
  border: '#e4e4e7',
} as const;

export const SCORE_COLOR = (score: number): string => {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#f59e0b'; // yellow
  return '#ef4444'; // red
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
