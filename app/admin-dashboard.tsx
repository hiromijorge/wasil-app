import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreditCard, Receipt, Settings, Truck, Users, LogOut } from "lucide-react-native";
import { useAuth } from "../src/lib/auth-context";
import { useTranslation } from "../src/lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { LangSwitcher } from "../src/components/LangSwitcher";
import { DashboardHeader, DashboardPage } from "../src/components/DashboardLayout";

const ADMIN_LINKS = [
  { key: "payments", label: "orderPayments" as const, icon: Receipt, route: "/admin-payments" },
  { key: "billing", label: "subscriptionBilling" as const, icon: CreditCard, route: "/admin-billing" },
  { key: "drivers", label: "adminDriversTitle" as const, icon: Truck, route: "/admin-drivers" },
  { key: "referrals", label: "referrals" as const, icon: Users, route: "/admin-referrals" },
  { key: "config", label: "platformConfig" as const, icon: Settings, route: "/admin-config" },
] as const;

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <DashboardHeader
        overline={t("adminConsole")}
        title={profile?.full_name ?? t("appName")}
        right={
          <View style={styles.headerRight}>
            <LangSwitcher />
            <Pressable onPress={handleSignOut} style={styles.signOutButton} accessibilityRole="button">
              <LogOut size={20} color={palette.destructive} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <DashboardPage>
          <Text style={styles.subtitle}>{t("adminSubtitle")}</Text>

          <View style={styles.grid}>
          {ADMIN_LINKS.map(({ key, label, icon: Icon, route }) => (
            <Pressable
              key={key}
              onPress={() => router.push(route)}
              style={[styles.card, shadows.card]}
              accessibilityRole="button"
            >
              <View style={styles.iconCircle}>
                <Icon size={22} color={palette.primary} />
              </View>
              <Text style={styles.cardLabel}>{t(label)}</Text>
            </Pressable>
          ))}
        </View>
        </DashboardPage>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.md,
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  overline: { fontFamily: fonts.sansMedium, fontSize: 10, color: palette.mutedForeground, textTransform: "uppercase" },
  title: { fontFamily: fonts.display, fontSize: 20, color: palette.foreground },
  signOutButton: { padding: spacing.sm },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  subtitle: { fontFamily: fonts.sansMedium, fontSize: 14, color: palette.mutedForeground, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: {
    width: "47%",
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    ...shadows.card,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  cardLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: palette.foreground, textAlign: "center" },
});
