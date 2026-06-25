export const DEMO_MODE_ENABLED =
  process.env.EXPO_PUBLIC_DEMO_MODE_ENABLED === "true" ||
  process.env.EXPO_PUBLIC_DEMO_MODE_ENABLED === "1";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
