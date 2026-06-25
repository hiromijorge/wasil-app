import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth-context";
import { useDriverRecord } from "../../src/hooks/useDriverRecord";
import { useDriverParcels } from "../../src/hooks/useDriverParcels";
import { useDriverCodBalance } from "../../src/hooks/useDriverCodBalance";
import { usePlatformConfig } from "../../src/hooks/usePlatformConfig";
import { useTranslation } from "../../src/lib/i18n";
import { formatSAR } from "../../src/lib/format";
import { palette, spacing } from "../../src/lib/theme";
import { DashboardHeader, DashboardPage } from "../../src/components/DashboardLayout";
import {
  ParcelCard,
  CashModal,
  styles,
  type CashModalState,
  type ParcelRow,
  type ParcelStatus,
} from "./components";

export default function DriverParcelsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { data: driver, isLoading: driverLoading } = useDriverRecord();
  const {
    data: parcels,
    isLoading: parcelsLoading,
    updateStatus: updateParcelStatus,
    acceptParcel,
  } = useDriverParcels(driver?.id);
  const { refresh: refreshCodBalance } = useDriverCodBalance(profile?.id);
  const { data: platformConfig } = usePlatformConfig();

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [cashModal, setCashModal] = useState<CashModalState>(null);

  const handleParcelDeliver = async (parcel: ParcelRow) => {
    let proofUrl = parcel.delivery_proof_url;
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
    await updateParcelStatus(parcel.id, "delivered", proofUrl ?? undefined);
  };

  const requestParcelDeliver = async (parcel: ParcelRow) => {
    if (parcel.payment_method === "cash" && parcel.cash_collected_sar == null) {
      setCashModal({
        visible: true,
        type: "parcel",
        record: parcel,
        amount: (parcel.fare_sar ?? 0).toString(),
        photoUri: null,
      });
      return;
    }
    await handleParcelDeliver(parcel);
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
    await supabase.from("parcel_deliveries").update({
      cash_collected_sar: amountNum,
      cash_collected_at: now,
      cash_collected_by: profile.id,
      cash_receipt_photo_url: receiptUrl,
    }).eq("id", record.id);

    setCashModal(null);
    setUploadingId(null);
    await handleParcelDeliver(record as ParcelRow);
    await refreshCodBalance();
  };

  if (driverLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader overline={t("driverConsole")} title={t("parcels")} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <DashboardPage>
          <Text style={styles.sectionTitle}>{t("parcelJobs")}</Text>
          {parcelsLoading && <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />}
          {parcels.length === 0 && !parcelsLoading && (
            <Text style={styles.emptyText}>{t("noParcelJobs")}</Text>
          )}
          {parcels.map((p) => (
            <ParcelCard
              key={p.id}
              parcel={p}
              uploading={uploadingId === p.id}
              onUpdate={(parcel, status) => {
                if (status === "delivered") {
                  requestParcelDeliver(parcel);
                  return;
                }
                updateParcelStatus(parcel.id, status);
              }}
              onAccept={async () => {
                if (!driver?.id) return;
                const ok = await checkCodLimit(p.payment_method === "cash");
                if (!ok) return;
                await acceptParcel(p.id, driver.id);
              }}
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
