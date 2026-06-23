import Constants from "expo-constants";

// Public fallback for static web exports where process.env is not inlined.
// These are the same values from .env.local; the anon key is public.
const PUBLIC_FALLBACKS: Record<string, string> = {
  EXPO_PUBLIC_SUPABASE_URL: "https://njdndrpylsvxoyvflkcq.supabase.co",
  EXPO_PUBLIC_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG5kcnB5bHN2eG95dmZsa2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTE5MjAsImV4cCI6MjA5NzQyNzkyMH0.3z5U3eFu5-869PALff-lH9bDjAdEFEosPg7LDWCgAPg",
};

function getEnv(name: string): string {
  const value =
    Constants.expoConfig?.extra?.[name] ??
    Constants.expoConfig?.extra?.env?.[name] ??
    process.env[name] ??
    PUBLIC_FALLBACKS[name];

  if (!value) {
    console.warn(
      `Missing environment variable: ${name}. Copy .env.example to .env and fill your Supabase credentials.`,
    );
    return "";
  }
  return value;
}

export const SUPABASE_URL = getEnv("EXPO_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = getEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY");
