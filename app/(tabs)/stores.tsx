import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, MapPin, X, RotateCcw, Store } from "lucide-react-native";
import { TopBar } from "../../src/components/TopBar";
import { StoreCard } from "../../src/components/StoreCard";
import { Card } from "../../src/components/Card";
import { StoreCardSkeleton } from "../../src/components/Skeleton";
import { SectionHeader } from "../../src/components/SectionHeader";
import { EmptyState } from "../../src/components/EmptyState";
import { palette, fonts, typography, spacing, radii } from "../../src/lib/theme";
import { categories } from "../../src/lib/demo-data";
import { useStores } from "../../src/hooks/useStores";
import { useTranslation } from "../../src/lib/i18n";

const MD_BREAKPOINT = 768;

function toRad(n: number) {
  return (n * Math.PI) / 180;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function StoresScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;

  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [nearMe, setNearMe] = useState(false);

  const categoryFilter = cat === "all" ? undefined : cat;

  const {
    data: storesData = [],
    isLoading,
    error,
    refetch,
  } = useStores({ query, category: categoryFilter, openOnly });

  const requestLocation = () => {
    if (nearMe) {
      setNearMe(false);
      return;
    }
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setNearMe(true);
        },
        () => {
          Alert.alert("Location denied", "Please enable location access to use near me.");
        }
      );
    } else {
      Alert.alert("Not supported", "Location is not available on this device.");
    }
  };

  const filtered = useMemo(() => {
    let list = storesData;
    if (nearMe && userLoc) {
      list = [...list].sort(
        (a, b) =>
          distanceKm(userLoc.lat, userLoc.lng, a.lat, a.lng) -
          distanceKm(userLoc.lat, userLoc.lng, b.lat, b.lng)
      );
    }
    return list;
  }, [storesData, nearMe, userLoc]);

  return (
    <View style={styles.container}>
      <TopBar showCart />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title={t("storesTitle")} subtitle={t("storesSubtitle")} />

        <Card padding="md" style={styles.searchBar}>
          <Search size={20} color={palette.mutedForeground} />
          <TextInput
            style={styles.input}
            placeholder={t("storesInputPlaceholder")}
            placeholderTextColor={palette.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={18} color={palette.mutedForeground} />
            </Pressable>
          )}
        </Card>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {categories.map((c) => {
            const active = cat === c.id;
            return (
              <Pressable
                key={c.id}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setCat(c.id)}
              >
                <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    active && styles.categoryLabelActive,
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.filterRow}>
          <Pressable
            style={[styles.chip, openOnly && styles.chipActive]}
            onPress={() => setOpenOnly((v) => !v)}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: openOnly ? palette.primaryForeground : palette.success },
              ]}
            />
            <Text style={[styles.chipText, openOnly && styles.chipTextActive]}>
              {t("openNow")}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.chip, nearMe && styles.chipActive]}
            onPress={requestLocation}
          >
            <MapPin
              size={14}
              color={nearMe ? palette.primaryForeground : palette.primary}
            />
            <Text style={[styles.chipText, nearMe && styles.chipTextActive]}>
              {t("nearMe")}
            </Text>
          </Pressable>
        </View>

        {error && <ErrorRetry message={t("couldNotLoadStores")} onRetry={refetch} />}

        <Text style={styles.resultMeta}>
          {filtered.length === 1
            ? t("storeCount", { count: filtered.length })
            : t("storeCountPlural", { count: filtered.length })}
        </Text>

        <View style={styles.grid}>
          {isLoading &&
            Array.from({ length: isDesktop ? 4 : 2 }).map((_, i) => (
              <View
                key={`store-skel-${i}`}
                style={[styles.gridItem, { width: isDesktop ? "48%" : "100%" }]}
              >
                <StoreCardSkeleton />
              </View>
            ))}
            {!isLoading && filtered.length === 0 && (
              <EmptyState
                icon={<Store size={28} color={palette.primary} />}
                title={t("noStoresFound")}
                subtitle={t("tryDifferentSearch")}
              />
            )}
          {!isLoading &&
            filtered.map((s) => (
              <View
                key={s.id}
                style={[styles.gridItem, { width: isDesktop ? "48%" : "100%" }]}
              >
                    <StoreCard store={s} />
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Pressable style={styles.errorRow} onPress={onRetry}>
      <Text style={styles.errorText}>{message}</Text>
      <RotateCcw size={14} color={palette.destructive} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 1152,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.pageTitle,
    letterSpacing: -0.025,
  },
  subtitle: {
    ...typography.pageSubtitle,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    marginTop: spacing.md,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: palette.foreground,
  },
  categories: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
    marginTop: spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    backgroundColor: palette.card,
  },
  categoryChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  categoryLabelActive: {
    color: palette.primaryForeground,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: palette.primarySoft,
  },
  chipActive: {
    backgroundColor: palette.primary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primary,
  },
  chipTextActive: {
    color: palette.primaryForeground,
  },
  resultMeta: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: spacing.lg,
  },
  grid: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  gridItem: {},
  emptyState: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    textAlign: "center",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.destructive,
  },
});
