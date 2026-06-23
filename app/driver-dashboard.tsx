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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MapPin,
  Package,
  Phone,
  CheckCircle,
  Truck,
  DollarSign,
  ClipboardList,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/lib/auth-context";
import { useDriverRecord } from "../src/hooks/useDriverRecord";
import { useDriverDeliveries } from "../src/hooks/useDriverDeliveries";
import { useDriverParcels } from "../src/hooks/useDriverParcels";
import { formatSAR } from "../src/lib/demo-data";
import { useTranslation } from "../src/lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { LangSwitcher } from "../src/components/LangSwitcher";
import { DashboardHeader, DashboardPage } from "../src/components/DashboardLayout";
import type { Database } from "../src/lib/database.types";

type DeliveryRow = Database["public"]["Tables"]["deliveries"]["Row"];
type DeliveryStatus = DeliveryRow["status"];

const STATUS_FLOW: DeliveryStatus[] = ["assigned", "accepted", "picked_up", "on_the_way", "delivered"];

function nextDeliveryStatus(current: DeliveryStatus): DeliveryStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

const STATUS_KEY: Record<DeliveryStatus | ParcelStatus, import("../src/lib/i18n").TranslationKey> = {
  assigned: "statusAssigned",
  accepted: "statusAccepted",
  picked_up: "statusPickedUp",
  on_the_way: "statusOnTheWay",
  delivered: "statusDelivered",
  pending: "statusPending",
  cancelled: "statusInactive",
};

function statusLabel(
  status: DeliveryStatus | ParcelStatus,
  t: (key: import("../src/lib/i18n").TranslationKey, params?: Record<string, string | number>) => string,
) {
  return t(STATUS_KEY[status]);
}

