import type { Dispatch, SetStateAction } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Modal,
} from "react-native";
import { Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  MapPin,
  Package,
  Phone,
  User,
  Truck,
  DollarSign,
  Navigation,
} from "lucide-react-native";
import { useTranslation, type TranslationKey } from "../../src/lib/i18n";
import { formatSAR } from "../../src/lib/format";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import type { Database } from "../../src/lib/database.types";

export type DeliveryRow = Database["public"]["Tables"]["deliveries"]["Row"];
export type DeliveryStatus = DeliveryRow["status"];
export type DriverDeliveryRow = import("../../src/hooks/useDriverDeliveries").DriverDelivery;
export type ParcelRow = Database["public"]["Tables"]["parcel_deliveries"]["Row"];
export type ParcelStatus = ParcelRow["status"];

const STATUS_FLOW: DeliveryStatus[] = ["assigned", "accepted", "picked_up", "on_the_way", "delivered"];

export function nextDeliveryStatus(current: DeliveryStatus): DeliveryStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

const PARCEL_STATUS_FLOW: ParcelStatus[] = ["pending", "accepted", "picked_up", "on_the_way", "delivered"];

export function nextParcelStatus(current: ParcelStatus): ParcelStatus | null {
  const idx = PARCEL_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= PARCEL_STATUS_FLOW.length - 1) return null;
  return PARCEL_STATUS_FLOW[idx + 1];
}

const STATUS_KEY: Record<DeliveryStatus | ParcelStatus, TranslationKey> = {
  assigned: "statusAssigned",
  accepted: "statusAccepted",
  picked_up: "statusPickedUp",
  on_the_way: "statusOnTheWay",
  delivered: "statusDelivered",
  pending: "statusPending",
  cancelled: "statusInactive",
};

export function statusLabel(
  status: DeliveryStatus | ParcelStatus,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
) {
  return t(STATUS_KEY[status]);
}

export function openInMaps(location: { lat?: number; lng?: number; address?: string }) {
  const { lat, lng, address } = location;
  if (typeof lat === "number" && typeof lng === "number") {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {});
  } else if (address) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => {});
  }
}

