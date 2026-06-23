import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle, Upload, ArrowLeft } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../src/lib/supabase";
import { useCustomerParcels } from "../src/hooks/useCustomerParcels";
import { useTranslation } from "../src/lib/i18n";
import { formatSAR } from "../src/lib/demo-data";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { Button } from "../src/components/Button";

export default function ParcelSuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: parcels, isLoading, refresh, uploadReceipt } = useCustomerParcels();

  const [receipt, setReceipt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const parcel = parcels.find((p) => p.id === id);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setReceipt(result.assets[0].uri);
      setSubmitted(false);
    }
  };

  const handleSubmit = async () => {
    if (!receipt || !parcel) return;
    setUploading(true);
    try {
      const path = `parcels/${parcel.id}-${Date.now()}.jpg`;
      const file = await (await fetch(receipt)).blob();
      const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      const { error } = await uploadReceipt(parcel.id, data.publicUrl);
      if (error) throw error;
      setSubmitted(true);
      setReceipt(null);
    } catch (e) {
      Alert.alert(t("uploadFailed"), String(e));
    }
    setUploading(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
          <ArrowLeft size={24} color={palette.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("parcelRequestSubmitted")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <View style={styles.successBox}>
          <View style={[styles.iconCircle, { backgroundColor: `${palette.success}20` }]}>
            <CheckCircle size={32} color={palette.success} />
          </View>
          <Text style={styles.title}>{t("parcelRequestSubmitted")}</Text>
          <Text style={styles.subtitle}>{t("parcelRequestSubtitle")}</Text>
          {parcel && (
            <Text style={styles.fareText}>
              {t("parcelFare")}: {formatSAR(Number(parcel.fare_sar))}
            </Text>
          )}
        </View>

        {parcel?.payment_status !== "verified" && (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>{t("uploadParcelReceipt")}</Text>

            <Pressable onPress={handlePickImage} style={styles.uploadBox} accessibilityRole="button">
              {receipt ? (
                <Image source={{ uri: receipt }} style={styles.preview} />
              ) : parcel?.payment_receipt_url ? (
                <Image source={{ uri: parcel.payment_receipt_url }} style={styles.preview} />
              ) : (
                <>
                  <Upload size={24} color={palette.primary} />
                  <Text style={styles.uploadText}>{t("tapToUploadReceipt")}</Text>
                </>
              )}
            </Pressable>

            <Button
              title={uploading ? t("uploading") : t("submitReceipt")}
              onPress={handleSubmit}
              loading={uploading}
              disabled={!receipt || uploading}
              style={{ marginTop: spacing.md }}
            />

            {submitted && (
              <Text style={styles.successMessage}>{t("parcelReceiptSubmitted")}</Text>
            )}
          </View>
        )}

        <Button
          title={t("continueShopping")}
          variant="outline"
          onPress={() => router.replace("/(tabs)/")}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.md,
  },
  back: { padding: spacing.sm },
  headerTitle: { fontFamily: fonts.display, fontSize: 20, color: palette.foreground },
  successBox: { alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.lg },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  fareText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: palette.primary,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: palette.foreground,
    marginBottom: spacing.md,
  },
  uploadBox: {
    height: 160,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: palette.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
  },
  preview: { width: "100%", height: "100%", borderRadius: radii.xl },
  uploadText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.primary,
    marginTop: spacing.sm,
  },
  successMessage: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.success,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
