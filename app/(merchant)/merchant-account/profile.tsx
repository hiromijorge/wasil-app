import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Store } from "lucide-react-native";
import { useMerchantStore } from "../../../src/hooks/useMerchantStore";
import { useAuth } from "../../../src/lib/auth-context";
import { formatSAR } from "../../../src/lib/format";
import { useTranslation } from "../../../src/lib/i18n";
import { supabase } from "../../../src/lib/supabase";
import { palette, fonts, spacing, shadows } from "../../../src/lib/theme";
import { Input } from "../../../src/components/Input";
import { Button } from "../../../src/components/Button";

export default function MerchantProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { demo } = useAuth();
  const { data: store } = useMerchantStore();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      setName(store.name ?? "");
      setCategory(store.category ?? "");
      setLocation(store.location ?? "");
      setHours(store.hours ?? "");
      setDeliveryFee(store.delivery_fee ? String(store.delivery_fee) : "");
    }
  }, [store]);

  const handleSave = async () => {
    if (!store?.id) return;
    if (!name.trim() || !category.trim() || !location.trim()) {
      Alert.alert(t("tryAgain"), t("onboardingRequiredFields"));
      return;
    }

    const feeNum = Number(deliveryFee);
    if (deliveryFee.trim() && (Number.isNaN(feeNum) || feeNum < 0)) {
      Alert.alert(t("tryAgain"), t("productPriceRequired"));
      return;
    }

    if (demo) {
      Alert.alert(t("demoRestriction"));
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        name: name.trim(),
        category: category.trim(),
        location: location.trim(),
        hours: hours.trim() || null,
        delivery_fee: deliveryFee.trim() ? feeNum : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", store.id);
    setSaving(false);

    if (error) {
      Alert.alert(t("tryAgain"), error.message);
      return;
    }

    Alert.alert(t("save"), t("profileUpdated"));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={palette.foreground} />
        </Pressable>
        <Text style={styles.title}>{t("profileTab")}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!store ? (
          <Text style={styles.emptyText}>{t("noStoreData")}</Text>
        ) : (
          <View style={[styles.card, shadows.card]}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Store size={24} color={palette.primary} />
              </View>
              <View>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeCategory}>{store.category}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Input
              label={t("storeNameLabel")}
              value={name}
              onChangeText={setName}
              placeholder={t("storeNamePlaceholder")}
            />
            <Input
              label={t("categoryLabel")}
              value={category}
              onChangeText={setCategory}
              placeholder={t("categoryPlaceholder")}
            />
            <Input
              label={t("locationLabel")}
              value={location}
              onChangeText={setLocation}
              placeholder={t("locationPlaceholder")}
            />
            <Input
              label={t("hoursLabel")}
              value={hours}
              onChangeText={setHours}
              placeholder={t("hoursPlaceholder")}
            />
            <Input
              label={t("deliveryFeeLabel")}
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              placeholder="0"
              keyboardType="decimal-pad"
            />

            <Button
              title={t("saveChanges")}
              variant="primary"
              size="lg"
              loading={saving}
              onPress={handleSave}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: palette.foreground,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${palette.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  storeCategory: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
