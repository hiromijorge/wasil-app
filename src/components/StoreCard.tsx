import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { CardPressable } from "./Card";
import { palette, fonts, spacing, radii } from "../lib/theme";
import { slugify } from "../lib/slugify";
import { type Store } from "../lib/demo-data";
import { useTranslation } from "../lib/i18n";

interface StoreCardProps {
  store: Store;
  variant?: "default" | "compact";
}

export function StoreCard({ store, variant = "default" }: StoreCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const compact = variant === "compact";

  return (
    <CardPressable
      radius={compact ? "xl" : "3xl"}
      overflowHidden
      style={({ pressed }) => [
        compact ? styles.cardCompact : styles.card,
        pressed && styles.pressed,
      ]}
      onPress={() => router.push(`/store/${slugify(store.name)}`)}
      accessibilityRole="button"
    >
      <View style={compact ? styles.imageWrapperCompact : styles.imageWrapper}>
        <Image
          source={typeof store.image === "string" ? { uri: store.image } : store.image}
          style={compact ? styles.imageCompact : styles.image}
          resizeMode="cover"
        />
        {!compact && <View style={styles.imageOverlay} />}

        <View
          style={[
            compact ? styles.statusBadgeCompact : styles.statusBadge,
            store.open ? styles.statusOpen : styles.statusClosed,
          ]}
        >
          <View style={[styles.dot, store.open ? styles.dotOpen : styles.dotClosed]} />
          {!compact && <Text style={styles.statusText}>{store.open ? "Open now" : "Closed"}</Text>}
        </View>

        {!compact && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {store.categoryEmoji} {store.category}
            </Text>
          </View>
        )}

        {store.isDemo && (
          <View style={styles.demoBadge}>
            <Text style={styles.demoText}>{t("sample")}</Text>
          </View>
        )}
      </View>

      <View style={compact ? styles.bodyCompact : styles.body}>
        <View style={styles.titleRow}>
          <Text style={compact ? styles.nameCompact : styles.name} numberOfLines={2}>
            {store.name}
          </Text>
            {!compact && (
            <View style={styles.rating}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.ratingText}>
                {store.rating}{" "}
                <Text style={styles.reviews}>({store.reviews})</Text>
              </Text>
            </View>
          )}
        </View>

        <Text style={compact ? styles.metaCompact : styles.meta}>
          <Text>📍 </Text>
          {store.location} · {store.hours}
        </Text>

        {compact && (
          <View style={styles.ratingCompact}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingTextCompact}>
              {store.rating}{" "}
              <Text style={styles.reviews}>({store.reviews})</Text>
            </Text>
            <Text style={styles.categoryCompact}>
              {store.categoryEmoji} {store.category}
            </Text>
          </View>
        )}

      </View>
    </CardPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    // Container styling is handled by CardPressable.
  },
  pressed: {
    opacity: 0.96,
    transform: [{ translateY: 1 }],
  },
  imageWrapper: {
    position: "relative",
    aspectRatio: 5 / 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  statusBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  statusOpen: {},
  statusClosed: {},
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotOpen: {
    backgroundColor: palette.success,
  },
  dotClosed: {
    backgroundColor: palette.destructive,
  },
  statusText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: palette.foreground,
  },
  categoryBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  categoryText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: palette.foreground,
  },
  demoBadge: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  demoText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: "#fff",
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 15,
    color: palette.foreground,
    lineHeight: 19,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  star: {
    fontSize: 12,
    color: palette.warning,
  },
  ratingText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: palette.foreground,
  },
  reviews: {
    fontFamily: fonts.sans,
    color: palette.mutedForeground,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  // Compact variant
  cardCompact: {
    flexDirection: "row",
    alignItems: "center",
    // Container styling is handled by CardPressable.
  },
  imageWrapperCompact: {
    position: "relative",
    width: 88,
    height: 88,
    overflow: "hidden",
  },
  imageCompact: {
    width: "100%",
    height: "100%",
  },
  statusBadgeCompact: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.success,
  },
  bodyCompact: {
    flex: 1,
    padding: spacing.sm,
    gap: 2,
    justifyContent: "center",
  },
  nameCompact: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
    lineHeight: 18,
  },
  metaCompact: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  ratingCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 2,
  },
  ratingTextCompact: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: palette.foreground,
  },
  categoryCompact: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: palette.mutedForeground,
    backgroundColor: palette.muted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
});
