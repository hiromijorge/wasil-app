import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Users, Award, DollarSign, Wallet } from "lucide-react-native";
import { useAdminReferrals } from "../../src/hooks/useAdminReferrals";
import { useAllPartnerPayoutRequests, useProcessPartnerPayout } from "../../src/hooks/usePartnerPayouts";
import { useAuth } from "../../src/lib/auth-context";
import { useTranslation } from "../../src/lib/i18n";
import { formatSAR } from "../../src/lib/format";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { Button } from "../../src/components/Button";

export default function AdminReferralsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { referrals, commissions, isLoading, payCommission } = useAdminReferrals();
  const { data: payoutRequests, isLoading: payoutsLoading } = useAllPartnerPayoutRequests();
  const processPayout = useProcessPartnerPayout();

  const handleProcess = async (id: string, status: "approved" | "rejected" | "paid") => {
    if (!user?.id) return;
    try {
      await processPayout.mutateAsync({ requestId: id, status, processedBy: user.id });
      Alert.alert("Payout " + status);
    } catch (e) {
      Alert.alert("Failed", e instanceof Error ? e.message : String(e));
    }
  };

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

        <Text style={styles.sectionTitle}>Payout Requests</Text>
        {payoutsLoading && <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />}
        {payoutRequests?.length === 0 && !payoutsLoading && (
          <Text style={styles.emptyText}>No payout requests</Text>
        )}
        {payoutRequests?.map((p) => (
          <View key={p.id} style={[styles.card, shadows.card]}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <Wallet size={16} color={palette.primary} />
                <Text style={styles.amount}>{formatSAR(Number(p.amount_sar))}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      p.status === "paid"
                        ? "#e9f7ef"
                        : p.status === "approved"
                          ? "#e3f2fd"
                          : p.status === "rejected"
                            ? "#ffebee"
                            : "#fff3e0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        p.status === "paid"
                          ? palette.success
                          : p.status === "approved"
                            ? palette.primary
                            : p.status === "rejected"
                              ? palette.destructive
                              : palette.warning,
                    },
                  ]}
                >
                  {p.status}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>
              Partner: {p.partner?.full_name ?? p.partner?.email ?? p.partner_id.slice(-6)}
            </Text>
            <Text style={styles.meta}>
              Method: {p.payment_method === "mobile_money" ? "Mobile Money" : "Bank Transfer"}
            </Text>
            {p.status === "pending" && (
              <View style={styles.actionRow}>
                <Button
                  title="Approve"
                  variant="outline"
                  size="sm"
                  onPress={() => handleProcess(p.id, "approved")}
                  loading={processPayout.isPending}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Reject"
                  variant="outline"
                  size="sm"
                  onPress={() => handleProcess(p.id, "rejected")}
                  loading={processPayout.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            )}
            {p.status === "approved" && (
              <Button
                title="Mark paid"
                size="sm"
                onPress={() => handleProcess(p.id, "paid")}
                loading={processPayout.isPending}
                style={{ marginTop: spacing.sm }}
              />
            )}
          </View>
        ))}

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
    borderColor: `${palette.border}80`,
    ...shadows.card,
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
    borderColor: `${palette.border}80`,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  amount: { fontFamily: fonts.display, fontSize: 18, color: palette.foreground },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: "capitalize" },
  meta: { fontFamily: fonts.sansMedium, fontSize: 12, color: palette.mutedForeground, marginTop: spacing.sm },
  actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
});
