import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, X, RotateCcw, SlidersHorizontal, Package } from "lucide-react-native";
import { TopBar } from "../../src/components/TopBar";
import { ProductCard } from "../../src/components/ProductCard";
import { Card } from "../../src/components/Card";
import { ProductCardSkeleton } from "../../src/components/Skeleton";
import { SectionHeader } from "../../src/components/SectionHeader";
import { EmptyState } from "../../src/components/EmptyState";
import { palette, fonts, typography, spacing, radii } from "../../src/lib/theme";
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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;

  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<ProductSort>("relevance");

  const {
    data: productsData = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts({ query: q, sortBy });

  const hasQuery = q.trim().length > 0;

  return (
    <View style={styles.container}>
      <TopBar showCart />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <View style={styles.content}>
          <SectionHeader title={t("searchTitle")} subtitle={t("searchSubtitle")} />

          <Card padding="md" style={styles.searchBar}>
            <Search size={20} color={palette.mutedForeground} />
            <TextInput
              style={styles.input}
              placeholder={t("searchInputPlaceholder")}
              placeholderTextColor={palette.mutedForeground}
              value={q}
              onChangeText={setQ}
              autoFocus
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ("")} hitSlop={8}>
                <X size={18} color={palette.mutedForeground} />
              </Pressable>
            )}
          </Card>

          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <Pressable key={s} style={styles.suggestionChip} onPress={() => setQ(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {hasQuery && (
            <Text style={styles.resultMeta}>
              {t("resultsMeta", {
                products: productsData.length,
                query: q,
              })}
            </Text>
          )}

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

            {!productsLoading && productsData.length === 0 && (
              <EmptyState
                icon={<Package size={28} color={palette.primary} />}
                title={hasQuery ? t("noProductsFound") : t("searchPromptProducts")}
              />
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
                productsData.map((p) => (
                  <View
                    key={p.id}
                    style={[styles.productGridItem, { width: isDesktop ? "15%" : "47%" }]}
                  >
                    <ProductCard product={p} />
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
    ...typography.pageTitle,
  },
  subheading: {
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
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  suggestionText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: palette.mutedForeground,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
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
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
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
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
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
