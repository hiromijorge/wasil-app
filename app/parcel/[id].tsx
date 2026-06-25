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
import {
  Package,
  MapPin,
  User,
  Truck,
  Bike,
  Car,
  CheckCircle,
  Upload,
  Navigation,
  Banknote,
} from "lucide-react-native";
import { Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { TopBar } from "../../src/components/TopBar";
import { Button } from "../../src/components/Button";
import { useParcel } from "../../src/hooks/useParcel";
import { useCustomerParcels } from "../../src/hooks/useCustomerParcels";
import { useTranslation, type TranslationKey } from "../../src/lib/i18n";
import { formatSAR } from "../../src/lib/format";
import { supabase } from "../../src/lib/supabase";
import { palette, fonts, typography, spacing, radii, shadows } from "../../src/lib/theme";

const deliverySteps = [
  "pending",
  "accepted",
  "picked_up",
  "on_the_way",
  "delivered",
] as const;

function parcelStatusKey(status: string): TranslationKey {
  switch (status) {
    case "pending":
      return "parcelStatusPending";
    case "accepted":
      return "parcelStatusAccepted";
    case "picked_up":
      return "parcelStatusPickedUp";
    case "on_the_way":
      return "parcelStatusOnTheWay";
    case "delivered":
      return "parcelStatusDelivered";
    case "cancelled":
      return "parcelStatusCancelled";
    default:
      return "parcelStatusPending";
  }
}

function parcelVehicleKey(vehicle: string | null | undefined): TranslationKey {
  switch (vehicle) {
    case "bike":
      return "bike";
    case "car":
      return "car";
    case "van":
      return "van";
    default:
      return "bike";
  }
}

function parcelStatusColor(status: string) {
  switch (status) {
    case "delivered":
      return palette.success;
    case "cancelled":
      return palette.destructive;
    case "pending":
    case "accepted":
    case "picked_up":
    case "on_the_way":
    default:
      return palette.primary;
  }
}

function locationAddress(location: unknown) {
  return (location as { address?: string })?.address ?? "";
}

function openInMaps(location: { lat?: number; lng?: number; address?: string }) {
  const { lat, lng, address } = location;
  if (typeof lat === "number" && typeof lng === "number") {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {});
  } else if (address) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => {});
  }
}

function renderDetails(details: unknown) {
  const d = details as Record<string, string | undefined> | null;
  if (!d) return null;
  const parts: string[] = [];
  if (d.contact_name) parts.push(d.contact_name);
  if (d.receiver_name) parts.push(d.receiver_name);
  if (d.phone) parts.push(d.phone);
  if (d.building_floor) parts.push(d.building_floor);
  if (d.notes) parts.push(d.notes);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function FareBreakdownRows({ breakdown }: { breakdown: unknown }) {
  const { t } = useTranslation();
  const b = breakdown as {
    baseFare?: number;
    distanceCharge?: number;
    weightCharge?: number;
    total?: number;
  } | null;

  if (!b) {
    return null;
  }

  return (
    <View style={styles.breakdown}>
      {b.baseFare != null && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{t("baseFare")}</Text>
          <Text style={styles.breakdownValue}>{formatSAR(b.baseFare)}</Text>
        </View>
      )}
      {b.distanceCharge != null && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{t("distanceCharge")}</Text>
          <Text style={styles.breakdownValue}>{formatSAR(b.distanceCharge)}</Text>
        </View>
      )}
      {b.weightCharge != null && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{t("weightCharge")}</Text>
          <Text style={styles.breakdownValue}>{formatSAR(b.weightCharge)}</Text>
        </View>
      )}
      <View style={[styles.breakdownRow, styles.breakdownTotal]}>
        <Text style={styles.breakdownTotalLabel}>{t("totalFare")}</Text>
        <Text style={styles.breakdownTotalValue}>{formatSAR(b.total ?? 0)}</Text>
      </View>
    </View>
  );
}

