import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Mail, Lock, User, Gift } from "lucide-react-native";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";
import { useAuth } from "../src/lib/auth-context";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import type { Database } from "../src/lib/database.types";

type Role = Database["public"]["Tables"]["profiles"]["Row"]["role"];

const paramsSchema = z.object({
  role: z.enum(["customer", "merchant", "driver", "partner", "admin"]).optional().default("customer"),
});

const formSchema = z
  .object({
    method: z.enum(["phone", "email"]),
    value: z.string().min(1, "Required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: z.string().optional(),
    referralCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.value)) {
        ctx.addIssue({
          path: ["value"],
          code: z.ZodIssueCode.custom,
          message: "Enter a valid email",
        });
      }
    }
    if (data.method === "phone" && data.value.length < 8) {
      ctx.addIssue({
        path: ["value"],
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const ROLE_LABELS: Record<Role, string> = {
  customer: "Shopper",
  merchant: "Merchant",
  driver: "Driver",
  partner: "Partner",
  admin: "Admin",
};

export default function AuthScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams();
  const { role: rawRole } = paramsSchema.parse(rawParams);
  const role = rawRole as Role;

  const { signIn, signUp, loading: authLoading, enableDemo } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      method: "email",
      value: "",
      password: "",
      fullName: "",
      referralCode: "",
    },
  });

  const watchedMethod = watch("method");

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setSignUpSuccess(null);

    if (mode === "signin") {
      const { error } = await signIn({
        method: values.method,
        value: values.value,
        password: values.password,
      });
      if (error) {
        setSubmitError(error.message);
        return;
      }
      router.replace("/");
    } else {
      if (!values.fullName || values.fullName.trim().length < 2) {
        setSubmitError("Please enter your full name");
        return;
      }
      const { error } = await signUp({
        method: values.method,
        value: values.value,
        password: values.password,
        fullName: values.fullName.trim(),
        role,
        referralCode: values.referralCode || undefined,
      });
      if (error) {
        setSubmitError(error.message);
        return;
      }
      setMode("signin");
      reset();
      setSignUpSuccess(
        values.method === "email"
          ? "Account created. Please confirm your email before signing in."
          : "Account created. Please verify the OTP sent to your phone.",
      );
    }
  };

  const isLoading = isSubmitting || authLoading;

  const handleDemo = (demoRole: Role) => {
    enableDemo(demoRole);
    if (demoRole === "merchant") {
      router.replace("/merchant-dashboard");
    } else if (demoRole === "admin") {
      router.replace("/admin-dashboard");
    } else if (demoRole === "driver") {
      router.replace("/driver-dashboard");
    } else if (demoRole === "partner") {
      router.replace("/partner-dashboard");
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>W</Text>
          </View>
          <View>
            <Text style={styles.brandName}>Wasil</Text>
            <Text style={styles.brandTagline}>YEMEN CONNECT</Text>
          </View>
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.overline}>{ROLE_LABELS[role]} Portal</Text>
          <Text style={styles.title}>
            {mode === "signin" ? "Welcome back" : "Create account"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "signin"
              ? "Sign in to manage your Wasil account."
              : "Join Wasil Yemen Connect and start growing."}
          </Text>

          {/* Method toggle */}
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, watchedMethod === "phone" && styles.toggleActive]}
              onPress={() => {
                setValue("method", "phone");
                setSignUpSuccess(null);
                setSubmitError(null);
              }}
            >
              <Phone
                size={16}
                color={watchedMethod === "phone" ? palette.primaryForeground : palette.foreground}
              />
              <Text
                style={[
                  styles.toggleText,
                  watchedMethod === "phone" && styles.toggleTextActive,
                ]}
              >
                Phone
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, watchedMethod === "email" && styles.toggleActive]}
              onPress={() => {
                setValue("method", "email");
                setSignUpSuccess(null);
                setSubmitError(null);
              }}
            >
              <Mail
                size={16}
                color={watchedMethod === "email" ? palette.primaryForeground : palette.foreground}
              />
              <Text
                style={[
                  styles.toggleText,
                  watchedMethod === "email" && styles.toggleTextActive,
                ]}
              >
                Email
              </Text>
            </Pressable>
          </View>

          {mode === "signup" && (
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full name"
                  placeholder="Ahmed Al-Yemeni"
                  value={value}
                  onChangeText={onChange}
                  icon={<User size={18} color={palette.mutedForeground} />}
                />
              )}
            />
          )}

          <Controller
            control={control}
            name="value"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label={watchedMethod === "phone" ? "Phone number" : "Email address"}
                placeholder={
                  watchedMethod === "phone" ? "+967 70 123 4567" : "ahmed@example.com"
                }
                keyboardType={watchedMethod === "phone" ? "phone-pad" : "email-address"}
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                icon={
                  watchedMethod === "phone" ? (
                    <Phone size={18} color={palette.mutedForeground} />
                  ) : (
                    <Mail size={18} color={palette.mutedForeground} />
                  )
                }
                error={errors.value?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                icon={<Lock size={18} color={palette.mutedForeground} />}
                error={errors.password?.message}
              />
            )}
          />

          {mode === "signup" && role === "merchant" && (
            <Controller
              control={control}
              name="referralCode"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Referral code (optional)"
                  placeholder="ALSHIFA10"
                  autoCapitalize="characters"
                  value={value}
                  onChangeText={onChange}
                  icon={<Gift size={18} color={palette.mutedForeground} />}
                />
              )}
            />
          )}

          {submitError && <Text style={styles.submitError}>{submitError}</Text>}
          {signUpSuccess && <Text style={styles.submitSuccess}>{signUpSuccess}</Text>}

          <Button
            title={mode === "signin" ? "Sign in" : "Create account"}
            variant="primary"
            size="lg"
            loading={isLoading}
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
          />

          <Pressable
            onPress={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setSubmitError(null);
              setSignUpSuccess(null);
              reset();
            }}
            style={styles.switchRow}
          >
            <Text style={styles.switchText}>
              {mode === "signin"
                ? "Don't have an account? "
                : "Already have an account? "}
              <Text style={styles.switchAction}>
                {mode === "signin" ? "Sign up" : "Sign in"}
              </Text>
            </Text>
          </Pressable>

          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Demo login</Text>
            <View style={styles.demoGrid}>
              <Button
                title="Demo Customer"
                variant="outline"
                size="sm"
                onPress={() => handleDemo("customer")}
              />
              <Button
                title="Demo Merchant"
                variant="outline"
                size="sm"
                onPress={() => handleDemo("merchant")}
              />
              <Button
                title="Demo Admin"
                variant="outline"
                size="sm"
                onPress={() => handleDemo("admin")}
              />
              <Button
                title="Demo Driver"
                variant="outline"
                size="sm"
                onPress={() => handleDemo("driver")}
              />
              <Button
                title="Demo Partner"
                variant="outline"
                size="sm"
                onPress={() => handleDemo("partner")}
              />
            </View>
          </View>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  logoText: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.primaryForeground,
  },
  brandName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.foreground,
    lineHeight: 22,
  },
  brandTagline: {
    fontFamily: fonts.sansMedium,
    fontSize: 9,
    color: palette.mutedForeground,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.border,
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
  toggleRow: {
    flexDirection: "row",
    backgroundColor: palette.muted,
    borderRadius: radii.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  toggleActive: {
    backgroundColor: palette.primary,
  },
  toggleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  toggleTextActive: {
    color: palette.primaryForeground,
  },
  submitError: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.destructive,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  submitSuccess: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.success,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  switchRow: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  switchText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  switchAction: {
    fontFamily: fonts.sansSemiBold,
    color: palette.primary,
  },
  demoSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  demoTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.mutedForeground,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  demoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },
});
