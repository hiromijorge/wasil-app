import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { palette, fonts, spacing, radii, shadows } from "../lib/theme";
import { slugify } from "../lib/slugify";
import { type Store } from "../lib/demo-data";

interface StoreCardProps {
  store: Store;
  showChat?: boolean;
}

export function StoreCard({ store, showChat = false }: StoreCardProps) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/store/${slugify(store.name)}`)}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={typeof store.image === "string" ? { uri: store.image } : store.image}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />

        <View
          style={[
            styles.statusBadge,
            store.open ? styles.statusOpen : styles.statusClosed,
          ]}
        >
          <View style={[styles.dot, store.open ? styles.dotOpen : styles.dotClosed]} />
          <Text style={styles.statusText}>{store.open ? "Open now" : "Closed"}</Text>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {store.categoryEmoji} {store.category}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {store.name}
          </Text>
          <View style={styles.rating}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>
              {store.rating}{" "}
              <Text style={styles.reviews}>({store.reviews})</Text>
            </Text>
          </View>
        </View>

        <Text style={styles.meta}>
          <Text>📍 </Text>
          {store.location} · {store.hours}
        </Text>

        {showChat && (
          <Pressable
            style={styles.chatButton}
            onPress={(e) => {
              e.stopPropagation?.();
              router.push(`/chat/${store.id}`);
            }}
          >
            <MessageCircle size={16} color={palette.card} />
            <Text style={styles.chatButtonText}>Chat in app</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["3xl"],
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    overflow: "hidden",
    ...shadows.card,
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
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: palette.success,
    borderRadius: radii.xl,
    paddingVertical: 10,
    marginTop: spacing.sm,
  },
  chatButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.card,
  },
});
