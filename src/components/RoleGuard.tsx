import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth-context";
import { useTranslation } from "../lib/i18n";
import { palette, fonts, spacing } from "../lib/theme";
import type { Database } from "../lib/database.types";

type Role = Database["public"]["Tables"]["profiles"]["Row"]["role"];

const ROLE_HOME: Record<Role, string> = {
  customer: "/(tabs)",
  merchant: "/merchant-dashboard",
  driver: "/driver-dashboard",
  partner: "/partner-dashboard",
  admin: "/admin-dashboard",
};

interface RoleGuardProps {
  allowedRoles: Role | Role[];
  fallback?: string;
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, fallback, children }: RoleGuardProps) {
  const router = useRouter();
  const { role, user, initialized } = useAuth();
  const { t } = useTranslation();

  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  useEffect(() => {
    if (!initialized) return;

    if (!user || !role) {
      router.replace(fallback ?? "/auth");
      return;
    }

    if (!allowed.includes(role)) {
      router.replace(ROLE_HOME[role]);
    }
  }, [initialized, user, role, fallback, allowed, router]);

  const isAllowed = role && allowed.includes(role);

  if (!initialized || !user || !role || !isAllowed) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
  },
});
