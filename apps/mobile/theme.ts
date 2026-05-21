// theme.ts — Seção 8 da documentação (Material Design 3 / Mint Green Pastel)

export const theme = {
  colors: {
    primary:            '#4DB896',
    primaryLight:       '#A8DFC9',
    primarySubtle:      '#E8F7F2',
    secondary:          '#7EC8A8',
    surface:            '#FFFFFF',
    background:         '#F4FBF8',
    onPrimary:          '#FFFFFF',
    onSurface:          '#1A2E26',
    onSurfaceVariant:   '#4A7264',
    outline:            '#C5E4D8',
    success:            '#3DAA80',
    successLight:       '#E8F7F2',
    warning:            '#F5A623',
    warningLight:       '#FFF8EC',
    error:              '#E57373',
    errorLight:         '#FDEAEA',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    caption: 11,
    body: 14,
    bodyLarge: 16,
    title: 18,
    titleLarge: 22,
    amount: 20,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export type Theme = typeof theme;
