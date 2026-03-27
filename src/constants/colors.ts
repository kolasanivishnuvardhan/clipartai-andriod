export const colors = {
  background: "#0A0A0F",
  surface: "#13131A",
  surfaceHigh: "#1E1E2A",
  accent: "#7C3AED",
  accentLight: "#A78BFA",
  accentGlow: "rgba(124, 58, 237, 0.15)",
  success: "#10B981",
  error: "#EF4444",
  textPrimary: "#F8F8FF",
  textSecondary: "#9494A8",
  border: "#2A2A3A",
} as const;

export const typography = {
  heading1: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    color: colors.textSecondary,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  x2l: 24,
  x3l: 32,
  x4l: 48,
} as const;

export const radii = {
  card: 16,
  button: 12,
} as const;
