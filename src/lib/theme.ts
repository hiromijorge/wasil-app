// Design tokens exactly matching souqly-yemen-connect web app
// Colors converted from the web app's OKLCH CSS variables

export const palette = {
  background: "#FAFAF8",
  surface: "#F5F4F2",
  foreground: "#233338",

  card: "#FFFFFF",
  cardForeground: "#233338",
  popover: "#FFFFFF",
  popoverForeground: "#233338",

  primary: "#1F7474",
  primaryForeground: "#FCFDFC",
  primarySoft: "#E8F4F3",

  secondary: "#F2F1EF",
  secondaryForeground: "#233338",

  muted: "#F5F5F3",
  mutedForeground: "#7A8386",

  accent: "#DFF0EF",
  accentForeground: "#1F7474",

  destructive: "#C35638",
  destructiveForeground: "#FFFFFF",

  border: "#E9E8E5",
  input: "#E9E8E5",
  ring: "#1F7474",

  whatsapp: "#4CAF50",
  whatsappForeground: "#FFFFFF",
  success: "#4CAF50",
  warning: "#E6A23C",
};

export const fonts = {
  display: "PlusJakartaSans_700Bold",
  displaySemiBold: "PlusJakartaSans_600SemiBold",
  displayExtraBold: "PlusJakartaSans_800ExtraBold",
  displayBold: "PlusJakartaSans_700Bold",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  arabic: "Tajawal_400Regular",
  arabicBold: "Tajawal_700Bold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Web app radius scale (base radius = 1rem = 16px)
export const radii = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

// Soft shadcn-style shadows matching the web app
export const shadows = {
  card: {
    shadowColor: "#233338",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  soft: {
    shadowColor: "#233338",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
  },
  lift: {
    shadowColor: "#233338",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
};
