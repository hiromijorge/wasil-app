import { useState, useEffect, type ReactNode } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import {
  Search,
  X,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  Clock,
  AlertCircle,
  Package,
} from "lucide-react-native";
import { MerchantShell } from "../../src/components/MerchantShell";
import { useMerchantStore } from "../../src/hooks/useMerchantStore";
import { useMerchantProducts } from "../../src/hooks/useMerchantProducts";
import { formatSAR } from "../../src/lib/format";
import { useTranslation, type TranslationKey } from "../../src/lib/i18n";
import { getPlan, type PlanId } from "../../src/lib/billing";
import { supabase } from "../../src/lib/supabase";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { ConfirmDialog } from "../../src/components/ConfirmDialog";
import { merchantStyles, type ProductRow } from "./_components";

const PRODUCT_SORTS: { key: ProductSort; label: TranslationKey }[] = [
  { key: "lastAdded", label: "sortLastAdded" },
  { key: "nameAsc", label: "sortNameAsc" },
  { key: "priceAsc", label: "sortPriceAsc" },
  { key: "priceDesc", label: "sortPriceDesc" },
];

type ProductSort = "lastAdded" | "nameAsc" | "priceAsc" | "priceDesc";

function isRecentlyCreated(createdAt?: string | null) {
  if (!createdAt) return false;
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
}

export default function ProductsTab() {
  const { t } = useTranslation();
  const { data: store } = useMerchantStore();
  const storeId = store?.id;
  const { data: products, isLoading, refetch } = useMerchantProducts(storeId);
  const queryClient = useQueryClient();
  const plan = getPlan((store?.plan_id ?? "free") as PlanId);
  const productCount = products?.length ?? 0;
  const remainingProducts = Math.max(0, plan.maxProducts - productCount);
  const atProductLimit = remainingProducts === 0;

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<ProductSort>("lastAdded");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductRow | null>(null);

  const filtered = (products ?? [])
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "priceAsc":
          return a.price - b.price;
        case "priceDesc":
          return b.price - a.price;
        case "lastAdded":
        default:
          return (
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
          );
      }
    });

  const doDelete = async (product: ProductRow) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);
    if (error) {
      Alert.alert(t("tryAgain"), error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["products"] });
    refetch();
  };

  const handleDelete = (product: ProductRow) => {
    setProductToDelete(product);
  };

  return (
    <MerchantShell
      floatingAction={
        <Pressable
          style={[styles.fab, atProductLimit && styles.fabDisabled]}
          onPress={() => {
            setEditingProduct(null);
            setModalOpen(true);
          }}
          disabled={atProductLimit}
          accessibilityRole="button"
          accessibilityLabel={t("addProduct")}
        >
          <Plus size={24} color={palette.primaryForeground} />
        </Pressable>
      }
    >
      <View style={merchantStyles.tabContent}>
        <View style={styles.productsHeader}>
          <View>
            <Text style={merchantStyles.tabTitle}>{t("yourProducts")}</Text>
            <Text style={merchantStyles.tabSubtitle}>
              {isLoading
                ? t("loading")
                : `${t("productCount", { count: productCount })} · ${remainingProducts} ${t("remaining")}`}
            </Text>
          </View>
        </View>

        {atProductLimit && (
          <View style={[styles.limitBanner, shadows.card]}>
            <Text style={styles.limitBannerText}>{t("productLimitReached")}</Text>
          </View>
        )}

        <View style={styles.productToolbar}>
          <View style={styles.productSearch}>
            <Search size={18} color={palette.mutedForeground} />
            <TextInput
              style={styles.productSearchInput}
              placeholder={t("searchProducts")}
              placeholderTextColor={palette.mutedForeground}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <X size={16} color={palette.mutedForeground} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortChips}
          >
            <SlidersHorizontal size={14} color={palette.mutedForeground} />
            {PRODUCT_SORTS.map(({ key, label }) => {
              const active = sortBy === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setSortBy(key)}
                  style={[styles.sortChip, active && styles.sortChipActive]}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      active && styles.sortChipTextActive,
                    ]}
                  >
                    {t(label)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {isLoading && (
          <View style={merchantStyles.emptyState}>
            <ActivityIndicator color={palette.primary} />
          </View>
        )}

        {!isLoading && filtered.length === 0 && (
          <View style={[merchantStyles.emptyState, shadows.card]}>
            <View style={merchantStyles.emptyIconCircle}>
              <Package size={28} color={palette.primary} />
            </View>
            <Text style={merchantStyles.emptyTitle}>
              {query.trim() ? t("noProductsFound") : t("noProductsYet")}
            </Text>
            <Text style={merchantStyles.emptySubtitle}>
              {query.trim() ? t("tryDifferentSearch") : t("addYourFirstProduct")}
            </Text>
            {!query.trim() && (
              <Button
                title={t("addProduct")}
                variant="primary"
                onPress={() => {
                  setEditingProduct(null);
                  setModalOpen(true);
                }}
                style={{ marginTop: spacing.md }}
              />
            )}
          </View>
        )}

        <View style={styles.productGrid}>
          {filtered.map((product) => {
            const images = Array.isArray(product.images)
              ? (product.images as string[])
              : [];
            const imageSource = images[0]
              ? { uri: images[0] }
              : require("../../assets/icon.png");
            const isNew = isRecentlyCreated(product.created_at);
            return (
              <View
                key={product.id}
                style={[styles.productGridItem, shadows.card]}
                accessibilityLabel={product.name}
              >
                <View style={styles.productImageWrap}>
                  <Image
                    source={imageSource}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  {isNew && (
                    <View style={styles.newBadge}>
                      <Clock size={10} color={palette.primaryForeground} />
                      <Text style={styles.newBadgeText}>{t("lastAdded")}</Text>
                    </View>
                  )}
                  <View style={styles.productOverlay}>
                    <Pressable
                      onPress={() => {
                        setEditingProduct(product);
                        setModalOpen(true);
                      }}
                      style={[
                        styles.productAction,
                        { backgroundColor: `${palette.primary}E6` },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t("edit")}
                    >
                      <Pencil size={16} color={palette.primaryForeground} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(product)}
                      style={[
                        styles.productAction,
                        { backgroundColor: `${palette.destructive}E6` },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t("delete")}
                    >
                      <Trash2 size={16} color={palette.primaryForeground} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.productBody}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>{formatSAR(product.price)}</Text>
                </View>
              </View>
            );
          })}
        </View>

      </View>

      <ProductModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        storeId={storeId}
        product={editingProduct}
      />

      <ConfirmDialog
        visible={!!productToDelete}
        title={t("deleteProductTitle")}
        message={
          productToDelete
            ? t("deleteProductMessage", { name: productToDelete.name })
            : undefined
        }
        confirmText={t("delete")}
        cancelText={t("cancel")}
        confirmVariant="destructive"
        onConfirm={() => {
          if (productToDelete) doDelete(productToDelete);
          setProductToDelete(null);
        }}
        onCancel={() => setProductToDelete(null)}
      />
    </MerchantShell>
  );
}

