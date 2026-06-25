import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getParcelFare, type VehicleType } from "./useParcelEstimate";
import { haversineKm } from "../lib/geo";
import { useAuth } from "../lib/auth-context";
import { usePlatformConfig } from "./usePlatformConfig";
import type { Database } from "../lib/database.types";
import type { GeoLocation } from "../components/LocationButton";

type ParcelRow = Database["public"]["Tables"]["parcel_deliveries"]["Row"];

export type ParcelLocationDetails = {
  contactName?: string;
  phone?: string;
  buildingFloor?: string;
  notes?: string;
};

export type ParcelForm = {
  pickupAddress: string;
  dropoffAddress: string;
  receiverName: string;
  receiverPhone: string;
  itemDescription: string;
  itemCategory: string;
  weightKg: string;
  notes: string;
  pickupLocation?: GeoLocation | null;
  dropoffLocation?: GeoLocation | null;
  pickupDetails?: ParcelLocationDetails;
  dropoffDetails?: ParcelLocationDetails;
  vehicleType: VehicleType;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  paymentMethod: "bank_transfer" | "cash";
  cashPayer: "sender" | "receiver";
};

export function useCreateParcel() {
  const { user } = useAuth();
  const { data: config } = usePlatformConfig();
  const [isLoading, setIsLoading] = useState(false);

  const create = useCallback(async (form: ParcelForm) => {
    if (!user) {
      return { data: null, error: new Error("User not authenticated") };
    }
    setIsLoading(true);

    const weight = parseFloat(form.weightKg) || 1;
    const lengthCm = form.lengthCm ? parseFloat(form.lengthCm) : undefined;
    const widthCm = form.widthCm ? parseFloat(form.widthCm) : undefined;
    const heightCm = form.heightCm ? parseFloat(form.heightCm) : undefined;

    const pickupLat = form.pickupLocation?.lat;
    const pickupLng = form.pickupLocation?.lng;
    const dropoffLat = form.dropoffLocation?.lat;
    const dropoffLng = form.dropoffLocation?.lng;

    const distanceKm =
      pickupLat && pickupLng && dropoffLat && dropoffLng
        ? Math.round(haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng) * 10) / 10
        : null;

    const fareBreakdown = getParcelFare({
      weightKg: weight,
      distanceKm: distanceKm ?? undefined,
      vehicleType: form.vehicleType,
      lengthCm,
      widthCm,
      heightCm,
      config: config ?? undefined,
    });

    const driverFeePercent = config?.parcel_driver_fee_percent ?? 70;
    const driverFeeSar = Math.round(fareBreakdown.total * (driverFeePercent / 100) * 100) / 100;

    const { data, error } = await supabase
      .from("parcel_deliveries")
      .insert({
        sender_id: user.id,
        pickup_location: {
          address: form.pickupAddress.trim(),
          lat: pickupLat ?? null,
          lng: pickupLng ?? null,
        },
        dropoff_location: {
          address: form.dropoffAddress.trim(),
          lat: dropoffLat ?? null,
          lng: dropoffLng ?? null,
        },
        pickup_details: form.pickupDetails
          ? {
              contact_name: form.pickupDetails.contactName ?? null,
              phone: form.pickupDetails.phone ?? null,
              building_floor: form.pickupDetails.buildingFloor ?? null,
              notes: form.pickupDetails.notes ?? null,
            }
          : null,
        dropoff_details: form.dropoffDetails
          ? {
              receiver_name: form.receiverName.trim() || null,
              phone: form.receiverPhone.trim() || null,
              building_floor: form.dropoffDetails.buildingFloor ?? null,
              notes: form.dropoffDetails.notes ?? null,
            }
          : null,
        receiver_name: form.receiverName.trim(),
        receiver_phone: form.receiverPhone.trim(),
        item_description: form.itemDescription.trim(),
        item_category: form.itemCategory.trim() || null,
        weight_kg: weight,
        fare_sar: fareBreakdown.total,
        driver_fee_sar: driverFeeSar,
        payment_method: form.paymentMethod ?? "bank_transfer",
        cash_payer: form.paymentMethod === "cash" ? form.cashPayer : null,
        notes: form.notes.trim() || null,
        distance_km: distanceKm,
        vehicle_type: form.vehicleType,
        length_cm: lengthCm ?? null,
        width_cm: widthCm ?? null,
        height_cm: heightCm ?? null,
        volumetric_weight_kg:
          lengthCm && widthCm && heightCm
            ? (lengthCm * widthCm * heightCm) /
              (config?.parcel_volumetric_divisor ?? 5000)
            : null,
        fare_breakdown: fareBreakdown,
      })
      .select()
      .single();

    setIsLoading(false);
    return { data: data as ParcelRow | null, error };
  }, [user?.id, config]);

  return { create, isLoading };
}
