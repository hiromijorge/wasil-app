import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { registerForPushNotificationsAsync, savePushToken } from "./notifications";
import { useLang, type Lang } from "./i18n";
import type { Database } from "./database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Role = Profile["role"];

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  initialized: boolean;
  profileError: Error | null;
  demo: boolean;
  enableDemo: (role: Role) => void;
  signUp: (input: {
    method: "phone" | "email";
    value: string;
    password: string;
    fullName: string;
    role: Role;
    referralCode?: string;
  }) => Promise<{ error?: Error }>;
  signIn: (input: {
    method: "phone" | "email";
    value: string;
    password: string;
  }) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: Error }>;
  updatePassword: (password: string) => Promise<{ error?: Error }>;
  sendPhoneOtp: (phone: string) => Promise<{ error?: Error }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error?: Error }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>) => Promise<{ error?: Error }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { lang, setLang } = useLang();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [demoRole, setDemoRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);

  const isDemo = demoRole !== null;

  const demoProfile: Profile | null = isDemo
    ? {
        id: "demo-user-id",
        full_name: "Demo User",
        email: "demo@wasil.ye",
        phone: "+967700000000",
        avatar_url: null,
        role: demoRole,
        referral_code: "WASIL1234",
        referred_by: null,
        is_partner: false,
        push_token: null,
        language: lang,
        payout_details: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null;

  const demoUser: User | null = isDemo
    ? ({ id: "demo-user-id", email: "demo@wasil.ye", phone: "+967700000000" } as User)
    : null;

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch profile:", error);
      setProfileError(error);
      setProfile(null);
      setRole(null);
      return;
    }

    setProfileError(null);
    setProfile(data);
    setRole(data.role);
    if (data.language === "ar" || data.language === "en") {
      setLang(data.language);
    }
  }, [setLang]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      setProfileError(null);
      await fetchProfile(user.id);
    }
  }, [fetchProfile, user?.id]);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>) => {
      if (!user?.id) return { error: new Error("Not authenticated") };
      if (isDemo) {
        setProfile((prev) => (prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null));
        return {};
      }
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) return { error };
      await fetchProfile(user.id);
      return {};
    },
    [fetchProfile, user?.id, isDemo],
  );

  useEffect(() => {
    let mounted = true;

    setInitialized(false);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
        });
      } else {
        setLoading(false);
        setInitialized(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setInitialized(false);
        fetchProfile(session.user.id).finally(() => {
          if (mounted) setInitialized(true);
        });
      } else {
        setProfile(null);
        setRole(null);
        setProfileError(null);
        setInitialized(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  useEffect(() => {
    if (!user?.id || isDemo) return;
    registerForPushNotificationsAsync().then((token) => {
      if (token) savePushToken(user.id, token);
    });
  }, [user?.id, isDemo]);

  const signIn = useCallback(
    async (input: { method: "phone" | "email"; value: string; password: string }) => {
      try {
        if (input.method === "email") {
          const { error } = await supabase.auth.signInWithPassword({
            email: input.value,
            password: input.password,
          });
          if (error) return { error };
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            phone: input.value,
            password: input.password,
          });
          if (error) return { error };
        }
        return {};
      } catch (err) {
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    [],
  );

  const signUp = useCallback(
    async (input: {
      method: "phone" | "email";
      value: string;
      password: string;
      fullName: string;
      role: Role;
      referralCode?: string;
    }) => {
      try {
        const baseMetadata = {
          full_name: input.fullName,
          role: input.role,
          referral_code: input.referralCode ?? null,
        };

        if (input.method === "email") {
          const { data, error } = await supabase.auth.signUp({
            email: input.value,
            password: input.password,
            options: {
              data: { ...baseMetadata, phone: null },
              emailRedirectTo: "wasil://verify-email",
            },
          });
          if (error) return { error };
          if (data.user) {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              email: input.value,
              phone: null,
              full_name: input.fullName,
              role: input.role,
              referral_code: generateReferralCode(input.fullName),
              language: lang,
            });
          }
        } else {
          const { data, error } = await supabase.auth.signUp({
            phone: input.value,
            password: input.password,
            options: {
              data: { ...baseMetadata, phone: input.value },
            },
          });
          if (error) return { error };
          if (data.user) {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              email: null,
              phone: input.value,
              full_name: input.fullName,
              role: input.role,
              referral_code: generateReferralCode(input.fullName),
              language: lang,
            });
          }
        }

        return {};
      } catch (err) {
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    setDemoRole(null);
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "wasil://reset-password",
      });
      return { error: error ?? undefined };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error ?? undefined };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      return { error: error ?? undefined };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
      return { error: error ?? undefined };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  const enableDemo = useCallback((selectedRole: Role) => {
    setDemoRole(selectedRole);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session: isDemo ? null : session,
        user: isDemo ? demoUser : user,
        profile: isDemo ? demoProfile : profile,
        role: isDemo ? demoRole : role,
        loading,
        initialized: isDemo ? true : initialized,
        profileError: isDemo ? null : profileError,
        demo: isDemo,
        enableDemo,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        sendPhoneOtp,
        verifyPhoneOtp,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

function generateReferralCode(fullName: string): string {
  const base = fullName
    .split(" ")[0]
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base || "WASIL"}${suffix}`;
}
