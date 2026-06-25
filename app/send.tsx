import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Package,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  MapPin,
  Navigation,
  Box,
  Bike,
  Car,
  Truck,
  Ruler,
} from "lucide-react-native";
import { AddressAutocomplete } from "../src/components/AddressAutocomplete";
import { type GeoLocation } from "../src/components/LocationButton";
import { TopBar } from "../src/components/TopBar";
import { Input } from "../src/components/Input";
import { Card, CardPressable } from "../src/components/Card";
import { useTranslation, type TranslationKey } from "../src/lib/i18n";
import { useAuth } from "../src/lib/auth-context";
import { useParcelEstimate, type VehicleType, type FareBreakdown } from "../src/hooks/useParcelEstimate";
import { useCreateParcel, type ParcelForm } from "../src/hooks/useCreateParcel";
import { usePlatformConfig } from "../src/hooks/usePlatformConfig";
import { useCustomerParcels } from "../src/hooks/useCustomerParcels";
import { formatSAR } from "../src/lib/format";
import { haversineKm } from "../src/lib/geo";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";

const STEPS = ["pickup", "dropoff", "item", "review"] as const;
type Step = (typeof STEPS)[number];

function parcelStatusKey(status: string): TranslationKey {
  switch (status) {
    case "pending":
      return "parcelStatusPending";
    case "accepted":
      return "parcelStatusAccepted";
    case "picked_up":
      return "parcelStatusPickedUp";
    case "on_the_way":
      return "parcelStatusOnTheWay";
    case "delivered":
      return "parcelStatusDelivered";
    case "cancelled":
      return "parcelStatusCancelled";
    default:
      return "parcelStatusPending";
  }
}

const initialForm: ParcelForm = {
  pickupAddress: "",
  dropoffAddress: "",
  receiverName: "",
  receiverPhone: "",
  itemDescription: "",
  itemCategory: "",
  weightKg: "1",
  notes: "",
  pickupLocation: null,
  dropoffLocation: null,
  pickupDetails: {},
  dropoffDetails: {},
  vehicleType: "bike",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  paymentMethod: "bank_transfer",
  cashPayer: "receiver",
};

