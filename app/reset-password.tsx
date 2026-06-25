import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Mail, ArrowLeft, Lock } from "lucide-react-native";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";
import { useAuth } from "../src/lib/auth-context";
import { useTranslation } from "../src/lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resetPassword, updatePassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // This screen handles both the request form and the new-password form.
  // In production, the deep link from the email will land here with a recovery
  // token in the URL. For now we expose both flows manually.
  const handleRequest = async () => {
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError(t("emailRequired"));
      return;
    }
    setLoading(true);
    const { error: resetError } = await resetPassword(email.trim());
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
    setMessage(t("resetEmailSent"));
  };

  const handleUpdate = async () => {
    setError(null);
    setMessage(null);
    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }
    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage(t("passwordUpdated"));
    setTimeout(() => router.replace("/auth"), 1500);
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
          <Text style={styles.overline}>{t("resetPassword")}</Text>
          <Text style={styles.title}>{t("resetPasswordTitle")}</Text>
          <Text style={styles.subtitle}>{t("resetPasswordSubtitle")}</Text>

          {!sent ? (
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
                title={t("sendResetLink")}
                onPress={handleRequest}
                loading={loading}
                style={styles.submitButton}
              />
            </>
          ) : (
            <>
              <Input
                label={t("newPassword")}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                icon={<Lock size={18} color={palette.mutedForeground} />}
              />
              <Input
                label={t("confirmPassword")}
                placeholder="••••••••"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon={<Lock size={18} color={palette.mutedForeground} />}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              {message && <Text style={styles.success}>{message}</Text>}
              <Button
                title={t("updatePassword")}
                onPress={handleUpdate}
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
    marginBottom: spacing.md,
    textAlign: "center",
  },
});