function ProductModal({
  visible,
  onClose,
  storeId,
  product,
}: {
  visible: boolean;
  onClose: () => void;
  storeId?: string;
  product?: ProductRow | null;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price ? String(product.price) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUri, setImageUri] = useState<string | null>(
    Array.isArray(product?.images) && (product?.images as string[])[0]
      ? (product?.images as string[])[0]
      : null,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(product?.name ?? "");
      setPrice(product?.price ? String(product.price) : "");
      setDescription(product?.description ?? "");
      setImageUri(
        Array.isArray(product?.images) && (product?.images as string[])[0]
          ? (product?.images as string[])[0]
          : null,
      );
      setError(null);
    }
  }, [visible, product]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (localUri: string): Promise<string | null> => {
    if (localUri.startsWith("http")) return localUri;
    const response = await fetch(localUri);
    const blob = await response.blob();
    const ext = localUri.split(".").pop() ?? "jpg";
    const path = `${storeId ?? "temp"}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(path, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: true,
      });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setError(null);
    const trimmedName = name.trim();
    const priceNum = Number(price);

    if (!trimmedName) {
      setError(t("productNameRequired"));
      return;
    }
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setError(t("productPriceRequired"));
      return;
    }
    if (!storeId) {
      setError(t("noStoreFound"));
      return;
    }

    setSaving(true);
    try {
      let publicUrl = imageUri;
      if (imageUri && !imageUri.startsWith("http")) {
        setUploading(true);
        publicUrl = await uploadImage(imageUri);
        setUploading(false);
      }

      const payload = {
        store_id: storeId,
        name: trimmedName,
        price: priceNum,
        description: description.trim() || null,
        images: publicUrl ? [publicUrl] : [],
      };

      if (isEdit && product) {
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert(payload);
        if (insertError) throw insertError;
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: "90%" }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? t("editProduct") : t("addProduct")}
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <X size={20} color={palette.foreground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={pickImage}
              style={styles.uploadBox}
              accessibilityRole="button"
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.uploadPreview} />
              ) : (
                <>
                  <Plus size={24} color={palette.primary} />
                  <Text style={styles.uploadText}>{t("uploadProductPhoto")}</Text>
                </>
              )}
            </Pressable>

            <View style={styles.formFields}>
              <Input
                label={t("productName")}
                value={name}
                onChangeText={setName}
                placeholder={t("productNamePlaceholder")}
              />
              <Input
                label={t("priceSAR")}
                value={price}
                onChangeText={setPrice}
                placeholder="20"
                keyboardType="numeric"
              />
              <Input
                label={t("description")}
                value={description}
                onChangeText={setDescription}
                placeholder={t("descriptionPlaceholder")}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {error ? (
              <View style={styles.inlineError}>
                <AlertCircle size={14} color={palette.destructive} />
                <Text style={styles.inlineErrorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={isEdit ? t("saveChanges") : t("saveProduct")}
              variant="primary"
              onPress={handleSave}
              loading={saving || uploading}
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productToolbar: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  productSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    borderRadius: radii["2xl"],
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 48,
  },
  productSearchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.foreground,
  },
  sortChips: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.lg,
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
    color: palette.foreground,
  },
  sortChipTextActive: {
    color: palette.primaryForeground,
  },
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  productGridItem: {
    width: "47%",
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    overflow: "hidden",
    ...shadows.card,
  },
  productImageWrap: {
    aspectRatio: 1,
    position: "relative",
    backgroundColor: palette.surface,
  },
  productImage: { width: "100%", height: "100%" },
  newBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    ...shadows.card,
  },
  newBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: palette.primaryForeground,
  },
  productOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    opacity: 1,
  },
  productAction: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  productBody: { padding: spacing.md, gap: spacing.xs },
  productName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
    minHeight: 36,
  },
  productPrice: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.primary,
  },
  limitBanner: {
    backgroundColor: `${palette.warning}12`,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${palette.warning}40`,
  },
  limitBannerText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.warning,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lift,
  },
  fabDisabled: {
    backgroundColor: palette.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  uploadBox: {
    height: 120,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: palette.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    overflow: "hidden",
  },
  uploadPreview: { width: "100%", height: "100%" },
  uploadText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: spacing.sm,
  },
  formFields: { gap: spacing.md, marginTop: spacing.md },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: `${palette.destructive}12`,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  inlineErrorText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.destructive,
    flex: 1,
  },
});
