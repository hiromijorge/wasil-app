import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth-context";
import { useDriverRecord } from "../../src/hooks/useDriverRecord";
import { useDriverDeliveries, type DriverDelivery } from "../../src/hooks/useDriverDeliveries";
import { usePlatformConfig } from "../../src/hooks/usePlatformConfig";
import { useTranslation } from "../../src/lib/i18n";
import { formatSAR } from "../../src/lib/format";
import { palette, spacing } from "../../src/lib/theme";
import { DashboardHeader, DashboardPage } from "../../src/components/DashboardLayout";
import {
  DeliveryCard,
  CashModal,
  styles,
  type CashModalState,
  type DeliveryRow,
  type DeliveryStatus,
} from "./components";

export default function DriverDeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { data: driver, isLoading: driverLoading } = useDriverRecord();
  const {
    data: deliveries,
    isLoading: deliveriesLoading,
    updateStatus,
    acceptDelivery,
  } = useDriverDeliveries(driver?.id);
  const { data: platformConfig } = usePlatformConfig();

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [cashModal, setCashModal] = useState<CashModalState>(null);

  const handleUpdate = async (delivery: DriverDelivery, status: DeliveryStatus, requireProof = false) => {
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

  const requestDeliver = async (delivery: DriverDelivery) => {
    const { data: order } = await supabase
      .from("orders")
      .select("payment_method, cash_collected_sar, total, subtotal_sar, delivery_fee_sar")
      .eq("id", delivery.order_id)
      .single();
    const totalSar = (order?.subtotal_sar ?? 0) + (order?.delivery_fee_sar ?? 0) || (order?.total ?? 0);
    if (order?.payment_method === "cash" && order.cash_collected_sar == null) {
      setCashModal({
        visible: true,
        type: "order",
        record: delivery as DeliveryRow,
        amount: totalSar.toString(),
        photoUri: null,
      });
      return;
    }
    await handleUpdate(delivery, "delivered", true);
  };

  const checkCodLimit = async (isCod: boolean): Promise<boolean> => {
    if (!isCod || !driver?.id) return true;
    const max = platformConfig?.cod_max_unsettled_cash_sar ?? 300;
    const { data } = await supabase.rpc("driver_unsettled_cod_balance", {
      p_driver_id: driver.id,
    });
    if (Number(data ?? 0) >= max) {
      Alert.alert(
        t("codLimitReachedTitle"),
        t("codLimitReachedBody", { amount: formatSAR(max) })
      );
      return false;
    }
    return true;
  };

  const confirmCashCollection = async () => {
    if (!cashModal || !profile?.id) return;
    const { record, amount, photoUri } = cashModal;
    const amountNum = parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t("tryAgain"), t("invalidAmount"));
      return;
    }

    setUploadingId(record.id);
    let receiptUrl: string | null = null;
    if (photoUri) {
      try {
        const path = `cash-receipts/${record.id}-${Date.now()}.jpg`;
        const file = await (await fetch(photoUri)).blob();
        const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("receipts").getPublicUrl(path);
        receiptUrl = data.publicUrl;
      } catch (e) {
        Alert.alert(t("uploadFailed"), String(e));
        setUploadingId(null);
        return;
      }
    }

    const now = new Date().toISOString();
    const cashUpdate = {
      cash_collected_sar: amountNum,
      cash_collected_at: now,
      cash_collected_by: profile.id,
      cash_receipt_photo_url: receiptUrl,
    };

    await supabase.from("orders").update(cashUpdate).eq("id", (record as DeliveryRow).order_id);

    setCashModal(null);
    setUploadingId(null);
    await handleUpdate(record as DeliveryRow, "delivered", true);
  };

  if (driverLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const active = deliveries.filter((d) => d.status !== "delivered");
  const completed = deliveries.filter((d) => d.status === "delivered");

  return (
    <View style={styles.container}>
      <DashboardHeader overline={t("driverConsole")} title={t("deliveries")} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <DashboardPage>
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
              onUpdate={(delivery, status) => {
                if (status === "delivered") {
                  requestDeliver(delivery);
                  return;
                }
                handleUpdate(delivery, status, false);
              }}
              onAccept={async () => {
                if (!driver?.id) return;
                const ok = await checkCodLimit(d.orders?.payment_method === "cash");
                if (!ok) return;
                await acceptDelivery(d.id, driver.id);
              }}
              t={t}
            />
          ))}

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
        </DashboardPage>
      </ScrollView>

      <CashModal
        cashModal={cashModal}
        setCashModal={setCashModal}
        uploading={uploadingId === cashModal?.record.id}
        onConfirm={confirmCashCollection}
      />
    </View>
  );
}
