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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 20,
  },
  button: {
    shadowColor: Colors.coral,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 16,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
