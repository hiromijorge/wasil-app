import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react-native";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";
import { useAuth } from "../src/lib/auth-context";
import { useTranslation } from "../src/lib/i18n";
import { supabase } from "../src/lib/supabase";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [email, setEmail] = useState(user?.email ?? "");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function handleDeepLink(url: string) {
      setLoading(true);
      setError(null);
      try {
        const parsed = Linking.parse(url);
        const rawFragment = url.includes("#") ? url.split("#").pop() : "";
        const fragment = rawFragment ? queryStringToObject(rawFragment) : {};
        const query = parsed.queryParams ?? {};

        const accessToken =
          (query.access_token as string) || (fragment.access_token as string);
        const refreshToken =
          (query.refresh_token as string) || (fragment.refresh_token as string);
        const tokenHash = (query.token_hash as string) || (fragment.token_hash as string);
        const type = (query.type as string) || (fragment.type as string);
        const code = (query.code as string) || (fragment.code as string);

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          setVerified(true);
          setMessage(t("emailVerified"));
          setTimeout(() => router.replace("/"), 1500);
        } else if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });
          if (verifyError) throw verifyError;
          setVerified(true);
          setMessage(t("emailVerified"));
          setTimeout(() => router.replace("/"), 1500);
        } else if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          setVerified(true);
          setMessage(t("emailVerified"));
          setTimeout(() => router.replace("/"), 1500);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    const url = Linking.createURL("verify-email", { queryParams: params as Record<string, string> });
    if (Object.keys(params).length > 0) {
      handleDeepLink(url);
    }

    const subscription = Linking.addEventListener("url", (event) => {
      if (event.url.includes("verify-email")) {
        handleDeepLink(event.url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [params, router, t]);

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError(t("emailRequired"));
      return;
    }
    setLoading(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: "wasil://verify-email" },
    });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setMessage(t("verificationEmailResent"));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
          <ArrowLeft size={24} color={palette.foreground} />
        </Pressable>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.overline}>{t("verifyEmail")}</Text>
          <Text style={styles.title}>{t("verifyEmailTitle")}</Text>
          <Text style={styles.subtitle}>{t("verifyEmailSubtitle")}</Text>

          {verified ? (
            <View style={styles.successBlock}>
              <CheckCircle size={48} color={palette.success} />
              <Text style={styles.success}>{message}</Text>
            </View>
          ) : (
            <>
              <Input
                label={t("email")}
                placeholder={t("emailPlaceholder")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail size={18} color={palette.mutedForeground} />}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              {message && <Text style={styles.success}>{message}</Text>}
              <Button
                title={t("resendVerificationEmail")}
                onPress={handleResend}
                loading={loading}
                style={styles.submitButton}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function queryStringToObject(queryString: string): Record<string, string> {
  const result: Record<string, string> = {};
  const params = new URLSearchParams(queryString);
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  back: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    padding: spacing.sm,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    ...shadows.card,
  },
  overline: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: palette.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: palette.foreground,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  error: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.destructive,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  success: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.success,
    textAlign: "center",
  },
  successBlock: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
});
