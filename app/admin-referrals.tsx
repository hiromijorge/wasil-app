import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Users, Award, DollarSign } from "lucide-react-native";
import { useAdminReferrals } from "../src/hooks/useAdminReferrals";
import { formatSAR } from "../src/lib/demo-data";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { Button } from "../src/components/Button";

export default function AdminReferralsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { referrals, commissions, isLoading, payCommission } = useAdminReferrals();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <Pressable onPress={() => router.replace("/admin-billing")} style={styles.back}>
          <ArrowLeft size={24} color={palette.foreground} />
        </Pressable>
        <Text style={styles.title}>Referrals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, shadows.card]}>
            <Users size={20} color={palette.primary} />
            <Text style={styles.statValue}>{referrals.length}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          <View style={[styles.statCard, shadows.card]}>
            <Award size={20} color={palette.success} />
            <Text style={styles.statValue}>{commissions.length}</Text>
            <Text style={styles.statLabel}>Commissions</Text>
          </View>
        </View>

        {isLoading && <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />}

        <Text style={styles.sectionTitle}>Commissions</Text>
        {commissions.length === 0 && !isLoading && (
          <Text style={styles.emptyText}>No commissions recorded</Text>
        )}
        {commissions.map((c) => (
          <View key={c.id} style={[styles.card, shadows.card]}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <DollarSign size={16} color={palette.primary} />
                <Text style={styles.amount}>{formatSAR(Number(c.amount_sar))}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: c.status === "paid" ? "#e9f7ef" : "#fff3e0" }]}>
                <Text style={[styles.statusText, { color: c.status === "paid" ? palette.success : palette.warning }]}>
                  {c.status}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>Referral: {c.referral_id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.meta}>Source: {c.source_type.replace(/_/g, " ")}</Text>
            {c.status !== "paid" && (
              <Button
                title="Mark paid"
                variant="primary"
                size="sm"
                onPress={() => payCommission(c.id)}
                style={{ marginTop: spacing.sm }}
              />
            )}
          </View>
        ))}
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
  },
  back: { padding: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 20, color: palette.foreground },
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
  statValue: { fontFamily: fonts.display, fontSize: 18, color: palette.foreground, marginTop: spacing.sm },
  statLabel: { fontFamily: fonts.sansMedium, fontSize: 11, color: palette.mutedForeground },
  sectionTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: palette.foreground, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyText: { fontFamily: fonts.sansMedium, fontSize: 13, color: palette.mutedForeground, textAlign: "center", marginTop: spacing.md },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  amount: { fontFamily: fonts.display, fontSize: 18, color: palette.foreground },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: "capitalize" },
  meta: { fontFamily: fonts.sansMedium, fontSize: 12, color: palette.mutedForeground, marginTop: spacing.sm },
});
