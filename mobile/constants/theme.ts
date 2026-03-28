export const Colors = {
  primary: '#0891B2',
  darkNavy: '#0F2B46',
  amber: '#F59E0B',
  success: '#16A34A',
  tealLight: '#E0F7FA',
  surfaceSecondary: '#F7F8FA',
  surfacePrimary: '#FFFFFF',
  border: '#E5E7EB',
  foreground: '#1A1A1A',
  foregroundSecondary: '#555555',
  foregroundMuted: '#888888',
  error: '#DC2626',
} as const;

export const FontSize = {
  pageTitle: 22,
  sectionHeader: 18,
  cardTitle: 16,
  body: 14,
  caption: 12,
  priceDisplay: 18,
  priceLarge: 24,
  button: 16,
} as const;

export const FontWeight = {
  regular: '400' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const Radius = {
  tag: 8,
  button: 12,
  card: 16,
  full: 9999,
} as const;
