import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Store, MapPin, Phone, Clock, Truck, CheckCircle } from "lucide-react-native";
import { useAuth } from "../src/lib/auth-context";
import { useTranslation } from "../src/lib/i18n";
import { palette, fonts, spacing, radii } from "../src/lib/theme";
import { supabase } from "../src/lib/supabase";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { AddressAutocomplete } from "../src/components/AddressAutocomplete";
import { RoleGuard } from "../src/components/RoleGuard";
import { Card } from "../src/components/Card";
import type { GeoLocation } from "../src/components/LocationButton";

function MerchantOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, profile, demo } = useAuth();

  const [name, setName] = useState(profile?.full_name ?? "");
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("");
  const [whatsapp, setWhatsapp] = useState(user?.phone ?? "");
  const [hours, setHours] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkExistingStore() {
      if (demo || !user) {
        setChecking(false);
        return;
      }
      const { data } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .single();
      if (data) {
        router.replace("/merchant-dashboard");
      } else {
        setChecking(false);
      }
    }
    checkExistingStore();
  }, [user, demo, router]);

  const handleSubmit = async () => {
    if (demo) {
      Alert.alert(t("demoRestriction"));
      return;
    }
    if (!user) {
      Alert.alert(t("tryAgain"), "Not authenticated");
      return;
    }

    const trimmedName = storeName.trim();
    const trimmedCategory = category.trim();
    const trimmedAddress = address.trim();
    const fee = Number(deliveryFee);

    if (!trimmedName || !trimmedCategory || !trimmedAddress) {
      Alert.alert(t("tryAgain"), t("onboardingRequiredFields"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("stores").insert({
        owner_id: user.id,
        name: trimmedName,
        category: trimmedCategory,
        location: trimmedAddress,
        lat: location?.lat ?? 0,
        lng: location?.lng ?? 0,
        whatsapp: whatsapp.trim() || user.phone || "",
        hours: hours.trim() || "9:00 AM - 9:00 PM",
        delivery_fee: Number.isNaN(fee) ? 0 : fee,
        delivery_available: true,
        pickup_available: true,
        plan_id: "free",
        open: true,
      });

      if (error) throw error;
      router.replace("/merchant-dashboard");
    } catch (err) {
      Alert.alert(t("tryAgain"), err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Store size={28} color={palette.primary} />
          </View>
          <Text style={styles.title}>{t("merchantOnboardingTitle")}</Text>
          <Text style={styles.subtitle}>{t("merchantOnboardingSubtitle")}</Text>
        </View>

        <Card padding="lg" style={styles.card}>
          <Input
            label={t("ownerName")}
            value={name}
            onChangeText={setName}
            placeholder={t("ownerNamePlaceholder")}
          />
          <Input
            label={t("storeName")}
            value={storeName}
            onChangeText={setStoreName}
            placeholder={t("storeNamePlaceholder")}
          />
          <Input
            label={t("category")}
            value={category}
            onChangeText={setCategory}
            placeholder={t("categoryPlaceholder")}
          />
          <AddressAutocomplete
            label={t("location")}
            placeholder={t("locationPlaceholder")}
            address={address}
            location={location}
            onChange={(a, loc) => {
              setAddress(a);
              setLocation(loc);
            }}
          />
          <Input
            label={t("whatsapp")}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder={t("whatsappPlaceholder")}
            keyboardType="phone-pad"
          />
          <Input
            label={t("hours")}
            value={hours}
            onChangeText={setHours}
            placeholder={t("hoursPlaceholder")}
          />
          <Input
            label={t("deliveryFeeSAR")}
            value={deliveryFee}
            onChangeText={setDeliveryFee}
            placeholder="0"
            keyboardType="numeric"
          />

          <Button
            title={t("createStore")}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

export default function MerchantOnboardingScreenWrapped() {
  return (
    <RoleGuard allowedRoles="merchant">
      <MerchantOnboardingScreen />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: `${palette.primary}12`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: palette.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.xs,
    maxWidth: 320,
  },
  card: {
    gap: spacing.md,
  },
});
