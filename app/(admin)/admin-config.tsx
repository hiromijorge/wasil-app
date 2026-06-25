import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, AlertCircle } from "lucide-react-native";
import { useAuth } from "../../src/lib/auth-context";
import { usePlatformConfig } from "../../src/hooks/usePlatformConfig";
import { useTranslation } from "../../src/lib/i18n";
import { palette, fonts, spacing, radii } from "../../src/lib/theme";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { Card } from "../../src/components/Card";

export default function AdminConfigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { role, loading: authLoading } = useAuth();
  const { data, isLoading, refresh, updateConfig } = usePlatformConfig();

  const [commission, setCommission] = useState("");
  const [minCommission, setMinCommission] = useState("");
  const [partnerCommission, setPartnerCommission] = useState("");
  const [minPartnerPayout, setMinPartnerPayout] = useState("");
  const [minMerchantPayout, setMinMerchantPayout] = useState("");
  const [minDriverPayout, setMinDriverPayout] = useState("");

  // Parcel pricing
  const [parcelBaseFare, setParcelBaseFare] = useState("");
  const [parcelPerKmRate, setParcelPerKmRate] = useState("");
  const [parcelPerKgRate, setParcelPerKgRate] = useState("");
  const [parcelVolumetricDivisor, setParcelVolumetricDivisor] = useState("");
  const [minimumParcelFare, setMinimumParcelFare] = useState("");
  const [parcelBikeMultiplier, setParcelBikeMultiplier] = useState("");
  const [parcelCarMultiplier, setParcelCarMultiplier] = useState("");
  const [parcelVanMultiplier, setParcelVanMultiplier] = useState("");

  // COD settings
  const [codWeeklySettlementDays, setCodWeeklySettlementDays] = useState("");
  const [codMaxUnsettledCashSar, setCodMaxUnsettledCashSar] = useState("");
  const [codHighValueThresholdSar, setCodHighValueThresholdSar] = useState("");
  const [parcelDriverFeePercent, setParcelDriverFeePercent] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setCommission(String(data.commission_percent ?? ""));
      setMinCommission(String(data.minimum_commission_sar ?? ""));
      setPartnerCommission(String(data.partner_commission_percent ?? ""));
      setMinPartnerPayout(String(data.min_partner_payout_sar ?? ""));
      setMinMerchantPayout(String(data.min_merchant_payout_sar ?? ""));
      setMinDriverPayout(String(data.min_driver_payout_sar ?? ""));
      setParcelBaseFare(String(data.parcel_base_fare_sar ?? ""));
      setParcelPerKmRate(String(data.parcel_per_km_rate_sar ?? ""));
      setParcelPerKgRate(String(data.parcel_per_kg_rate_sar ?? ""));
      setParcelVolumetricDivisor(String(data.parcel_volumetric_divisor ?? ""));
      setMinimumParcelFare(String(data.minimum_parcel_fare_sar ?? ""));
      setParcelBikeMultiplier(String(data.parcel_bike_multiplier ?? ""));
      setParcelCarMultiplier(String(data.parcel_car_multiplier ?? ""));
      setParcelVanMultiplier(String(data.parcel_van_multiplier ?? ""));
      setCodWeeklySettlementDays(String(data.cod_weekly_settlement_days ?? ""));
      setCodMaxUnsettledCashSar(String(data.cod_max_unsettled_cash_sar ?? ""));
      setCodHighValueThresholdSar(String(data.cod_high_value_threshold_sar ?? ""));
      setParcelDriverFeePercent(String(data.parcel_driver_fee_percent ?? ""));
    }
  }, [data]);

  const isAdmin = role === "admin";

  const handleSave = async () => {
    setMessage(null);
    const values = [
      commission,
      minCommission,
      partnerCommission,
      minPartnerPayout,
      minMerchantPayout,
      minDriverPayout,
      parcelBaseFare,
      parcelPerKmRate,
      parcelPerKgRate,
      parcelVolumetricDivisor,
      minimumParcelFare,
      parcelBikeMultiplier,
      parcelCarMultiplier,
      parcelVanMultiplier,
      codWeeklySettlementDays,
      codMaxUnsettledCashSar,
      codHighValueThresholdSar,
      parcelDriverFeePercent,
    ];

    if (values.some((v) => v.trim() === "" || Number.isNaN(Number(v)))) {
      setMessage("Please enter valid numbers.");
      return;
    }

    setSaving(true);
    const result = await updateConfig({
      commission_percent: Number(commission),
      minimum_commission_sar: Number(minCommission),
      partner_commission_percent: Number(partnerCommission),
      min_partner_payout_sar: Number(minPartnerPayout),
      min_merchant_payout_sar: Number(minMerchantPayout),
      min_driver_payout_sar: Number(minDriverPayout),
      parcel_base_fare_sar: Number(parcelBaseFare),
      parcel_per_km_rate_sar: Number(parcelPerKmRate),
      parcel_per_kg_rate_sar: Number(parcelPerKgRate),
      parcel_volumetric_divisor: Number(parcelVolumetricDivisor),
      minimum_parcel_fare_sar: Number(minimumParcelFare),
      parcel_bike_multiplier: Number(parcelBikeMultiplier),
      parcel_car_multiplier: Number(parcelCarMultiplier),
      parcel_van_multiplier: Number(parcelVanMultiplier),
      cod_weekly_settlement_days: Number(codWeeklySettlementDays),
      cod_max_unsettled_cash_sar: Number(codMaxUnsettledCashSar),
      cod_high_value_threshold_sar: Number(codHighValueThresholdSar),
      parcel_driver_fee_percent: Number(parcelDriverFeePercent),
    });
    setSaving(false);

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage("Settings saved.");
      await refresh();
    }
  };

  if (authLoading || isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={20} color={palette.foreground} />
          </Pressable>
          <View>
            <Text style={styles.headerOverline}>Merchant Console</Text>
            <Text style={styles.headerTitle}>Platform Config</Text>
          </View>
        </View>
      </View>

      {!isAdmin ? (
        <View style={styles.centered}>
          <AlertCircle size={48} color={palette.destructive} />
          <Text style={styles.deniedTitle}>Access Denied</Text>
          <Text style={styles.deniedText}>
            You must be signed in as an admin to view this screen.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.md,
          }}
        >
          <View>
            <Text style={styles.title}>Platform Config</Text>
            <Text style={styles.subtitle}>
              Adjust platform commission settings
            </Text>
          </View>

          <Card padding="lg" style={styles.card}>
            <Text style={styles.cardTitle}>Commission Settings</Text>
            <Input
              label="Commission %"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={commission}
              onChangeText={setCommission}
            />
            <Input
              label="Minimum commission (SAR)"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={minCommission}
              onChangeText={setMinCommission}
            />
            <Input
              label="Partner commission %"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={partnerCommission}
              onChangeText={setPartnerCommission}
            />
            <Input
              label="Minimum partner payout (SAR)"
              placeholder="25"
              keyboardType="decimal-pad"
              value={minPartnerPayout}
              onChangeText={setMinPartnerPayout}
            />
            <Input
              label="Minimum merchant payout (SAR)"
              placeholder="25"
              keyboardType="decimal-pad"
              value={minMerchantPayout}
              onChangeText={setMinMerchantPayout}
            />
            <Input
              label="Minimum driver payout (SAR)"
              placeholder="25"
              keyboardType="decimal-pad"
              value={minDriverPayout}
              onChangeText={setMinDriverPayout}
            />
          </Card>

          <Card padding="lg" style={styles.card}>
            <Text style={styles.cardTitle}>Parcel Pricing</Text>
            <Input
              label="Base fare (SAR)"
              placeholder="15"
              keyboardType="decimal-pad"
              value={parcelBaseFare}
              onChangeText={setParcelBaseFare}
            />
            <Input
              label="Per km rate (SAR)"
              placeholder="2"
              keyboardType="decimal-pad"
              value={parcelPerKmRate}
              onChangeText={setParcelPerKmRate}
            />
            <Input
              label="Per kg rate (SAR)"
              placeholder="3"
              keyboardType="decimal-pad"
              value={parcelPerKgRate}
              onChangeText={setParcelPerKgRate}
            />
            <Input
              label="Volumetric divisor"
              placeholder="5000"
              keyboardType="decimal-pad"
              value={parcelVolumetricDivisor}
              onChangeText={setParcelVolumetricDivisor}
            />
            <Input
              label="Minimum fare (SAR)"
              placeholder="15"
              keyboardType="decimal-pad"
              value={minimumParcelFare}
              onChangeText={setMinimumParcelFare}
            />
            <Text style={styles.sectionLabel}>Vehicle multipliers</Text>
            <View style={styles.row}>
              <Input
                label="Bike"
                placeholder="1"
                keyboardType="decimal-pad"
                value={parcelBikeMultiplier}
                onChangeText={setParcelBikeMultiplier}
                style={styles.smallInput}
              />
              <Input
                label="Car"
                placeholder="1.5"
                keyboardType="decimal-pad"
                value={parcelCarMultiplier}
                onChangeText={setParcelCarMultiplier}
                style={styles.smallInput}
              />
              <Input
                label="Van"
                placeholder="2.5"
                keyboardType="decimal-pad"
                value={parcelVanMultiplier}
                onChangeText={setParcelVanMultiplier}
                style={styles.smallInput}
              />
            </View>
          </Card>

          <Card padding="lg" style={styles.card}>
            <Text style={styles.cardTitle}>{t("codSettings")}</Text>
            <Input
              label={t("codWeeklySettlementDays")}
              placeholder="7"
              keyboardType="number-pad"
              value={codWeeklySettlementDays}
              onChangeText={setCodWeeklySettlementDays}
            />
            <Input
              label={t("codMaxUnsettledCashSar")}
              placeholder="300"
              keyboardType="decimal-pad"
              value={codMaxUnsettledCashSar}
              onChangeText={setCodMaxUnsettledCashSar}
            />
            <Input
              label={t("codHighValueThresholdSar")}
              placeholder="300"
              keyboardType="decimal-pad"
              value={codHighValueThresholdSar}
              onChangeText={setCodHighValueThresholdSar}
            />
            <Input
              label={t("parcelDriverFeePercent")}
              placeholder="70"
              keyboardType="decimal-pad"
              value={parcelDriverFeePercent}
              onChangeText={setParcelDriverFeePercent}
            />
          </Card>

          {message && (
            <Text
              style={[
                styles.message,
                message.startsWith("Settings") ? styles.success : styles.error,
              ]}
            >
              {message}
            </Text>
          )}

          <Button
            title="Save settings"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  headerOverline: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: palette.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: palette.foreground,
  },
  iconButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: palette.foreground,
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  card: {
    gap: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: palette.foreground,
  },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  smallInput: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  deniedTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.foreground,
    marginTop: spacing.md,
  },
  deniedText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  message: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  success: {
    color: palette.success,
  },
  error: {
    color: palette.destructive,
  },
});
