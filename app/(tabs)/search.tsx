import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, X, RotateCcw, SlidersHorizontal } from "lucide-react-native";
import { TopBar } from "../../src/components/TopBar";
import { ProductCard } from "../../src/components/ProductCard";
import { StoreCard } from "../../src/components/StoreCard";
import {
  StoreCardSkeleton,
  ProductCardSkeleton,
} from "../../src/components/Skeleton";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { categories } from "../../src/lib/demo-data";
import { useStores } from "../../src/hooks/useStores";
import { useProducts, type ProductSort } from "../../src/hooks/useProducts";
import { useTranslation, type TranslationKey } from "../../src/lib/i18n";

const MD_BREAKPOINT = 768;

const suggestions = ["Paracetamol", "Rice 5kg", "Face cream", "Hijab", "Sunscreen"];

const SORT_OPTIONS: { key: ProductSort; label: TranslationKey }[] = [
  { key: "relevance", label: "relevance" },
  { key: "price_asc", label: "priceAsc" },
  { key: "price_desc", label: "priceDesc" },
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;

  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sortBy, setSortBy] = useState<ProductSort>("relevance");

  const categoryFilter = cat === "all" ? undefined : cat;

  const {
    data: storesData = [],
    isLoading: storesLoading,
    error: storesError,
    refetch: refetchStores,
  } = useStores({ query: q, category: categoryFilter });

  const {
    data: productsData = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts({ query: q, sortBy });

  // If a category is selected, only show products from stores in that category.
  const storeIdsInCategory = useMemo(
    () => new Set(cat === "all" ? [] : storesData.map((s) => s.id)),
    [cat, storesData]
  );

  const productMatchesList = useMemo(() => {
    if (cat === "all") return productsData;
    return productsData.filter((p) => storeIdsInCategory.has(p.storeId));
  }, [productsData, cat, storeIdsInCategory]);

  const hasQuery = q.trim().length > 0;

  return (
    <View style={styles.container}>
      <TopBar title="Search" showBack onBack={() => router.push("/(tabs)/")} showCart />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.heading}>{t("searchTitle")}</Text>
          <Text style={styles.subheading}>{t("searchSubtitle")}</Text>

          <View style={styles.searchBar}>
            <Search size={18} color={palette.mutedForeground} />
            <TextInput
              style={styles.input}
              placeholder={t("searchInputPlaceholder")}
              placeholderTextColor={palette.mutedForeground}
              value={q}
              onChangeText={setQ}
              autoFocus
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ("")}>
                <X size={16} color={palette.mutedForeground} />
              </Pressable>
            )}
          </View>

          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <Pressable key={s} style={styles.suggestionChip} onPress={() => setQ(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>

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

          {hasQuery && (
            <Text style={styles.resultMeta}>
              {t("resultsMeta", {
                products: productMatchesList.length,
                stores: storesData.length,
                query: q,
              })}
            </Text>
          )}

          {/* Products */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("productsSection")}</Text>
              <View style={styles.sortRow}>
                <SlidersHorizontal size={12} color={palette.mutedForeground} />
                {SORT_OPTIONS.map((opt) => {
                  const active = sortBy === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      style={[styles.sortChip, active && styles.sortChipActive]}
                      onPress={() => setSortBy(opt.key)}
                    >
                      <Text
                        style={[
                          styles.sortChipText,
                          active && styles.sortChipTextActive,
                        ]}
                      >
                        {t(opt.label)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {productsError && (
              <ErrorRetry message={t("couldNotLoadProducts")} onRetry={refetchProducts} />
            )}

            {!productsLoading && productMatchesList.length === 0 && (
              <Text style={styles.empty}>
                {hasQuery ? t("noProductsFound") : t("searchPromptProducts")}
              </Text>
            )}

            <View style={styles.productGrid}>
              {productsLoading &&
                Array.from({ length: isDesktop ? 6 : 4 }).map((_, i) => (
                  <View
                    key={`prod-skel-${i}`}
                    style={[styles.productGridItem, { width: isDesktop ? "15%" : "47%" }]}
                  >
                    <ProductCardSkeleton />
                  </View>
                ))}
              {!productsLoading &&
                productMatchesList.map((p) => (
                  <View
                    key={p.id}
                    style={[styles.productGridItem, { width: isDesktop ? "15%" : "47%" }]}
                  >
                    <ProductCard product={p} />
                  </View>
                ))}
            </View>
          </View>

          {/* Stores */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("storesSection")}</Text>
              <Pressable onPress={() => router.push("/(tabs)/stores")}>
                <Text style={styles.seeAll}>{t("seeAll")}</Text>
              </Pressable>
            </View>

            {storesError && (
              <ErrorRetry message={t("couldNotLoadStores")} onRetry={refetchStores} />
            )}

            {!storesLoading && storesData.length === 0 && (
              <Text style={styles.empty}>
                {hasQuery ? t("noStoresFound") : t("searchPromptStores")}
              </Text>
            )}

            <View style={styles.storeGrid}>
              {storesLoading &&
                Array.from({ length: isDesktop ? 4 : 2 }).map((_, i) => (
                  <View
                    key={`store-skel-${i}`}
                    style={[styles.storeGridItem, { width: isDesktop ? "48%" : "100%" }]}
                  >
                    <StoreCardSkeleton />
                  </View>
                ))}
              {!storesLoading &&
                storesData.map((s) => (
                  <View
                    key={s.id}
                    style={[styles.storeGridItem, { width: isDesktop ? "48%" : "100%" }]}
                  >
                    <StoreCard store={s} />
                  </View>
                ))}
            </View>
          </View>
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
  scroll: {},
  content: {
    width: "100%",
    maxWidth: 1152,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: palette.foreground,
  },
  subheading: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    borderRadius: radii["2xl"],
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginTop: spacing.md,
    ...shadows.card,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.foreground,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    backgroundColor: palette.card,
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  suggestionText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: palette.mutedForeground,
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
  resultMeta: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: spacing.lg,
  },
  resultMetaBold: {
    fontFamily: fonts.sansSemiBold,
    color: palette.foreground,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: palette.foreground,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sortChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    backgroundColor: palette.card,
  },
  sortChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  sortChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: palette.mutedForeground,
  },
  sortChipTextActive: {
    color: palette.primaryForeground,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  productGridItem: {},
  storeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  storeGridItem: {},
  empty: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  seeAll: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.primary,
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