export default function DriverDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  const { data: driver, isLoading: driverLoading, refresh: refreshDriver } = useDriverRecord();
  const {
    data: deliveries,
    isLoading: deliveriesLoading,
    updateStatus,
    acceptDelivery,
    refresh,
  } = useDriverDeliveries(driver?.id);

  const {
    data: parcels,
    isLoading: parcelsLoading,
    updateStatus: updateParcelStatus,
    acceptParcel,
    refresh: refreshParcels,
  } = useDriverParcels(driver?.id);

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    nationalId: "",
    vehicleType: "",
    vehiclePlate: "",
  });

  const handleUpdate = async (delivery: DeliveryRow, status: DeliveryStatus, requireProof = false) => {
    let proofUrl = delivery.proof_photo_url;
    if (requireProof) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]?.uri) return;
      setUploadingId(delivery.id);
      try {
        const path = `deliveries/${delivery.id}-${Date.now()}.jpg`;
        const file = await (await fetch(result.assets[0].uri)).blob();
        const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("receipts").getPublicUrl(path);
        proofUrl = data.publicUrl;
      } catch (e) {
        Alert.alert(t("uploadFailed"), String(e));
        setUploadingId(null);
        return;
      }
      setUploadingId(null);
    }
    await updateStatus(delivery.id, status, proofUrl ?? undefined);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const handleApply = async () => {
    if (!user) return;
    if (!form.fullName || !form.phone || !form.nationalId || !form.vehicleType || !form.vehiclePlate) {
      Alert.alert(t("tryAgain"), "Please fill in all required fields.");
      return;
    }
    setApplying(true);
    const { error } = await supabase.from("drivers").insert({
      user_id: user.id,
      full_name: form.fullName.trim(),
      phone: form.phone.trim(),
      national_id: form.nationalId.trim(),
      vehicle_type: form.vehicleType.trim(),
      vehicle_plate_number: form.vehiclePlate.trim(),
      status: "pending_review",
    });
    setApplying(false);
    if (error) {
      Alert.alert(t("tryAgain"), error.message);
    } else {
      await refreshDriver();
    }
  };

  if (driverLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!driver) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.center,
          { padding: spacing.lg, paddingTop: insets.top + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Truck size={48} color={palette.primary} style={{ marginBottom: spacing.md }} />
        <Text style={styles.title}>{t("driverNotFound")}</Text>
        <Text style={styles.subtitle}>{t("driverNotFoundMessage")}</Text>

        <View style={{ width: "100%", maxWidth: 400, marginTop: spacing.lg }}>
          <Input
            label={t("fullNameLabel")}
            value={form.fullName}
            onChangeText={(text) => setForm((f) => ({ ...f, fullName: text }))}
            autoCapitalize="words"
          />
          <Input
            label={t("phoneLabel")}
            value={form.phone}
            onChangeText={(text) => setForm((f) => ({ ...f, phone: text }))}
            keyboardType="phone-pad"
          />
          <Input
            label={t("nationalIdLabel")}
            value={form.nationalId}
            onChangeText={(text) => setForm((f) => ({ ...f, nationalId: text }))}
          />
          <Input
            label={t("vehicleTypeLabel")}
            value={form.vehicleType}
            onChangeText={(text) => setForm((f) => ({ ...f, vehicleType: text }))}
            placeholder="e.g. Motorcycle"
          />
          <Input
            label={t("vehiclePlateLabel")}
            value={form.vehiclePlate}
            onChangeText={(text) => setForm((f) => ({ ...f, vehiclePlate: text }))}
          />
          <Button
            title={t("submitApplication")}
            onPress={handleApply}
            loading={applying}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <Button title={t("signOut")} variant="outline" onPress={handleSignOut} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    );
  }

  if (driver.status !== "active") {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.lg }]}>
        <ClipboardList size={48} color={palette.warning} style={{ marginBottom: spacing.md }} />
        <Text style={styles.title}>{t("applicationSubmitted")}</Text>
        <Text style={styles.subtitle}>{t("applicationPendingMessage")}</Text>
        <Button title={t("signOut")} variant="outline" onPress={handleSignOut} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const active = deliveries.filter((d) => d.status !== "delivered");
  const completed = deliveries.filter((d) => d.status === "delivered");

  return (
    <View style={styles.container}>
      <DashboardHeader
        overline={t("driverConsole")}
        title={driver.full_name}
        right={
          <View style={styles.headerRight}>
            <LangSwitcher />
            <Pressable onPress={handleSignOut} style={styles.signOutButton} accessibilityRole="button">
              <Text style={styles.signOutText}>{t("signOut")}</Text>
            </Pressable>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <DashboardPage>
          {/* Summary cards */}
          <View style={styles.statsGrid}>
          <View style={[styles.statCard, shadows.card]}>
            <ClipboardList size={20} color={palette.primary} />
            <Text style={styles.statValue}>{active.length}</Text>
            <Text style={styles.statLabel}>{t("active")}</Text>
          </View>
          <View style={[styles.statCard, shadows.card]}>
            <CheckCircle size={20} color={palette.success} />
            <Text style={styles.statValue}>{driver.deliveries_completed}</Text>
            <Text style={styles.statLabel}>{t("completed")}</Text>
          </View>
          <View style={[styles.statCard, shadows.card]}>
            <DollarSign size={20} color={palette.warning} />
            <Text style={styles.statValue}>{formatSAR(Number(driver.earnings_total_sar))}</Text>
            <Text style={styles.statLabel}>{t("earnings")}</Text>
          </View>
        </View>

        {/* Active deliveries */}
        <Text style={styles.sectionTitle}>{t("activeDeliveries")}</Text>
        {deliveriesLoading && <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />}
        {active.length === 0 && !deliveriesLoading && (
          <Text style={styles.emptyText}>{t("noActiveDeliveries")}</Text>
        )}
        {active.map((d) => (
          <DeliveryCard
            key={d.id}
            delivery={d}
            uploading={uploadingId === d.id}
            onUpdate={handleUpdate}
            onAccept={async () => {
              if (!driver?.id) return;
              await acceptDelivery(d.id, driver.id);
            }}
            t={t}
          />
        ))}

        {/* Completed deliveries */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>{t("completedDeliveries")}</Text>
        {completed.length === 0 && !deliveriesLoading && (
          <Text style={styles.emptyText}>{t("noCompletedDeliveries")}</Text>
        )}
        {completed.map((d) => (
          <DeliveryCard
            key={d.id}
            delivery={d}
            uploading={false}
            onUpdate={handleUpdate}
            compact
            t={t}
          />
        ))}

        {/* Parcel jobs */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>{t("parcelJobs")}</Text>
        {parcelsLoading && <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />}
        {parcels.length === 0 && !parcelsLoading && (
          <Text style={styles.emptyText}>{t("noParcelJobs")}</Text>
        )}
        {parcels.map((p) => (
          <ParcelCard
            key={p.id}
            parcel={p}
            uploading={uploadingId === p.id}
            onUpdate={async (parcel, status, requireProof) => {
              let proofUrl = parcel.delivery_proof_url;
              if (requireProof) {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: "images",
                  allowsEditing: true,
                  quality: 0.8,
                });
                if (result.canceled || !result.assets[0]?.uri) return;
                setUploadingId(parcel.id);
                try {
                  const path = `parcels/${parcel.id}-${Date.now()}.jpg`;
                  const file = await (await fetch(result.assets[0].uri)).blob();
                  const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file);
                  if (uploadError) throw uploadError;
                  const { data } = supabase.storage.from("receipts").getPublicUrl(path);
                  proofUrl = data.publicUrl;
                } catch (e) {
                  Alert.alert(t("uploadFailed"), String(e));
                  setUploadingId(null);
                  return;
                }
                setUploadingId(null);
              }
              await updateParcelStatus(parcel.id, status, proofUrl ?? undefined);
            }}
            onAccept={async () => {
              if (!driver?.id) return;
              await acceptParcel(p.id, driver.id);
            }}
            t={t}
          />
        ))}
        </DashboardPage>
      </ScrollView>
    </View>
  );
}

