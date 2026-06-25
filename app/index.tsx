import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { useAuth } from "../src/lib/auth-context";
import { Button } from "../src/components/Button";
import { palette, fonts, spacing, radii } from "../src/lib/theme";
import { Card } from "../src/components/Card";

export default function IndexRedirect() {
  const router = useRouter();
  const { role, user, initialized, profileError, refreshProfile, signOut } = useAuth();

  useEffect(() => {
    if (!initialized) return;

    if (role === "partner") {
      router.replace("/partner-dashboard");
    } else if (role === "merchant") {
      router.replace("/merchant-dashboard");
    } else if (role === "admin") {
      router.replace("/admin-dashboard");
    } else if (role === "driver") {
      router.replace("/dashboard");
    } else {
      router.replace("/(tabs)");
    }
  }, [initialized, role, router]);

  if (!initialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  const hasProfileProblem = !!profileError || (user !== null && role === null);

  if (hasProfileProblem) {
    return (
      <View style={styles.container}>
        <Card padding="lg" style={styles.card}>
          <View style={styles.iconCircle}>
            <AlertCircle size={32} color={palette.destructive} />
          </View>
          <Text style={styles.title}>Account setup incomplete</Text>
          <Text style={styles.message}>
            We couldn't load your profile. Please try again, or sign out and
            contact support if the problem continues.
          </Text>
          <View style={styles.actions}>
            <Button
              title="Try again"
              variant="outline"
              size="lg"
              onPress={refreshProfile}
              style={styles.actionButton}
            />
            <Button
              title="Sign out"
              variant="primary"
              size="lg"
              onPress={signOut}
              style={styles.actionButton}
            />
          </View>
        </Card>
      </View>
    );
  }

  // Redirect is in progress.
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={palette.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: "#fdecec",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.foreground,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: palette.mutedForeground,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  actions: {
    width: "100%",
    gap: spacing.sm,
  },
  actionButton: {
    width: "100%",
  },
});
