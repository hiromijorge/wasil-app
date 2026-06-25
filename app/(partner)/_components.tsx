import { View, Text, StyleSheet } from "react-native";
import { Store, Award } from "lucide-react-native";
import { formatSAR } from "../../src/lib/format";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import type { Database } from "../../src/lib/database.types";

export type CommissionRow = Database["public"]["Tables"]["commissions"]["Row"];
export type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function ReferredMerchantRow({
  referral,
  merchant,
}: {
  referral: ReferralRow;
  merchant?: ProfileRow;
}) {
  return (
    <View style={[sharedStyles.card, shadows.card]}>
      <View style={sharedStyles.row}>
        <Store size={18} color={palette.primary} />
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.cardTitle}>
            {merchant?.full_name ?? merchant?.email ?? referral.referred_merchant_id}
          </Text>
          <Text style={sharedStyles.meta}>
            {new Date(referral.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function CommissionRowItem({ commission }: { commission: CommissionRow }) {
  return (
    <View style={[sharedStyles.card, shadows.card]}>
      <View style={sharedStyles.rowBetween}>
        <View style={sharedStyles.row}>
          <Award size={18} color={palette.primary} />
          <Text style={sharedStyles.cardTitle}>
            {commission.source_type.replace(/_/g, " ")}
          </Text>
        </View>
        <Text style={sharedStyles.amount}>
          {formatSAR(Number(commission.amount_sar))}
        </Text>
      </View>
      <View style={sharedStyles.rowBetween}>
        <Text style={sharedStyles.date}>
          {new Date(commission.created_at).toLocaleDateString()}
        </Text>
        <View
          style={[
            sharedStyles.statusBadge,
            {
              backgroundColor:
                commission.status === "paid" ? "#e9f7ef" : "#fff3e0",
            },
          ]}
        >
          <Text
            style={[
              sharedStyles.statusText,
              {
                color:
                  commission.status === "paid"
                    ? palette.success
                    : palette.warning,
              },
            ]}
          >
            {commission.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const sharedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  signOutButton: { padding: spacing.sm },
  signOutText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.destructive,
  },
  referralCard: {
    backgroundColor: palette.primary,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  referralLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  referralCode: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: "#fff",
    marginVertical: spacing.sm,
  },
  referralHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  referralActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  referralAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  referralActionText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: "#fff",
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
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
  statValue: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: palette.foreground,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: palette.foreground,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.foreground,
  },
  amount: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: palette.foreground,
  },
  meta: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: spacing.xs,
  },
  date: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    textTransform: "capitalize",
  },
});