export default function SendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { create, isLoading: creating } = useCreateParcel();
  const { data: parcels, isLoading: parcelsLoading } = useCustomerParcels();
  const { data: config } = usePlatformConfig();
  const cashThreshold = config?.cod_high_value_threshold_sar ?? 300;

  const [step, setStep] = useState<Step>("pickup");
  const [form, setForm] = useState<ParcelForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const distanceKm = useMemo(() => {
    const { lat: lat1, lng: lng1 } = form.pickupLocation ?? {};
    const { lat: lat2, lng: lng2 } = form.dropoffLocation ?? {};
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return undefined;
    return Math.round(haversineKm(lat1, lng1, lat2, lng2) * 10) / 10;
  }, [form.pickupLocation, form.dropoffLocation]);

  const fare = useParcelEstimate({
    weightKg: parseFloat(form.weightKg) || 1,
    distanceKm,
    vehicleType: form.vehicleType,
    lengthCm: form.lengthCm ? parseFloat(form.lengthCm) : undefined,
    widthCm: form.widthCm ? parseFloat(form.widthCm) : undefined,
    heightCm: form.heightCm ? parseFloat(form.heightCm) : undefined,
    config,
  });

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const currentErrors = validateStepFields(step);
    setErrors((prev) => {
      const next: Record<string, string> = {};
      Object.keys(prev).forEach((key) => {
        if (currentErrors[key]) next[key] = currentErrors[key];
      });
      return next;
    });
  }, [form, step]);

  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return phone.startsWith("+") && digits.length >= 8;
  };

  const validateStepFields = (s: Step): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    switch (s) {
      case "pickup":
        if (!form.pickupAddress.trim()) {
          nextErrors.pickupAddress = t("fieldRequired");
        }
        if (!form.pickupDetails?.phone?.trim()) {
          nextErrors.pickupPhone = t("fieldRequired");
        } else if (!isValidPhone(form.pickupDetails.phone)) {
          nextErrors.pickupPhone = t("invalidPhone");
        }
        break;
      case "dropoff":
        if (!form.dropoffAddress.trim()) {
          nextErrors.dropoffAddress = t("fieldRequired");
        }
        if (!form.receiverName.trim()) {
          nextErrors.receiverName = t("fieldRequired");
        }
        if (!form.receiverPhone.trim()) {
          nextErrors.receiverPhone = t("fieldRequired");
        } else if (!isValidPhone(form.receiverPhone)) {
          nextErrors.receiverPhone = t("invalidPhone");
        }
        break;
      case "item":
        if (!form.itemDescription.trim()) {
          nextErrors.itemDescription = t("fieldRequired");
        }
        break;
    }
    return nextErrors;
  };

  const isStepValid = (s: Step) => Object.keys(validateStepFields(s)).length === 0;

  const update = (key: keyof ParcelForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const updatePickup = (
    key: keyof NonNullable<ParcelForm["pickupDetails"]>,
    value: string
  ) => {
    setForm((f) => ({
      ...f,
      pickupDetails: { ...f.pickupDetails, [key]: value },
    }));
  };

  const updateDropoff = (
    key: keyof NonNullable<ParcelForm["dropoffDetails"]>,
    value: string
  ) => {
    setForm((f) => ({
      ...f,
      dropoffDetails: { ...f.dropoffDetails, [key]: value },
    }));
  };

  const setAddress = (
    key: "pickupLocation" | "dropoffLocation",
    address: string,
    loc: GeoLocation | null
  ) => {
    setForm((f) => ({
      ...f,
      [key]: loc,
      [key === "pickupLocation" ? "pickupAddress" : "dropoffAddress"]:
        address,
    }));
  };

  const stepIndex = STEPS.indexOf(step);
  const canGoBack = stepIndex > 0;
  const isLastStep = step === "review";

  const validateStep = (s: Step): boolean => {
    const stepErrors = validateStepFields(s);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      const fields = Object.keys(stepErrors);
      setTouched((prev) =>
        fields.reduce((acc, key) => ({ ...acc, [key]: true }), prev)
      );
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setErrors({});
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    setErrors({});
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const goToStep = (target: Step) => {
    const targetIndex = STEPS.indexOf(target);
    if (targetIndex <= stepIndex) {
      setErrors({});
      setStep(target);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (!validateStep("review")) return;
    const { data, error } = await create(form);
    if (error) {
      Alert.alert(t("tryAgain"), error.message);
    } else if (data) {
      setForm(initialForm);
      setStep("pickup");
      router.push(`/parcel-success?id=${data.id}`);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar showBack showCart />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        }}
      >
        <View style={styles.hero}>
          <Package size={40} color={palette.primary} />
          <Text style={styles.title}>{t("sendTitle")}</Text>
          <Text style={styles.subtitle}>{t("sendSubtitle")}</Text>
        </View>

        {/* Stepper */}
        <View style={styles.stepper}>
          {STEPS.map((s, index) => {
            const active = index === stepIndex;
            const completed = index < stepIndex;
            return (
              <Pressable
                key={s}
                onPress={() => goToStep(s)}
                style={styles.stepperItem}
                disabled={index > stepIndex}
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.stepDot,
                    active && styles.stepDotActive,
                    completed && styles.stepDotCompleted,
                  ]}
                >
                  {completed ? (
                    <Text style={styles.stepCheck}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        (active || completed) && styles.stepNumberActive,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    active && styles.stepLabelActive,
                    completed && styles.stepLabelCompleted,
                  ]}
                >
                  {t(`step${s.charAt(0).toUpperCase() + s.slice(1)}` as TranslationKey)}
                </Text>
                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepConnector,
                      completed && styles.stepConnectorCompleted,
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Step content */}
        <Card padding="lg" style={styles.card}>
          {step === "pickup" && (
            <PickupStep
              form={form}
              errors={errors}
              setAddress={setAddress}
              updatePickup={updatePickup}
            />
          )}
          {step === "dropoff" && (
            <DropoffStep
              form={form}
              errors={errors}
              setAddress={setAddress}
              update={update}
              updateDropoff={updateDropoff}
            />
          )}
          {step === "item" && (
            <ItemStep form={form} errors={errors} update={update} fare={fare} />
          )}
          {step === "review" && (
            <ReviewStep
              form={form}
              fare={fare}
              onEdit={goToStep}
              onUpdate={(patch) => setForm((f) => ({ ...f, ...patch }))}
              cashThreshold={cashThreshold}
            />
          )}
        </Card>

        {/* Recent sends */}
        {!parcelsLoading && parcels.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>{t("recentSends")}</Text>
              <Pressable
                onPress={() => router.push("/(tabs)/orders")}
                style={styles.seeAllRow}
                accessibilityRole="button"
              >
                <Text style={styles.seeAllText}>{t("seeAllActivity")}</Text>
                <ChevronRight size={14} color={palette.primary} />
              </Pressable>
            </View>
            <View style={styles.recentList}>
              {parcels.slice(0, 3).map((p) => (
                <CardPressable
                  key={p.id}
                  onPress={() => router.push(`/parcel/${p.id}`)}
                  padding="md"
                  radius="xl"
                  style={styles.recentCard}
                  accessibilityRole="button"
                >
                  <View style={styles.recentMain}>
                    <Text style={styles.recentId}>
                      {t("parcelId", { id: p.id.slice(-6).toUpperCase() })}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {formatSAR(Number(p.fare_sar))} · {t(parcelStatusKey(p.status))}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={palette.mutedForeground} />
                </CardPressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky footer actions */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <Pressable
          onPress={goBack}
          disabled={!canGoBack}
          style={[styles.backButton, !canGoBack && styles.backButtonDisabled]}
          accessibilityRole="button"
        >
          <ChevronLeft size={18} color={canGoBack ? palette.foreground : palette.mutedForeground} />
          <Text
            style={[
              styles.backButtonText,
              !canGoBack && styles.backButtonTextDisabled,
            ]}
          >
            {t("back")}
          </Text>
        </Pressable>

        <View style={styles.footerCta}>
          {isLastStep && (
            <View style={styles.footerFare}>
              <Text style={styles.footerFareLabel}>{t("estimateFare")}</Text>
              <Text style={styles.footerFareValue}>{formatSAR(fare.total)}</Text>
            </View>
          )}
          <Pressable
            onPress={isLastStep ? handleSubmit : goNext}
            disabled={creating || !isStepValid(step)}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && !creating && isStepValid(step) && styles.ctaButtonPressed,
              (creating || !isStepValid(step)) && styles.ctaButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isLastStep ? t("requestSend") : t("nextStep")}
          >
            {creating ? (
              <ActivityIndicator color={palette.primaryForeground} />
            ) : (
              <ArrowRight size={24} color={palette.primaryForeground} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PickupStep({
  form,
  errors,
  setAddress,
  updatePickup,
}: {
  form: ParcelForm;
  errors: Record<string, string>;
  setAddress: (
    key: "pickupLocation" | "dropoffLocation",
    address: string,
    loc: GeoLocation | null
  ) => void;
  updatePickup: (
    key: keyof NonNullable<ParcelForm["pickupDetails"]>,
    value: string
  ) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t("pickupAddressLabel")}</Text>
      <AddressAutocomplete
        label={t("pickupAddressLabel")}
        placeholder={t("pickupAddressPlaceholder")}
        address={form.pickupAddress}
        location={form.pickupLocation ?? null}
        onChange={(addr, loc) => setAddress("pickupLocation", addr, loc)}
      />
      {errors.pickupAddress ? (
        <Text style={styles.fieldError}>{errors.pickupAddress}</Text>
      ) : null}

      <View style={styles.detailsBlock}>
        <Input
          label={t("pickupContactNameLabel")}
          value={form.pickupDetails?.contactName ?? ""}
          onChangeText={(v) => updatePickup("contactName", v)}
          placeholder={t("contactNamePlaceholder")}
        />
        <Input
          label={t("pickupContactPhoneLabel")}
          value={form.pickupDetails?.phone ?? ""}
          onChangeText={(v) => updatePickup("phone", v)}
          keyboardType="phone-pad"
          placeholder={t("phonePlaceholder")}
          error={errors.pickupPhone}
        />
        <Input
          label={t("pickupBuildingFloorLabel")}
          value={form.pickupDetails?.buildingFloor ?? ""}
          onChangeText={(v) => updatePickup("buildingFloor", v)}
          placeholder={t("buildingFloorPlaceholder")}
        />
        <Input
          label={t("pickupNotesLabel")}
          value={form.pickupDetails?.notes ?? ""}
          onChangeText={(v) => updatePickup("notes", v)}
          placeholder={t("parcelNotesPlaceholder")}
          multiline
        />
      </View>
    </View>
  );
}

function DropoffStep({
  form,
  errors,
  setAddress,
  update,
  updateDropoff,
}: {
  form: ParcelForm;
  errors: Record<string, string>;
  setAddress: (
    key: "pickupLocation" | "dropoffLocation",
    address: string,
    loc: GeoLocation | null
  ) => void;
  update: (key: keyof ParcelForm, value: string) => void;
  updateDropoff: (
    key: keyof NonNullable<ParcelForm["dropoffDetails"]>,
    value: string
  ) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t("dropoffAddressLabel")}</Text>
      <AddressAutocomplete
        label={t("dropoffAddressLabel")}
        placeholder={t("dropoffAddressPlaceholder")}
        address={form.dropoffAddress}
        location={form.dropoffLocation ?? null}
        onChange={(addr, loc) => setAddress("dropoffLocation", addr, loc)}
      />
      {errors.dropoffAddress ? (
        <Text style={styles.fieldError}>{errors.dropoffAddress}</Text>
      ) : null}

      <View style={styles.detailsBlock}>
        <Input
          label={t("receiverNameLabel")}
          value={form.receiverName}
          onChangeText={(v) => update("receiverName", v)}
          error={errors.receiverName}
        />
        <Input
          label={t("receiverPhoneLabel")}
          value={form.receiverPhone}
          onChangeText={(v) => update("receiverPhone", v)}
          keyboardType="phone-pad"
          error={errors.receiverPhone}
        />
        <Input
          label={t("dropoffBuildingFloorLabel")}
          value={form.dropoffDetails?.buildingFloor ?? ""}
          onChangeText={(v) => updateDropoff("buildingFloor", v)}
          placeholder={t("buildingFloorPlaceholder")}
        />
        <Input
          label={t("dropoffNotesLabel")}
          value={form.dropoffDetails?.notes ?? ""}
          onChangeText={(v) => updateDropoff("notes", v)}
          placeholder={t("parcelNotesPlaceholder")}
          multiline
        />
      </View>
    </View>
  );
}

function ItemStep({
  form,
  errors,
  update,
  fare,
}: {
  form: ParcelForm;
  errors: Record<string, string>;
  update: (key: keyof ParcelForm, value: string) => void;
  fare: FareBreakdown;
}) {
  const { t } = useTranslation();
  const [showDimensions, setShowDimensions] = useState(false);

  const setVehicle = (vehicleType: VehicleType) => update("vehicleType", vehicleType);

  const setSizeCategory = (dims: { lengthCm: string; widthCm: string; heightCm: string }) => {
    update("lengthCm", dims.lengthCm);
    update("widthCm", dims.widthCm);
    update("heightCm", dims.heightCm);
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t("parcelVehicleTypeLabel")}</Text>
      <VehicleTypeSelector selected={form.vehicleType} onSelect={setVehicle} />

      <Text style={[styles.stepTitle, { marginTop: spacing.md }]}>{t("sizeCategoryLabel")}</Text>
      <SizeCategorySelector
        lengthCm={form.lengthCm}
        widthCm={form.widthCm}
        heightCm={form.heightCm}
        onSelect={setSizeCategory}
      />

      <Pressable
        onPress={() => setShowDimensions((v) => !v)}
        style={styles.dimensionToggle}
        accessibilityRole="button"
      >
        <Ruler size={16} color={palette.primary} />
        <Text style={styles.dimensionToggleText}>
          {showDimensions ? t("hideExactDimensions") : t("enterExactDimensions")}
        </Text>
      </Pressable>

      {showDimensions && (
        <View style={styles.dimensionRow}>
          <Input
            label={t("lengthCm")}
            value={form.lengthCm}
            onChangeText={(v) => update("lengthCm", v)}
            placeholder="0"
            keyboardType="decimal-pad"
            style={styles.dimensionInput}
          />
          <Input
            label={t("widthCm")}
            value={form.widthCm}
            onChangeText={(v) => update("widthCm", v)}
            placeholder="0"
            keyboardType="decimal-pad"
            style={styles.dimensionInput}
          />
          <Input
            label={t("heightCm")}
            value={form.heightCm}
            onChangeText={(v) => update("heightCm", v)}
            placeholder="0"
            keyboardType="decimal-pad"
            style={styles.dimensionInput}
          />
        </View>
      )}

      <Input
        label={t("itemDescriptionLabel")}
        value={form.itemDescription}
        onChangeText={(v) => update("itemDescription", v)}
        placeholder={t("itemDescriptionPlaceholder")}
        error={errors.itemDescription}
      />
      <Input
        label={t("parcelCategoryLabel")}
        value={form.itemCategory}
        onChangeText={(v) => update("itemCategory", v)}
        placeholder={t("parcelCategoryPlaceholder")}
      />
      <Input
        label={t("weightLabel")}
        value={form.weightKg}
        onChangeText={(v) => update("weightKg", v)}
        placeholder={t("weightPlaceholder")}
        keyboardType="decimal-pad"
      />
      <Input
        label={t("parcelNotesLabel")}
        value={form.notes}
        onChangeText={(v) => update("notes", v)}
        placeholder={t("parcelNotesPlaceholder")}
        multiline
      />

      <FareBreakdownView fare={fare} />
    </View>
  );
}

function VehicleTypeSelector({
  selected,
  onSelect,
}: {
  selected: VehicleType;
  onSelect: (type: VehicleType) => void;
}) {
  const { t } = useTranslation();
  const vehicles: { id: VehicleType; label: string; icon: typeof Bike; hint: string }[] = [
    { id: "bike", label: t("bike"), icon: Bike, hint: t("bikeHint") },
    { id: "car", label: t("car"), icon: Car, hint: t("carHint") },
    { id: "van", label: t("van"), icon: Truck, hint: t("vanHint") },
  ];

  return (
    <View style={styles.vehicleRow}>
      {vehicles.map(({ id, label, icon: Icon, hint }) => {
        const active = selected === id;
        return (
          <Pressable
            key={id}
            onPress={() => onSelect(id)}
            style={[styles.vehicleCard, active && styles.vehicleCardActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Icon size={28} color={active ? palette.primary : palette.mutedForeground} />
            <Text style={[styles.vehicleLabel, active && styles.vehicleLabelActive]}>{label}</Text>
            <Text style={styles.vehicleHint}>{hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SizeCategorySelector({
  lengthCm,
  widthCm,
  heightCm,
  onSelect,
}: {
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  onSelect: (dims: { lengthCm: string; widthCm: string; heightCm: string }) => void;
}) {
  const { t } = useTranslation();
  const categories = [
    { id: "small", label: t("sizeSmall"), dims: { lengthCm: "20", widthCm: "15", heightCm: "5" } },
    { id: "medium", label: t("sizeMedium"), dims: { lengthCm: "30", widthCm: "20", heightCm: "15" } },
    { id: "large", label: t("sizeLarge"), dims: { lengthCm: "40", widthCm: "30", heightCm: "25" } },
    { id: "xlarge", label: t("sizeXLarge"), dims: { lengthCm: "50", widthCm: "40", heightCm: "30" } },
  ];

  const activeId = categories.find(
    (c) => c.dims.lengthCm === lengthCm && c.dims.widthCm === widthCm && c.dims.heightCm === heightCm
  )?.id;

  return (
    <View style={styles.categoryRow}>
      {categories.map((cat) => {
        const active = activeId === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.dims)}
            style={[styles.categoryChip, active && styles.categoryChipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FareBreakdownView({ fare }: { fare: FareBreakdown }) {
  const { t } = useTranslation();
  return (
    <View style={styles.fareCard}>
      <Text style={styles.fareCardTitle}>{t("estimateFare")}</Text>
      <View style={styles.fareRow}>
        <Text style={styles.fareRowLabel}>{t("baseFare")}</Text>
        <Text style={styles.fareRowValue}>{formatSAR(fare.baseFare)}</Text>
      </View>
      <View style={styles.fareRow}>
        <Text style={styles.fareRowLabel}>{t("distanceCharge")}</Text>
        <Text style={styles.fareRowValue}>{formatSAR(fare.distanceCharge)}</Text>
      </View>
      <View style={styles.fareRow}>
        <Text style={styles.fareRowLabel}>{t("weightCharge")}</Text>
        <Text style={styles.fareRowValue}>{formatSAR(fare.weightCharge)}</Text>
      </View>
      <View style={[styles.fareRow, styles.fareTotalRow]}>
        <Text style={styles.fareTotalLabel}>{t("totalFare")}</Text>
        <Text style={styles.fareTotalValue}>{formatSAR(fare.total)}</Text>
      </View>
    </View>
  );
}

function ReviewStep({
  form,
  fare,
  onEdit,
  onUpdate,
  cashThreshold,
}: {
  form: ParcelForm;
  fare: FareBreakdown;
  onEdit: (step: Step) => void;
  onUpdate: (patch: Partial<ParcelForm>) => void;
  cashThreshold: number;
}) {
  const { t } = useTranslation();

  const pickup = (form.pickupLocation as GeoLocation | null) ?? {
    address: form.pickupAddress,
  };
  const dropoff = (form.dropoffLocation as GeoLocation | null) ?? {
    address: form.dropoffAddress,
  };

  const pickupExtra = [
    form.pickupDetails?.contactName,
    form.pickupDetails?.phone,
    form.pickupDetails?.buildingFloor,
    form.pickupDetails?.notes,
  ]
    .filter(Boolean)
    .join(" · ");

  const dropoffExtra = [
    form.receiverName,
    form.receiverPhone,
    form.dropoffDetails?.buildingFloor,
    form.dropoffDetails?.notes,
  ]
    .filter(Boolean)
    .join(" · ");

  const itemExtra = [
    t(form.vehicleType),
    form.itemCategory,
    form.weightKg ? `${form.weightKg} kg` : "",
    form.lengthCm && form.widthCm && form.heightCm
      ? `${form.lengthCm}×${form.widthCm}×${form.heightCm} cm`
      : "",
    form.notes,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t("stepReview")}</Text>

      <SummaryCard
        icon={<MapPin size={18} color={palette.primary} />}
        title={t("pickupSummaryTitle")}
        address={pickup.address}
        extra={pickupExtra}
        onEdit={() => onEdit("pickup")}
      />

      <SummaryCard
        icon={<Navigation size={18} color={palette.primary} />}
        title={t("dropoffSummaryTitle")}
        address={dropoff.address}
        extra={dropoffExtra}
        onEdit={() => onEdit("dropoff")}
      />

      <SummaryCard
        icon={<Box size={18} color={palette.primary} />}
        title={t("itemSummaryTitle")}
        address={form.itemDescription}
        extra={itemExtra}
        onEdit={() => onEdit("item")}
      />

      <PaymentSelector
        form={form}
        fare={fare}
        threshold={cashThreshold}
        onUpdate={onUpdate}
      />

      <FareBreakdownView fare={fare} />
    </View>
  );
}

function PaymentSelector({
  form,
  fare,
  threshold,
  onUpdate,
}: {
  form: ParcelForm;
  fare: FareBreakdown;
  threshold: number;
  onUpdate: (patch: Partial<ParcelForm>) => void;
}) {
  const { t } = useTranslation();
  const cashDisabled = fare.total > threshold;

  return (
    <View style={styles.paymentBlock}>
      <Text style={styles.stepTitle}>{t("paymentMethod")}</Text>
      <View style={styles.paymentToggle}>
        <Pressable
          style={[
            styles.toggleButton,
            form.paymentMethod === "bank_transfer" && styles.toggleButtonActive,
          ]}
          onPress={() =>
            onUpdate({ paymentMethod: "bank_transfer", cashPayer: form.cashPayer })
          }
        >
          <Text
            style={[
              styles.toggleText,
              form.paymentMethod === "bank_transfer" && styles.toggleTextActive,
            ]}
          >
            {t("bankTransfer")}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleButton,
            form.paymentMethod === "cash" && styles.toggleButtonActive,
            cashDisabled && styles.toggleButtonDisabled,
          ]}
          onPress={() => !cashDisabled && onUpdate({ paymentMethod: "cash" })}
          disabled={cashDisabled}
        >
          <Text
            style={[
              styles.toggleText,
              form.paymentMethod === "cash" && styles.toggleTextActive,
              cashDisabled && styles.toggleTextDisabled,
            ]}
          >
            {t("cashOnDelivery")}
          </Text>
        </Pressable>
      </View>

      {cashDisabled ? (
        <Text style={styles.paymentHint}>
          {t("codHighValue", { amount: formatSAR(threshold) })}
        </Text>
      ) : form.paymentMethod === "cash" ? (
        <>
          <Text style={styles.paymentHint}>{t("codHint")}</Text>
          <Text style={[styles.stepTitle, { marginTop: spacing.sm }]}>
            {t("cashPayer")}
          </Text>
          <View style={styles.paymentToggle}>
            <Pressable
              style={[
                styles.toggleButton,
                form.cashPayer === "sender" && styles.toggleButtonActive,
              ]}
              onPress={() => onUpdate({ cashPayer: "sender" })}
            >
              <Text
                style={[
                  styles.toggleText,
                  form.cashPayer === "sender" && styles.toggleTextActive,
                ]}
              >
                {t("cashPayerSender")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleButton,
                form.cashPayer === "receiver" && styles.toggleButtonActive,
              ]}
              onPress={() => onUpdate({ cashPayer: "receiver" })}
            >
              <Text
                style={[
                  styles.toggleText,
                  form.cashPayer === "receiver" && styles.toggleTextActive,
                ]}
              >
                {t("cashPayerReceiver")}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

function SummaryCard({
  icon,
  title,
  address,
  extra,
  onEdit,
}: {
  icon: ReactNode;
  title: string;
  address: string;
  extra: string;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryTitleRow}>
          {icon}
          <Text style={styles.summaryTitle}>{title}</Text>
        </View>
        <Pressable onPress={onEdit} accessibilityRole="button">
          <Text style={styles.editText}>{t("edit")}</Text>
        </Pressable>
      </View>
      <Text style={styles.summaryAddress}>{address}</Text>
      {extra ? <Text style={styles.summaryExtra}>{extra}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  hero: {
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.foreground,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },

  // Stepper
  stepper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  stepperItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.card,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  stepDotActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  stepDotCompleted: {
    borderColor: palette.primary,
    backgroundColor: palette.primary,
  },
  stepNumber: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  stepNumberActive: {
    color: palette.primary,
  },
  stepCheck: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: palette.card,
  },
  stepLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: palette.mutedForeground,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  stepLabelActive: {
    color: palette.primary,
    fontFamily: fonts.sansSemiBold,
  },
  stepLabelCompleted: {
    color: palette.primary,
  },
  stepConnector: {
    position: "absolute",
    top: 13,
    left: "50%",
    right: "-50%",
    marginLeft: 14,
    marginRight: 14,
    height: 2,
    backgroundColor: palette.border,
    zIndex: 1,
  },
  stepConnectorCompleted: {
    backgroundColor: palette.primary,
  },

  // Card
  card: {
    // Container styling is handled by Card.
  },
  stepContent: {
    gap: spacing.md,
  },
  fieldError: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: palette.destructive,
    marginTop: -spacing.sm,
    marginBottom: spacing.xs,
  },
  stepTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
    marginBottom: spacing.xs,
  },
  detailsBlock: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  fareLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  fareValue: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.primary,
  },

  // Vehicle & size selectors
  vehicleRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  vehicleCard: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    backgroundColor: palette.card,
  },
  vehicleCardActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  vehicleLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  vehicleLabelActive: {
    color: palette.primary,
  },
  vehicleHint: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: palette.mutedForeground,
    textAlign: "center",
  },
  categoryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  categoryChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    backgroundColor: palette.card,
  },
  categoryChipActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primary,
  },
  categoryChipText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.foreground,
  },
  categoryChipTextActive: {
    color: palette.primaryForeground,
  },
  dimensionToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
  },
  dimensionToggleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.primary,
  },
  dimensionRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  dimensionInput: {
    flex: 1,
  },
  fareCard: {
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  fareCardTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.mutedForeground,
    marginBottom: spacing.xs,
  },
  fareRowLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  fareRowValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  fareTotalRow: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  fareTotalLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.foreground,
  },
  fareTotalValue: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.primary,
  },

  // Review summary
  summaryCard: {
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.xs,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  editText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primary,
  },
  summaryAddress: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.foreground,
    lineHeight: 20,
  },
  summaryExtra: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
    lineHeight: 18,
  },
  reviewFareCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: palette.primarySoft,
  },
  reviewFareLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  reviewFareValue: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.primary,
  },
  paymentBlock: {
    gap: spacing.xs,
  },
  paymentToggle: {
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: radii.lg,
  },
  toggleButtonActive: {
    backgroundColor: palette.card,
    ...shadows.card,
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
  toggleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  toggleTextActive: {
    color: palette.foreground,
  },
  toggleTextDisabled: {
    color: palette.mutedForeground,
  },
  paymentHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
  },

  // Footer
  scrollView: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backButtonDisabled: {
    opacity: 0.4,
  },
  backButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  backButtonTextDisabled: {
    color: palette.mutedForeground,
  },
  footerCta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  footerFare: {
    alignItems: "flex-end",
  },
  footerFareLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  footerFareValue: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.primary,
  },
  ctaButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lift,
  },
  ctaButtonPressed: {
    opacity: 0.88,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },

  // Past sends
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: palette.foreground,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.md,
  },
  recentSection: {
    marginTop: spacing.lg,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  seeAllText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primary,
  },
  recentList: {
    gap: spacing.sm,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    // Container styling is handled by CardPressable.
  },
  recentMain: {
    flex: 1,
    gap: 2,
  },
  recentId: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  recentMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
  },
});
