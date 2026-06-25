import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle, Upload, Banknote } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../src/lib/supabase";
import { useTranslation } from "../src/lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import type { Database } from "../src/lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export default function OrderSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const orderIds = ids ? ids.split(",") : [];

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(orderIds.length > 0);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (orderIds.length === 0) return;
    supabase
      .from("orders")
      .select("*")
      .in("id", orderIds)
      .then(({ data }) => {
        setOrders((data as OrderRow[]) ?? []);
        setOrdersLoading(false);
      });
  }, [ids]);

  const hasBankTransfer = orders.some((o) => o.payment_method === "bank_transfer");
  const hasCash = orders.some((o) => o.payment_method === "cash");

  const handlePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setReceipt(result.assets[0].uri);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!receipt || orderIds.length === 0) return;
    setUploading(true);
    try {
      const path = `orders/customer-${Date.now()}.jpg`;
      const file = await (await fetch(receipt)).blob();
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);

      const bankTransferIds = orders
        .filter((o) => o.payment_method === "bank_transfer")
        .map((o) => o.id);
      for (const id of bankTransferIds) {
        await supabase
          .from("orders")
          .update({ payment_receipt_url: data.publicUrl })
          .eq("id", id);
      }
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert("Upload failed", e.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, shadows.lift]}>
          <CheckCircle size={48} color={palette.success} />
        </View>

        <Text style={styles.title}>{t("orderSuccessTitle")}</Text>
        <Text style={styles.subtitle}>
          {orderIds.length > 0 ? t("orderSuccessSubtitle") : ""}
        </Text>

        {orderIds.length > 0 && (
          <>
            {hasBankTransfer && (
              <View style={[styles.receiptCard, shadows.card]}>
                <Text style={styles.receiptTitle}>{t("paymentReceipt")}</Text>
                {submitted ? (
                  <View style={styles.submittedBox}>
                    <CheckCircle size={20} color={palette.success} />
                    <Text style={styles.submittedText}>
                      {t("receiptSubmitted")}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Pressable onPress={handlePick} style={styles.uploadBox}>
                      {receipt ? (
                        <Image source={{ uri: receipt }} style={styles.uploadPreview} />
                      ) : (
                        <>
                          <Upload size={24} color={palette.primary} />
                          <Text style={styles.uploadText}>{t("tapToUploadReceipt")}</Text>
                        </>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={handleSubmitReceipt}
                      disabled={!receipt || uploading}
                      style={[
                        styles.submitButton,
                        (!receipt || uploading) && styles.submitButtonDisabled,
                      ]}
                    >
                      {uploading ? (
                        <ActivityIndicator color={palette.primaryForeground} />
                      ) : (
                        <Text style={styles.submitButtonText}>{t("submitReceipt")}</Text>
                      )}
                    </Pressable>
                  </>
                )}
              </View>
            )}

            {hasCash && (
              <View style={[styles.receiptCard, shadows.card]}>
                <View style={styles.codHeader}>
                  <Banknote size={20} color={palette.success} />
                  <Text style={styles.receiptTitle}>{t("cashOnDelivery")}</Text>
                </View>
                <Text style={styles.codBody}>{t("codSuccessBody")}</Text>
              </View>
            )}
          </>
        )}

        <View style={[styles.infoCard, shadows.card]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>🎉</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>{t("whatHappensNext")}</Text>
              <Text style={styles.infoBody}>{t("orderSuccessBody")}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>💬</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>{t("questions")}</Text>
              <Text style={styles.infoBody}>{t("orderSuccessQuestionsBody")}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/(tabs)/orders")}
        >
          <Text style={styles.primaryButtonText}>{t("viewMyOrders")}</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/(tabs)/")}
        >
          <Text style={styles.secondaryButtonText}>{t("continueShopping")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(76,175,80,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${palette.border}80`,
  },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 26,
    color: palette.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  infoCard: {
    width: "100%",
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.card,
  },
  infoRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  infoEmoji: {
    fontSize: 22,
  },
  infoText: {
    flex: 1,
    gap: spacing.xs,
  },
  infoTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  infoBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    lineHeight: 18,
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: 14,
    alignItems: "center",
    ...shadows.card,
  },
  primaryButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.primaryForeground,
  },
  secondaryButton: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.xl,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  receiptTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: palette.foreground,
  },
  uploadBox: {
    height: 140,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: palette.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadPreview: {
    width: "100%",
    height: "100%",
  },
  uploadText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: spacing.sm,
  },
  submitButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.primaryForeground,
  },
  submittedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(76,175,80,0.1)",
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  submittedText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.success,
    flex: 1,
  },
  codHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  codBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    lineHeight: 18,
  },
});