export function formatDetails(details: unknown) {
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

export function DeliveryCard({
  delivery,
  uploading,
  onUpdate,
  onAccept,
  compact,
  t,
}: {
  delivery: DriverDeliveryRow;
  uploading: boolean;
  onUpdate: (d: DriverDeliveryRow, s: DeliveryRow["status"], requireProof?: boolean) => void;
  onAccept?: () => void;
  compact?: boolean;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const pickup = (delivery.pickup_location as any) ?? { address: "Store location" };
  const dropoff = (delivery.delivery_location as any) ?? { address: "Customer location" };
  const details = formatDetails(delivery.delivery_details);
  const next = nextDeliveryStatus(delivery.status);
  const isUnassigned = delivery.status === "assigned" && !delivery.driver_id;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          <Truck size={18} color={palette.primary} />
          <Text style={styles.cardTitle}>{delivery.id.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: delivery.status === "delivered" ? "#e9f7ef" : "#fff3e0" }]}>
          <Text style={[styles.statusText, { color: delivery.status === "delivered" ? palette.success : palette.warning }]}>
            {statusLabel(delivery.status, t)}
          </Text>
        </View>
      </View>

      <Pressable onPress={() => openInMaps(pickup)} style={styles.infoRow} accessibilityRole="button">
        <MapPin size={14} color={palette.primary} />
        <Text style={styles.infoText}>{t("pickup")}: {pickup.address}</Text>
        <Navigation size={14} color={palette.primary} />
      </Pressable>
      <Pressable onPress={() => openInMaps(dropoff)} style={styles.infoRow} accessibilityRole="button">
        <MapPin size={14} color={palette.primary} />
        <Text style={styles.infoText}>{t("dropoff")}: {dropoff.address}</Text>
        <Navigation size={14} color={palette.primary} />
      </Pressable>
      {delivery.customer_name && (
        <View style={styles.infoRow}>
          <User size={14} color={palette.mutedForeground} />
          <Text style={styles.infoText}>{delivery.customer_name}</Text>
        </View>
      )}
      {delivery.customer_phone && (
        <View style={styles.infoRow}>
          <Phone size={14} color={palette.mutedForeground} />
          <Text style={styles.infoText}>{delivery.customer_phone}</Text>
        </View>
      )}
      {details && (
        <View style={styles.infoRow}>
          <Package size={14} color={palette.mutedForeground} />
          <Text style={styles.infoText}>{details}</Text>
        </View>
      )}
      <View style={styles.infoRow}>
        <DollarSign size={14} color={palette.mutedForeground} />
        <Text style={styles.infoText}>{t("fee")}: {formatSAR(Number(delivery.delivery_fee_sar))}</Text>
      </View>

      {delivery.orders?.payment_method === "cash" && (
        <View style={styles.codBadgeSmall}>
          <Text style={styles.codBadgeSmallText}>{t("cashOnDelivery")}</Text>
        </View>
      )}

      {delivery.proof_photo_url && (
        <Image source={{ uri: delivery.proof_photo_url }} style={styles.proofImage} />
      )}

      {!compact && isUnassigned && onAccept && (
        <Button
          title={t("acceptDelivery")}
          variant="primary"
          size="lg"
          onPress={onAccept}
          style={{ marginTop: spacing.md }}
        />
      )}

      {!compact && !isUnassigned && next && (
        <Button
          title={uploading ? t("uploading") : statusLabel(next, t)}
          variant="primary"
          size="lg"
          loading={uploading}
          onPress={() => onUpdate(delivery, next, next === "delivered")}
          style={{ marginTop: spacing.md }}
        />
      )}
    </View>
  );
}

export function ParcelCard({
  parcel,
  uploading,
  onUpdate,
  onAccept,
  t,
}: {
  parcel: ParcelRow;
  uploading: boolean;
  onUpdate: (p: ParcelRow, s: ParcelStatus, requireProof?: boolean) => void;
  onAccept?: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const pickup = (parcel.pickup_location as any) ?? { address: "Pickup location" };
  const dropoff = (parcel.dropoff_location as any) ?? { address: "Dropoff location" };
  const pickupDetails = formatDetails(parcel.pickup_details);
  const dropoffDetails = formatDetails(parcel.dropoff_details);
  const next = nextParcelStatus(parcel.status);
  const isUnassigned = parcel.status === "pending" && !parcel.driver_id;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          <Package size={18} color={palette.primary} />
          <Text style={styles.cardTitle}>{parcel.id.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: parcel.status === "delivered" ? "#e9f7ef" : "#fff3e0" }]}>
          <Text style={[styles.statusText, { color: parcel.status === "delivered" ? palette.success : palette.warning }]}>
            {statusLabel(parcel.status, t)}
          </Text>
        </View>
      </View>

      <Pressable onPress={() => openInMaps(pickup)} style={styles.infoRow} accessibilityRole="button">
        <MapPin size={14} color={palette.primary} />
        <Text style={styles.infoText}>{t("pickup")}: {pickup.address}</Text>
        <Navigation size={14} color={palette.primary} />
      </Pressable>
      {pickupDetails && (
        <View style={styles.infoRow}>
          <User size={14} color={palette.mutedForeground} />
          <Text style={styles.infoText}>{pickupDetails}</Text>
        </View>
      )}

      <Pressable onPress={() => openInMaps(dropoff)} style={styles.infoRow} accessibilityRole="button">
        <MapPin size={14} color={palette.primary} />
        <Text style={styles.infoText}>{t("dropoff")}: {dropoff.address}</Text>
        <Navigation size={14} color={palette.primary} />
      </Pressable>
      {dropoffDetails && (
        <View style={styles.infoRow}>
          <User size={14} color={palette.mutedForeground} />
          <Text style={styles.infoText}>{dropoffDetails}</Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <DollarSign size={14} color={palette.mutedForeground} />
        <Text style={styles.infoText}>{t("fee")}: {formatSAR(Number(parcel.fare_sar))}</Text>
      </View>

      {parcel.payment_method === "cash" && (
        <View style={styles.codBadgeSmall}>
          <Text style={styles.codBadgeSmallText}>{t("cashOnDelivery")}</Text>
        </View>
      )}

      {parcel.delivery_proof_url && (
        <Image source={{ uri: parcel.delivery_proof_url }} style={styles.proofImage} />
      )}

      {isUnassigned && onAccept && (
        <Button
          title={t("acceptParcel")}
          variant="primary"
          size="lg"
          onPress={onAccept}
          style={{ marginTop: spacing.md }}
        />
      )}

      {!isUnassigned && next && (
        <Button
          title={uploading ? t("uploading") : statusLabel(next, t)}
          variant="primary"
          size="lg"
          loading={uploading}
          onPress={() => onUpdate(parcel, next, next === "delivered")}
          style={{ marginTop: spacing.md }}
        />
      )}
    </View>
  );
}