type ParcelRow = Database["public"]["Tables"]["parcel_deliveries"]["Row"];
type ParcelStatus = ParcelRow["status"];

const PARCEL_STATUS_FLOW: ParcelStatus[] = ["pending", "accepted", "picked_up", "on_the_way", "delivered"];

function nextParcelStatus(current: ParcelStatus): ParcelStatus | null {
  const idx = PARCEL_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= PARCEL_STATUS_FLOW.length - 1) return null;
  return PARCEL_STATUS_FLOW[idx + 1];
}

function DeliveryCard({
  delivery,
  uploading,
  onUpdate,
  onAccept,
  compact,
  t,
}: {
  delivery: DeliveryRow;
  uploading: boolean;
  onUpdate: (d: DeliveryRow, s: DeliveryRow["status"], requireProof?: boolean) => void;
  onAccept?: () => void;
  compact?: boolean;
  t: (key: import("../src/lib/i18n").TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const pickup = (delivery.pickup_location as any)?.address ?? "Store location";
  const dropoff = (delivery.delivery_location as any)?.address ?? "Customer location";
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

      <View style={styles.infoRow}>
        <MapPin size={14} color={palette.mutedForeground} />
        <Text style={styles.infoText}>{t("pickup")}: {pickup}</Text>
      </View>
      <View style={styles.infoRow}>
        <MapPin size={14} color={palette.mutedForeground} />
        <Text style={styles.infoText}>{t("dropoff")}: {dropoff}</Text>
      </View>
      {delivery.customer_phone && (
        <View style={styles.infoRow}>
          <Phone size={14} color={palette.mutedForeground} />
          <Text style={styles.infoText}>{delivery.customer_phone}</Text>
        </View>
      )}
      <View style={styles.infoRow}>
        <Package size={14} color={palette.mutedForeground} />
        <Text style={styles.infoText}>{t("fee")}: {formatSAR(Number(delivery.delivery_fee_sar))}</Text>
      </View>

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

function ParcelCard({
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
  t: (key: import("../src/lib/i18n").TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const pickup = (parcel.pickup_location as any)?.address ?? "Pickup location";
  const dropoff = (parcel.dropoff_location as any)?.address ?? "Dropoff location";
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

      <View style={styles.infoRow}>
        <MapPin size={14} color={palette.mutedForeground} />
        <Text style={styles.infoText}>{t("pickup")}: {pickup}</Text>
      </View>
      <View style={styles.infoRow}>
        <MapPin size={14} color={palette.mutedForeground} />
        <Text style={styles.infoText}>{t("dropoff")}: {dropoff}</Text>
      </View>
      {parcel.receiver_phone && (
        <View style={styles.infoRow}>
          <Phone size={14} color={palette.mutedForeground} />
          <Text style={styles.infoText}>{parcel.receiver_phone}</Text>
        </View>
      )}
      <View style={styles.infoRow}>
        <Package size={14} color={palette.mutedForeground} />
        <Text style={styles.infoText}>{t("fee")}: {formatSAR(Number(parcel.fare_sar))}</Text>
      </View>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.md,
    backgroundColor: palette.background,
  },
  overline: { fontFamily: fonts.sansMedium, fontSize: 10, color: palette.mutedForeground, textTransform: "uppercase" },
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: palette.foreground },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: "capitalize" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  infoText: { fontFamily: fonts.sansMedium, fontSize: 13, color: palette.foreground, flex: 1 },
  proofImage: { width: "100%", height: 160, borderRadius: radii.lg, marginTop: spacing.md },
});
