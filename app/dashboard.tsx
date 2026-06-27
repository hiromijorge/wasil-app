import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/lib/auth-context";
import { palette } from "../src/lib/theme";

/**
 * Compatibility redirect for any old `/dashboard` deep links or bookmarks.
 * Routes the user to the correct role-specific dashboard.
 */
export default function DashboardRedirect() {
  const router = useRouter();
  const { role, initialized } = useAuth();

  useEffect(() => {
    if (!initialized) return;

    if (role === "merchant") {
      router.replace("/merchant-dashboard");
    } else if (role === "driver") {
      router.replace("/driver-dashboard");
    } else if (role === "partner") {
      router.replace("/partner-dashboard");
    } else if (role === "admin") {
      router.replace("/admin-dashboard");
    } else {
      router.replace("/(tabs)");
    }
  }, [initialized, role, router]);

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
  },
});
