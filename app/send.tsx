import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Package, ChevronRight, Upload } from "lucide-react-native";
import { TopBar } from "../src/components/TopBar";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";
import { useTranslation } from "../src/lib/i18n";
import { useAuth } from "../src/lib/auth-context";
import { useParcelEstimate } from "../src/hooks/useParcelEstimate";
import { useCreateParcel, type ParcelForm } from "../src/hooks/useCreateParcel";
import { useCustomerParcels } from "../src/hooks/useCustomerParcels";
import { formatSAR } from "../src/lib/demo-data";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";

const initialForm: ParcelForm = {
  pickupAddress: "",
  dropoffAddress: "",
  receiverName: "",
  receiverPhone: "",
  itemDescription: "",
  itemCategory: "",
  weightKg: "1",
  notes: "",
};

export default function SendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { create, isLoading: creating } = useCreateParcel();
  const { data: parcels, isLoading: parcelsLoading, refresh } = useCustomerParcels();

  const [form, setForm] = useState<ParcelForm>(initialForm);
  const fare = useParcelEstimate(parseFloat(form.weightKg) || 1);

  const update = (key: keyof ParcelForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (
      !form.pickupAddress ||
      !form.dropoffAddress ||
      !form.receiverName ||
      !form.receiverPhone ||
      !form.itemDescription
    ) {
      Alert.alert(t("tryAgain"), "Please fill in all required fields.");
      return;
    }

    const { data, error } = await create(form);
    if (error) {
      Alert.alert(t("tryAgain"), error.message);
    } else if (data) {
      setForm(initialForm);
      router.push(`/parcel-success?id=${data.id}`);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar showCart />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <View style={styles.hero}>
          <Package size={48} color={palette.primary} />
          <Text style={styles.title}>{t("sendTitle")}</Text>
          <Text style={styles.subtitle}>{t("sendSubtitle")}</Text>
        </View>

        <View style={[styles.formCard, shadows.card]}>
          <Input
            label={t("pickupAddressLabel")}
            value={form.pickupAddress}
            onChangeText={(v) => update("pickupAddress", v)}
            placeholder={t("pickupAddressPlaceholder")}
          />
          <Input
            label={t("dropoffAddressLabel")}
            value={form.dropoffAddress}
            onChangeText={(v) => update("dropoffAddress", v)}
            placeholder={t("dropoffAddressPlaceholder")}
          />
          <Input
            label={t("receiverNameLabel")}
            value={form.receiverName}
            onChangeText={(v) => update("receiverName", v)}
          />
          <Input
            label={t("receiverPhoneLabel")}
            value={form.receiverPhone}
            onChangeText={(v) => update("receiverPhone", v)}
            keyboardType="phone-pad"
          />
          <Input
            label={t("itemDescriptionLabel")}
            value={form.itemDescription}
            onChangeText={(v) => update("itemDescription", v)}
            placeholder={t("itemDescriptionPlaceholder")}
          />
          <Input
            label={t("parcelCategoryLabel")}
            value={form.itemCategory}
            onChangeText={(v) => update("itemCategory", v)}
            placeholder={t("parcelCategoryPlaceholder")}
          />
          <Input
            label={t("weightLabel")}
            value={form.weightKg}
            onChangeText={(v) => update("weightKg", v)}
            placeholder={t("weightPlaceholder")}
            keyboardType="decimal-pad"
          />
          <Input
            label={t("parcelNotesLabel")}
            value={form.notes}
            onChangeText={(v) => update("notes", v)}
            placeholder={t("parcelNotesPlaceholder")}
            multiline
          />

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>{t("estimateFare")}</Text>
            <Text style={styles.fareValue}>{formatSAR(fare)}</Text>
          </View>

          <Button
            title={creating ? t("sendingRequest") : t("requestSend")}
            onPress={handleSubmit}
            loading={creating}
          />
        </View>

        <Text style={styles.sectionTitle}>{t("mySends")}</Text>
        {parcelsLoading && <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />}
        {parcels.length === 0 && !parcelsLoading && (
          <Text style={styles.emptyText}>{t("noSendsYet")}</Text>
        )}
        {parcels.map((p) => (
          <Pressable
            key={p.id}
            onPress={() =>
              p.payment_status === "pending"
                ? router.push(`/parcel-success?id=${p.id}`)
                : null
            }
            style={[styles.parcelCard, shadows.card]}
            accessibilityRole="button"
          >
            <View style={styles.parcelHeader}>
              <Text style={styles.parcelId}>
                {t("parcelId", { id: p.id.slice(-6).toUpperCase() })}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      p.payment_status === "verified"
                        ? `${palette.success}20`
                        : `${palette.warning}20`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        p.payment_status === "verified"
                          ? palette.success
                          : palette.warning,
                    },
                  ]}
                >
                  {p.payment_status === "verified"
                    ? t("paymentVerified")
                    : t("pendingPayment")}
                </Text>
              </View>
            </View>
            <Text style={styles.parcelMeta}>
              {t("parcelFare")}: {formatSAR(Number(p.fare_sar))}
            </Text>
            <Text style={styles.parcelMeta}>
              {t("parcelStatus")}: {p.status}
            </Text>
            {p.payment_status === "pending" && (
              <View style={styles.uploadHint}>
                <Upload size={14} color={palette.primary} />
                <Text style={styles.uploadHintText}>{t("uploadParcelReceipt")}</Text>
                <ChevronRight size={14} color={palette.primary} />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  hero: { alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.lg },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: palette.foreground,
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  formCard: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  fareLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: palette.foreground },
  fareValue: { fontFamily: fonts.display, fontSize: 20, color: palette.primary },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: palette.foreground,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.md,
  },
  parcelCard: {
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.sm,
  },
  parcelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  parcelId: { fontFamily: fonts.sansBold, fontSize: 14, color: palette.foreground },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: fonts.sansBold, fontSize: 11 },
  parcelMeta: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: spacing.xs,
  },
  uploadHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  uploadHintText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primary,
    flex: 1,
  },
});