export type CashModalState = {
  visible: boolean;
  type: "order" | "parcel";
  record: DeliveryRow | ParcelRow;
  amount: string;
  photoUri: string | null;
} | null;

export function CashModal({
  cashModal,
  setCashModal,
  uploading,
  onConfirm,
}: {
  cashModal: CashModalState;
  setCashModal: Dispatch<SetStateAction<CashModalState>>;
  uploading: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  if (!cashModal) return null;

  return (
    <Modal
      visible={cashModal.visible}
      transparent
      animationType="slide"
      onRequestClose={() => setCashModal(null)}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>{t("collectCash")}</Text>
          <Text style={modalStyles.subtitle}>
            {cashModal.type === "order" ? t("collectCashOrder") : t("collectCashParcel")}
          </Text>

          <Input
            label={t("cashCollected")}
            value={cashModal.amount}
            onChangeText={(v) =>
              setCashModal((prev) => (prev ? { ...prev, amount: v } : prev))
            }
            keyboardType="decimal-pad"
            placeholder={t("cashCollectedPlaceholder")}
          />

          <Pressable
            style={modalStyles.photoButton}
            onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: true,
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]?.uri) {
                setCashModal((prev) =>
                  prev ? { ...prev, photoUri: result.assets[0].uri } : prev
                );
              }
            }}
          >
            <Text style={modalStyles.photoButtonText}>
              {cashModal.photoUri ? t("receiptSelected") : t("tapToUploadReceipt")}
            </Text>
          </Pressable>

          <View style={modalStyles.actions}>
            <Button
              title={t("cancel")}
              variant="outline"
              onPress={() => setCashModal(null)}
            />
            <Button
              title={t("confirm")}
              onPress={onConfirm}
              loading={uploading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: palette.card,
    borderTopLeftRadius: radii["3xl"],
    borderTopRightRadius: radii["3xl"],
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    textAlign: "center",
  },
  photoButton: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  photoButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.primary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
});

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.display, fontSize: 22, color: palette.foreground },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: palette.mutedForeground, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.lg },
  signOutButton: { padding: spacing.sm },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  signOutText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: palette.destructive },
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: palette.foreground },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: "capitalize" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  infoText: { fontFamily: fonts.sansMedium, fontSize: 13, color: palette.foreground, flex: 1 },
  proofImage: { width: "100%", height: 160, borderRadius: radii.lg, marginTop: spacing.md },
  codBadgeSmall: {
    alignSelf: "flex-start",
    backgroundColor: `${palette.success}20`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.sm,
  },
  codBadgeSmallText: { fontFamily: fonts.sansBold, fontSize: 10, color: palette.success },
});
