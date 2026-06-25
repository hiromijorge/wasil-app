import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MapPin, Plus, Home, Star, Trash2, Check, Pencil } from "lucide-react-native";
import { useAuth } from "../src/lib/auth-context";
import { useTranslation } from "../src/lib/i18n";
import { palette, fonts, spacing, radii } from "../src/lib/theme";
import { Button } from "../src/components/Button";
import { Card } from "../src/components/Card";
import { Input } from "../src/components/Input";
import { SectionHeader } from "../src/components/SectionHeader";
import { EmptyState } from "../src/components/EmptyState";
import { AddressAutocomplete } from "../src/components/AddressAutocomplete";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "../src/hooks/useAddresses";
import type { GeoLocation } from "../src/components/LocationButton";
import type { Database } from "../src/lib/database.types";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: addresses, isLoading } = useAddresses(user?.id);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AddressRow | null>(null);
  const [label, setLabel] = useState("");
  const [addressText, setAddressText] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [buildingFloor, setBuildingFloor] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const openAdd = useCallback(() => {
    setEditing(null);
    setLabel("");
    setAddressText("");
    setLocation(null);
    setBuildingFloor("");
    setContactName("");
    setContactPhone("");
    setIsDefault(false);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((addr: AddressRow) => {
    setEditing(addr);
    setLabel(addr.label);
    setAddressText(addr.address);
    setLocation(
      addr.lat && addr.lng
        ? { address: addr.address, lat: Number(addr.lat), lng: Number(addr.lng) }
        : null,
    );
    setBuildingFloor(addr.building_floor ?? "");
    setContactName(addr.contact_name ?? "");
    setContactPhone(addr.contact_phone ?? "");
    setIsDefault(addr.is_default);
    setModalOpen(true);
  }, []);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!addressText.trim()) {
      Alert.alert(t("tryAgain"), t("addressRequired"));
      return;
    }

    const payload = {
      user_id: user.id,
      label: label.trim() || "Home",
      address: addressText.trim(),
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      building_floor: buildingFloor.trim() || null,
      contact_name: contactName.trim() || null,
      contact_phone: contactPhone.trim() || null,
      is_default: isDefault,
    };

    try {
      if (editing) {
        await updateAddress.mutateAsync({
          id: editing.id,
          userId: user.id,
          updates: payload,
        });
      } else {
        await createAddress.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (err) {
      Alert.alert(t("tryAgain"), err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = (addr: AddressRow) => {
    Alert.alert(t("deleteAddressTitle"), t("deleteAddressMessage", { label: addr.label }), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          if (!user?.id) return;
          try {
            await deleteAddress.mutateAsync({ id: addr.id, userId: user.id });
          } catch (err) {
            Alert.alert(t("tryAgain"), err instanceof Error ? err.message : String(err));
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (addr: AddressRow) => {
    if (!user?.id || addr.is_default) return;
    try {
      await updateAddress.mutateAsync({
        id: addr.id,
        userId: user.id,
        updates: { is_default: true },
      });
    } catch (err) {
      Alert.alert(t("tryAgain"), err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button">
          <ArrowLeft size={20} color={palette.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("myAddresses")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Button title={`+ ${t("addAddress")}`} variant="primary" size="lg" onPress={openAdd} style={styles.addButton} />

        {isLoading && (
          <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.xl }} />
        )}

        {!isLoading && addresses?.length === 0 && (
          <Card style={styles.emptyState}>
            <EmptyState
              icon={<MapPin size={28} color={palette.primary} />}
              title={t("noAddressesYet")}
              subtitle={t("addAddressPrompt")}
            />
          </Card>
        )}

        {addresses?.map((addr) => (
          <Card key={addr.id} padding="lg" style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.addressLabelRow}>
                <Home size={16} color={palette.primary} />
                <Text style={styles.addressLabel}>{addr.label}</Text>
                {addr.is_default && (
                  <View style={styles.defaultBadge}>
                    <Star size={10} color={palette.warning} />
                    <Text style={styles.defaultText}>{t("default")}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actions}>
                {!addr.is_default && (
                  <Pressable
                    onPress={() => handleSetDefault(addr)}
                    style={styles.actionButton}
                    accessibilityRole="button"
                    accessibilityLabel={t("setDefault")}
                  >
                    <Star size={16} color={palette.mutedForeground} />
                  </Pressable>
                )}
                <Pressable
                  onPress={() => openEdit(addr)}
                  style={styles.actionButton}
                  accessibilityRole="button"
                  accessibilityLabel={t("edit")}
                >
                  <Pencil size={16} color={palette.primary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(addr)}
                  style={styles.actionButton}
                  accessibilityRole="button"
                  accessibilityLabel={t("delete")}
                >
                  <Trash2 size={16} color={palette.destructive} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.addressText}>{addr.address}</Text>
            {addr.building_floor && (
              <Text style={styles.addressMeta}>{addr.building_floor}</Text>
            )}
            {(addr.contact_name || addr.contact_phone) && (
              <Text style={styles.addressMeta}>
                {[addr.contact_name, addr.contact_phone].filter(Boolean).join(" · ")}
              </Text>
            )}
          </Card>
        ))}
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? t("editAddress") : t("addAddress")}
              </Text>
              <Pressable onPress={() => setModalOpen(false)} accessibilityRole="button">
                <Text style={styles.modalClose}>{t("cancel")}</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label={t("addressNameLabel")}
                value={label}
                onChangeText={setLabel}
                placeholder={t("addressNamePlaceholder")}
              />
              <AddressAutocomplete
                label={t("addressLabel")}
                placeholder={t("addressPlaceholder")}
                address={addressText}
                location={location}
                onChange={(text, loc) => {
                  setAddressText(text);
                  setLocation(loc);
                }}
              />
              <Input
                label={t("buildingFloorLabel")}
                value={buildingFloor}
                onChangeText={setBuildingFloor}
                placeholder={t("buildingFloorPlaceholder")}
              />
              <Input
                label={t("contactNameLabel")}
                value={contactName}
                onChangeText={setContactName}
                placeholder={t("contactNamePlaceholder")}
              />
              <Input
                label={t("contactPhoneLabel")}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder={t("phonePlaceholder")}
                keyboardType="phone-pad"
              />

              <Pressable
                onPress={() => setIsDefault((v) => !v)}
                style={styles.defaultRow}
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.checkbox,
                    isDefault && { backgroundColor: palette.primary, borderColor: palette.primary },
                  ]}
                >
                  {isDefault && <Check size={12} color={palette.primaryForeground} />}
                </View>
                <Text style={styles.defaultLabel}>{t("setAsDefault")}</Text>
              </Pressable>

              <Button
                title={editing ? t("saveChanges") : t("save")}
                onPress={handleSave}
                loading={createAddress.isPending || updateAddress.isPending}
                style={{ marginTop: spacing.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  addButton: {
    width: "100%",
  },
  emptyState: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: palette.foreground,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  addressCard: {
    // Container styling is handled by Card.
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  addressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  addressLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  defaultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: `${palette.warning}20`,
  },
  defaultText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: palette.foreground,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  addressText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.foreground,
    lineHeight: 20,
  },
  addressMeta: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    padding: spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.foreground,
  },
  modalClose: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  defaultLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: palette.foreground,
  },
});
