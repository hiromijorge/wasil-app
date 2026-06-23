import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users, DollarSign, TrendingUp, Award } from "lucide-react-native";
import { useAuth } from "../src/lib/auth-context";
import { usePartnerStats } from "../src/hooks/usePartnerStats";
import { formatSAR } from "../src/lib/demo-data";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { Button } from "../src/components/Button";
import { DashboardHeader, DashboardPage } from "../src/components/DashboardLayout";
import type { Database } from "../src/lib/database.types";

type CommissionRow = Database["public"]["Tables"]["commissions"]["Row"];

export default function PartnerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, profile } = useAuth();
  const { referrals, commissions, totalEarned, pending, isLoading } = usePartnerStats();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <DashboardHeader
        overline="Partner Console"
        title={profile?.full_name ?? "Partner"}
        right={
          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <DashboardPage>
          <View style={[styles.referralCard, shadows.card]}>
          <Text style={styles.referralLabel}>Your referral code</Text>
          <Text style={styles.referralCode}>{profile?.referral_code ?? "-"}</Text>
          <Text style={styles.referralHint}>Share this code with merchants. You earn 10% of Wasil fees from each order they complete.</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, shadows.card]}>
            <Users size={20} color={palette.primary} />
            <Text style={styles.statValue}>{referrals.length}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          <View style={[styles.statCard, shadows.card]}>
            <DollarSign size={20} color={palette.success} />
            <Text style={styles.statValue}>{formatSAR(totalEarned)}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
          <View style={[styles.statCard, shadows.card]}>
            <TrendingUp size={20} color={palette.warning} />
            <Text style={styles.statValue}>{formatSAR(pending)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Commission history</Text>
        {isLoading && <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />}
        {commissions.length === 0 && !isLoading && (
          <Text style={styles.emptyText}>No commissions yet. Invite merchants with your code to start earning.</Text>
        )}
        {commissions.map((c) => (
          <CommissionRowItem key={c.id} commission={c} />
        ))}
        </DashboardPage>
      </ScrollView>
    </View>
  );
}

function CommissionRowItem({ commission }: { commission: CommissionRow }) {
  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <Award size={18} color={palette.primary} />
            <Text style={styles.cardTitle}>{commission.source_type.replace(/_/g, " ")}</Text>
        </View>
        <Text style={styles.amount}>{formatSAR(Number(commission.amount_sar))}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.date}>{new Date(commission.created_at).toLocaleDateString()}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: commission.status === "paid" ? "#e9f7ef" : "#fff3e0" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: commission.status === "paid" ? palette.success : palette.warning },
            ]}
          >
            {commission.status}
          </Text>
        </View>
      </View>
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
  },
  overline: { fontFamily: fonts.sansMedium, fontSize: 10, color: palette.mutedForeground, textTransform: "uppercase" },
  title: { fontFamily: fonts.display, fontSize: 22, color: palette.foreground },
  signOutButton: { padding: spacing.sm },
  signOutText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: palette.destructive },
  referralCard: {
    backgroundColor: palette.primary,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  referralLabel: { fontFamily: fonts.sansMedium, fontSize: 12, color: "rgba(255,255,255,0.8)" },
  referralCode: { fontFamily: fonts.display, fontSize: 28, color: "#fff", marginVertical: spacing.sm },
  referralHint: { fontFamily: fonts.sans, fontSize: 13, color: "rgba(255,255,255,0.9)" },
  statsGrid: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },
  statValue: { fontFamily: fonts.display, fontSize: 16, color: palette.foreground, marginTop: spacing.sm },
  statLabel: { fontFamily: fonts.sansMedium, fontSize: 11, color: palette.mutedForeground },
  sectionTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: palette.foreground, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyText: { fontFamily: fonts.sansMedium, fontSize: 13, color: palette.mutedForeground, textAlign: "center", marginTop: spacing.md },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: palette.foreground },
  amount: { fontFamily: fonts.display, fontSize: 16, color: palette.foreground },
  date: { fontFamily: fonts.sansMedium, fontSize: 12, color: palette.mutedForeground },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: "capitalize" },
});
