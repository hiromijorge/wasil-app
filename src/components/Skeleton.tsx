import { View, StyleSheet } from "react-native";
import { palette, spacing, radii } from "../lib/theme";

export function StoreCardSkeleton() {
  return (
    <View style={styles.storeCard}>
      <View style={styles.storeImage} />
      <View style={styles.storeBody}>
        <View style={[styles.line, { width: "60%" }]} />
        <View style={[styles.line, { width: "40%", marginTop: spacing.sm }]} />
      </View>
    </View>
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.productCard}>
      <View style={styles.productImage} />
      <View style={styles.productBody}>
        <View style={[styles.line, { width: "80%" }]} />
        <View style={[styles.line, { width: "50%", marginTop: spacing.sm }]} />
      </View>
    </View>
  );
}

export function HeroSkeleton() {
  return (
    <View style={styles.heroRow}>
      <View style={styles.heroTextBlock}>
        <View style={[styles.line, { width: "40%" }]} />
        <View style={[styles.line, { width: "80%", height: 48, marginTop: spacing.md }]} />
        <View style={[styles.line, { width: "70%", marginTop: spacing.md }]} />
        <View style={[styles.line, { width: "90%", height: 48, borderRadius: radii["2xl"], marginTop: spacing.md }]} />
      </View>
      <View style={styles.heroCollage} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    height: 14,
    borderRadius: radii.sm,
    backgroundColor: palette.muted,
    opacity: 0.6,
  },
  storeCard: {
    backgroundColor: palette.card,
    borderRadius: radii["3xl"],
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    overflow: "hidden",
  },
  storeImage: {
    aspectRatio: 5 / 3,
    backgroundColor: palette.muted,
    opacity: 0.5,
  },
  storeBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  productCard: {
    backgroundColor: palette.card,
    borderRadius: radii["3xl"],
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    overflow: "hidden",
  },
  productImage: {
    aspectRatio: 1,
    backgroundColor: palette.muted,
    opacity: 0.5,
  },
  productBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  heroRow: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "center",
  },
  heroTextBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  heroCollage: {
    width: "45%",
    maxWidth: 520,
    aspectRatio: 1,
    borderRadius: 36,
    backgroundColor: palette.muted,
    opacity: 0.4,
  },
});