export default function ParcelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: parcel, isLoading, refresh } = useParcel(id);
  const { refresh: refreshList } = useCustomerParcels();

  const [receipt, setReceipt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmitReceipt = async () => {
    if (!receipt || !parcel) return;
    setUploading(true);
    try {
      const path = `parcels/${parcel.id}-${Date.now()}.jpg`;
      const file = await (await fetch(receipt)).blob();
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      const { error } = await supabase
        .from("parcel_deliveries")
        .update({ payment_receipt_url: data.publicUrl })
        .eq("id", parcel.id);
      if (error) throw error;
      await refresh();
      await refreshList();
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

  if (!parcel) {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.lg }]}>
        <Text style={styles.notFound}>{t("parcelNotFound")}</Text>
        <Button
          title={t("goBack")}
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const currentStepIndex = deliverySteps.indexOf(
    parcel.status as (typeof deliverySteps)[number]
  );

  return (
    <View style={styles.container}>
      <TopBar showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        {/* Header */}
        <View style={[styles.headerCard, shadows.card]}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${palette.primary}15` },
              ]}
            >
              <Package size={24} color={palette.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.parcelId}>
                {t("parcelId", { id: parcel.id.slice(-6).toUpperCase() })}
              </Text>
              <Text style={styles.fare}>
                {formatSAR(Number(parcel.fare_sar))}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${parcelStatusColor(parcel.status)}15`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: parcelStatusColor(parcel.status) },
              ]}
            >
              {t(parcelStatusKey(parcel.status))}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        {parcel.status !== "cancelled" && (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>{t("trackSend")}</Text>
            {deliverySteps.map((step, index) => {
              const active = currentStepIndex >= index;
              const isCurrent = currentStepIndex === index;
              return (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepLineWrap}>
                    <View
                      style={[
                        styles.stepDot,
                        active && styles.stepDotActive,
                        isCurrent && styles.stepDotCurrent,
                      ]}
                    />
                    {index !== deliverySteps.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          currentStepIndex > index && styles.stepLineActive,
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      active && styles.stepLabelActive,
                      isCurrent && styles.stepLabelCurrent,
                    ]}
                  >
                    {t(parcelStatusKey(step))}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Details */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>{t("sendDetails")}</Text>

          <Pressable
            onPress={() => openInMaps((parcel.pickup_location as any) ?? {})}
            style={styles.detailRow}
            accessibilityRole="button"
          >
            <MapPin size={16} color={palette.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("pickupFrom")}</Text>
              <Text style={styles.detailValue}>
                {locationAddress(parcel.pickup_location)}
              </Text>
              {renderDetails(parcel.pickup_details) && (
                <Text style={styles.detailExtra}>
                  {renderDetails(parcel.pickup_details)}
                </Text>
              )}
            </View>
            <Navigation size={16} color={palette.primary} />
          </Pressable>

          <Pressable
            onPress={() => openInMaps((parcel.dropoff_location as any) ?? {})}
            style={styles.detailRow}
            accessibilityRole="button"
          >
            <MapPin size={16} color={palette.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("deliverTo")}</Text>
              <Text style={styles.detailValue}>
                {locationAddress(parcel.dropoff_location)}
              </Text>
              {renderDetails(parcel.dropoff_details) && (
                <Text style={styles.detailExtra}>
                  {renderDetails(parcel.dropoff_details)}
                </Text>
              )}
            </View>
            <Navigation size={16} color={palette.primary} />
          </Pressable>

          <View style={styles.detailRow}>
            <User size={16} color={palette.mutedForeground} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("receiver")}</Text>
              <Text style={styles.detailValue}>
                {parcel.receiver_name} · {parcel.receiver_phone}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Package size={16} color={palette.mutedForeground} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("parcelItem")}</Text>
              <Text style={styles.detailValue}>
                {parcel.item_description}
                {parcel.item_category ? ` · ${parcel.item_category}` : ""}
              </Text>
            </View>
          </View>

          {parcel.weight_kg ? (
            <View style={styles.detailRow}>
              <Truck size={16} color={palette.mutedForeground} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t("parcelWeight")}</Text>
                <Text style={styles.detailValue}>{parcel.weight_kg} kg</Text>
              </View>
            </View>
          ) : null}

          {parcel.notes ? (
            <View style={styles.detailRow}>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t("parcelNotes")}</Text>
                <Text style={styles.detailValue}>{parcel.notes}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Fare breakdown */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>{t("fareBreakdown")}</Text>
          <View style={styles.detailRow}>
            {parcel.vehicle_type === "car" ? (
              <Car size={16} color={palette.mutedForeground} />
            ) : parcel.vehicle_type === "van" ? (
              <Truck size={16} color={palette.mutedForeground} />
            ) : (
              <Bike size={16} color={palette.mutedForeground} />
            )}
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("parcelVehicleTypeLabel")}</Text>
              <Text style={styles.detailValue}>{t(parcelVehicleKey(parcel.vehicle_type))}</Text>
            </View>
          </View>
          {parcel.distance_km != null && (
            <View style={styles.detailRow}>
              <Navigation size={16} color={palette.mutedForeground} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t("distanceKm")}</Text>
                <Text style={styles.detailValue}>{parcel.distance_km} km</Text>
              </View>
            </View>
          )}
          {parcel.length_cm && parcel.width_cm && parcel.height_cm && (
            <View style={styles.detailRow}>
              <Package size={16} color={palette.mutedForeground} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t("sizeCategoryLabel")}</Text>
                <Text style={styles.detailValue}>
                  {parcel.length_cm}×{parcel.width_cm}×{parcel.height_cm} cm
                </Text>
              </View>
            </View>
          )}
          <FareBreakdownRows breakdown={parcel.fare_breakdown} />
        </View>

        {/* Receipt */}
        {parcel.payment_method === "cash" ? (
          <View style={[styles.card, shadows.card]}>
            <View style={styles.codHeader}>
              <Banknote size={20} color={palette.success} />
              <Text style={styles.cardTitle}>{t("cashOnDelivery")}</Text>
            </View>
            <Text style={styles.codBody}>
              {t("codParcelSuccessBody", {
                payer: t(parcel.cash_payer === "sender" ? "cashPayerSender" : "cashPayerReceiver"),
              })}
            </Text>
          </View>
        ) : (
          <>
            {(parcel.payment_status === "pending" ||
              parcel.payment_status === "rejected") && (
              <View style={[styles.card, shadows.card]}>
                <Text style={styles.cardTitle}>
                  {parcel.payment_status === "rejected"
                    ? t("reuploadReceipt")
                    : t("uploadParcelReceipt")}
                </Text>

                <Pressable
                  onPress={handlePickImage}
                  style={styles.uploadBox}
                  accessibilityRole="button"
                >
                  {receipt ? (
                    <Image source={{ uri: receipt }} style={styles.preview} />
                  ) : parcel.payment_receipt_url ? (
                    <Image
                      source={{ uri: parcel.payment_receipt_url }}
                      style={styles.preview}
                    />
                  ) : (
                    <>
                      <Upload size={24} color={palette.primary} />
                      <Text style={styles.uploadText}>
                        {t("tapToUploadReceipt")}
                      </Text>
                    </>
                  )}
                </Pressable>

                <Button
                  title={uploading ? t("uploading") : t("submitReceipt")}
                  onPress={handleSubmitReceipt}
                  loading={uploading}
                  disabled={!receipt || uploading}
                  style={{ marginTop: spacing.md }}
                />

                {submitted && (
                  <Text style={styles.successMessage}>
                    {t("parcelReceiptSubmitted")}
                  </Text>
                )}
              </View>
            )}

            {parcel.payment_status === "verified" && (
              <View
                style={[
                  styles.card,
                  shadows.card,
                  { alignItems: "center", gap: spacing.xs },
                ]}
              >
                <CheckCircle size={32} color={palette.success} />
                <Text style={[styles.statusText, { color: palette.success }]}>
                  {t("paymentVerified")}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Proof photos */}
        {(parcel.pickup_photo_url || parcel.delivery_proof_url) && (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>{t("parcelDeliveryProof")}</Text>
            {parcel.pickup_photo_url && (
              <View style={styles.proofWrap}>
                <Text style={styles.proofLabel}>
                  {t("parcelPickupPhoto")}
                </Text>
                <Image
                  source={{ uri: parcel.pickup_photo_url }}
                  style={styles.proofImage}
                />
              </View>
            )}
            {parcel.delivery_proof_url && (
              <View style={styles.proofWrap}>
                <Text style={styles.proofLabel}>
                  {t("parcelDeliveryProof")}
                </Text>
                <Image
                  source={{ uri: parcel.delivery_proof_url }}
                  style={styles.proofImage}
                />
              </View>
            )}
          </View>
        )}

        <Button
          title={t("mySends")}
          variant="outline"
          onPress={() => router.push("/send")}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    ...typography.pageTitle,
    textAlign: "center",
  },
  headerCard: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    gap: spacing.md,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  parcelId: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.foreground,
  },
  fare: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: palette.foreground,
  },
  breakdown: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  breakdownValue: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.foreground,
  },
  breakdownTotal: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  breakdownTotalLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: palette.foreground,
  },
  breakdownTotalValue: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: palette.foreground,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  statusText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    gap: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    height: 48,
  },
  stepLineWrap: {
    width: 18,
    height: "100%",
    alignItems: "center",
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.border,
    borderWidth: 2,
    borderColor: palette.border,
  },
  stepDotActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  stepDotCurrent: {
    backgroundColor: palette.card,
    borderColor: palette.primary,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: palette.border,
    marginVertical: 2,
    minHeight: 24,
  },
  stepLineActive: {
    backgroundColor: palette.primary,
  },
  stepLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  stepLabelActive: {
    fontFamily: fonts.sansSemiBold,
    color: palette.foreground,
  },
  stepLabelCurrent: {
    fontFamily: fonts.sansSemiBold,
    color: palette.primary,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  detailText: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  detailValue: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.foreground,
    lineHeight: 20,
  },
  detailExtra: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
    lineHeight: 18,
    marginTop: 2,
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
  preview: {
    width: "100%",
    height: "100%",
    borderRadius: radii.xl,
  },
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
  },
  codHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  codBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    lineHeight: 18,
  },
  proofWrap: {
    gap: spacing.sm,
  },
  proofLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  proofImage: {
    width: "100%",
    height: 180,
    borderRadius: radii.xl,
  },
});
