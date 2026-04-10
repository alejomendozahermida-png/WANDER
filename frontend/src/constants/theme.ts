export const Colors = {
  // Backgrounds
  background: '#0D0D0D',
  surface: '#161616',
  surfaceMid: '#1E1E1E',
  surfaceHigh: '#2A2A2A',
  
  // Brand colors
  coral: '#FF4D4D',
  sand: '#E8D5B0',
  teal: '#60DAC4',
  
  // Text colors
  onSurface: '#E8E5E4',
  onSurfaceDim: '#9E9A98',
  
  // Utility
  white: '#FFFFFF',
  black: '#000000',
  error: '#FF4D4D',
  success: '#60DAC4',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 100,
};

export const Typography = {
  // Display (city names, hero) - Playfair Display Bold Italic
  display: {
    fontSize: 64,
    fontWeight: '700' as const,
    fontStyle: 'italic' as const,
    letterSpacing: -1,
  },
  displayMedium: {
    fontSize: 52,
    fontWeight: '700' as const,
    fontStyle: 'italic' as const,
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontSize: 38,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  
  // Headlines - Playfair Display Bold
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  
  // Body - Manrope
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  
  // Labels - Manrope ExtraBold, uppercase
  label: {
    fontSize: 12,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
  },
};

export const Shadows = {
  card: {
    boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.4)',
    elevation: 16,
  },
  button: {
    boxShadow: '0px 8px 24px rgba(255, 77, 77, 0.35)',
    elevation: 12,
  },
  small: {
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.25)',
    elevation: 4,
  },
  glow: {
    boxShadow: '0px 0px 20px rgba(255, 77, 77, 0.2)',
    elevation: 8,
  },
};
