import { useColorScheme } from 'react-native';

export type AppColors = {
  background: string;
  surface: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  danger: string;
  warning: string;
  inputBg: string;
  tabBar: string;
  tabBarBorder: string;
  scoreGreen: string;
  scoreYellow: string;
  scoreRed: string;
};

export const lightColors: AppColors = {
  background: '#f4f4f5',
  surface: '#ffffff',
  primary: '#10b981',
  primaryLight: '#ecfdf5',
  primaryDark: '#065f46',
  accent: '#6ee7b7',
  text: '#18181b',
  textSecondary: '#71717a',
  textMuted: '#a1a1aa',
  border: '#e4e4e7',
  danger: '#ef4444',
  warning: '#f59e0b',
  inputBg: '#fafafa',
  tabBar: '#ffffff',
  tabBarBorder: '#f4f4f5',
  scoreGreen: '#10b981',
  scoreYellow: '#f59e0b',
  scoreRed: '#ef4444',
};

export const darkColors: AppColors = {
  background: '#09090b',
  surface: '#18181b',
  primary: '#10b981',
  primaryLight: '#052e16',
  primaryDark: '#6ee7b7',
  accent: '#059669',
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  border: '#27272a',
  danger: '#ef4444',
  warning: '#f59e0b',
  inputBg: '#27272a',
  tabBar: '#18181b',
  tabBarBorder: '#27272a',
  scoreGreen: '#10b981',
  scoreYellow: '#f59e0b',
  scoreRed: '#ef4444',
};

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  return { colors, isDark, scheme };
}

// Score color helper
export function scoreColor(score: number, colors: AppColors): string {
  if (score >= 80) return colors.scoreGreen;
  if (score >= 60) return colors.scoreYellow;
  return colors.scoreRed;
}
