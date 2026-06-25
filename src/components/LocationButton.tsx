import { useState } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "../lib/i18n";
import { supabase } from "../lib/supabase";
import { palette, fonts, spacing, radii } from "../lib/theme";

export interface GeoLocation {
  address: string;
  lat: number;
  lng: number;
}

interface LocationButtonProps {
  onLocate: (location: GeoLocation) => void;
  variant?: "default" | "compact";
}

export function LocationButton({
  onLocate,
  variant = "default",
}: LocationButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handlePress = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      Alert.alert(t("tryAgain"), t("locationNotSupported"));
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { data, error } = await supabase.functions.invoke<GeoLocation>(
            "geocode",
            { body: { lat: latitude, lng: longitude } }
          );
          if (error || !data?.address) throw error ?? new Error("No address");
          onLocate({
            address: data.address,
            lat: data.lat,
            lng: data.lng,
          });
        } catch (err) {
          Alert.alert(
            t("tryAgain"),
            (err as Error)?.message ?? t("locationDenied")
          );
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        Alert.alert(t("tryAgain"), t("locationDenied"));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  if (variant === "compact") {
    return (
      <Pressable
        onPress={handlePress}
        style={styles.compact}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={t("useCurrentLocation")}
        hitSlop={8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={palette.primary} />
        ) : (
          <MapPin size={18} color={palette.primary} />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={styles.button}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={t("useCurrentLocation")}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.primary} />
      ) : (
        <MapPin size={14} color={palette.primary} />
      )}
      <Text style={styles.text}>{t("useCurrentLocation")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.sm,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    marginTop: spacing.sm,
  },
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primary,
  },
  compact: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
