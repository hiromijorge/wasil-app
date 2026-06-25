import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Wallet, ChevronDown, Landmark, User, Hash, CreditCard } from "lucide-react-native";
import { Input } from "./Input";
import { Button } from "./Button";
import { useTranslation, type TranslationKey } from "../lib/i18n";
import { formatSAR } from "../lib/format";
import { palette, fonts, spacing, radii, shadows } from "../lib/theme";

export interface PayoutRequestItem {
  id: string;
  amount_sar: number;
  status: string;
  requested_at: string;
  payment_method: string | null;
}

interface PayoutPanelProps {
  availableBalance: number;
  minPayout: number;
  requests: PayoutRequestItem[];
  savedDetails: Record<string, unknown> | null;
  onRequest: (amount: number, details: Record<string, unknown>) => void;
  onSaveDetails: (details: Record<string, unknown>) => void;
  loading: boolean;
  requestLoading: boolean;
}

function payoutStatusKey(status: string): TranslationKey {
  switch (status) {
    case "approved":
      return "payoutStatusApproved";
    case "rejected":
      return "payoutStatusRejected";
    case "paid":
      return "payoutStatusPaid";
    default:
      return "payoutStatusPending";
  }
}

export function PayoutPanel({
  availableBalance,
  minPayout,
  requests,
  savedDetails,
  onRequest,
  onSaveDetails,
  loading,
  requestLoading,
}: PayoutPanelProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [detailsExpanded, setDetailsExpanded] = useState(!savedDetails);
  const [bankName, setBankName] = useState(String((savedDetails as any)?.bankName ?? ""));
  const [accountHolder, setAccountHolder] = useState(String((savedDetails as any)?.accountHolder ?? ""));
  const [accountNumber, setAccountNumber] = useState(String((savedDetails as any)?.accountNumber ?? ""));
  const [iban, setIban] = useState(String((savedDetails as any)?.iban ?? ""));

  const handleSaveDetails = () => {
    onSaveDetails({
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      accountNumber: accountNumber.trim(),
      iban: iban.trim(),
    });
  };

  const handleRequest = () => {
    const value = Number(amount);
    if (Number.isNaN(value) || value <= 0) return;
    const details = {
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      accountNumber: accountNumber.trim(),
      iban: iban.trim(),
    };
    onRequest(value, details);
    setAmount("");
  };

  const canRequest =
    bankName.trim() &&
    accountHolder.trim() &&
    accountNumber.trim() &&
    Number(amount) >= minPayout &&
    Number(amount) <= availableBalance;

  if (loading) {
    return <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.xl }} />;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.card, shadows.card]}>
        <View style={styles.row}>
          <Wallet size={18} color={palette.primary} />
          <Text style={styles.cardTitle}>{t("availableBalance")}</Text>
        </View>
        <Text style={styles.bigAmount}>{formatSAR(availableBalance)}</Text>
        <Text style={styles.meta}>
          {t("minimumPayout")}: {formatSAR(minPayout)}
        </Text>
      </View>

      <View style={[styles.card, shadows.card]}>
        <Pressable
          onPress={() => setDetailsExpanded((v) => !v)}
          style={styles.toggleRow}
          accessibilityRole="button"
        >
          <View style={styles.row}>
            <Landmark size={18} color={palette.primary} />
            <Text style={styles.cardTitle}>{t("payoutAccount")}</Text>
          </View>
          <ChevronDown
            size={18}
            color={palette.primary}
            style={{ transform: [{ rotate: detailsExpanded ? "180deg" : "0deg" }] }}
          />
        </Pressable>

        {detailsExpanded && (
          <View style={styles.form}>
            <Input
              label={t("bankName")}
              placeholder={t("bankNamePlaceholder")}
              value={bankName}
              onChangeText={setBankName}
              icon={<Landmark size={16} color={palette.mutedForeground} />}
            />
            <Input
              label={t("accountHolder")}
              placeholder={t("accountHolderPlaceholder")}
              value={accountHolder}
              onChangeText={setAccountHolder}
              icon={<User size={16} color={palette.mutedForeground} />}
            />
            <Input
              label={t("accountNumber")}
              placeholder={t("accountNumberPlaceholder")}
              value={accountNumber}
              onChangeText={setAccountNumber}
              icon={<Hash size={16} color={palette.mutedForeground} />}
            />
            <Input
              label={t("iban")}
              placeholder={t("ibanPlaceholder")}
              value={iban}
              onChangeText={setIban}
              icon={<CreditCard size={16} color={palette.mutedForeground} />}
            />
            <Button title={t("savePayoutDetails")} onPress={handleSaveDetails} variant="outline" />
          </View>
        )}
      </View>

      <View style={[styles.card, shadows.card]}>
        <Text style={styles.cardTitle}>{t("requestPayout")}</Text>
        <Input
          label={t("payoutAmount")}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <Button
          title={t("requestPayout")}
          onPress={handleRequest}
          loading={requestLoading}
          disabled={!canRequest}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      <Text style={styles.sectionTitle}>{t("payoutHistory")}</Text>
      {requests.length === 0 && <Text style={styles.emptyText}>{t("noPayoutRequests")}</Text>}
      {requests.map((r) => (
        <View key={r.id} style={[styles.card, shadows.card]}>
          <View style={styles.rowBetween}>
            <Text style={styles.amount}>{formatSAR(Number(r.amount_sar))}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    r.status === "paid"
                      ? "#e9f7ef"
                      : r.status === "approved"
                        ? "#e3f2fd"
                        : r.status === "rejected"
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
                      r.status === "paid"
                        ? palette.success
                        : r.status === "approved"
                          ? palette.primary
                          : r.status === "rejected"
                            ? palette.destructive
                            : palette.warning,
                  },
                ]}
              >
                {t(payoutStatusKey(r.status))}
              </Text>
            </View>
          </View>
          <Text style={styles.meta}>{new Date(r.requested_at).toLocaleDateString()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    gap: spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: palette.foreground },
  bigAmount: { fontFamily: fonts.display, fontSize: 28, color: palette.foreground },
  amount: { fontFamily: fonts.display, fontSize: 18, color: palette.foreground },
  meta: { fontFamily: fonts.sansMedium, fontSize: 12, color: palette.mutedForeground },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  form: { marginTop: spacing.sm, gap: spacing.sm },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: palette.foreground,
    marginTop: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.md,
  },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: "capitalize" },
});
