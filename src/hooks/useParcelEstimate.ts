import { useMemo } from "react";
import type { Database } from "../lib/database.types";

export type VehicleType = "bike" | "car" | "van";

export type FareBreakdown = {
  baseFare: number;
  distanceCharge: number;
  weightCharge: number;
  vehicleMultiplier: number;
  total: number;
};

type ConfigRow = Database["public"]["Tables"]["platform_config"]["Row"];

export const DEFAULT_PARCEL_CONFIG: Pick<
  ConfigRow,
  | "parcel_base_fare_sar"
  | "parcel_per_km_rate_sar"
  | "parcel_per_kg_rate_sar"
  | "parcel_volumetric_divisor"
  | "minimum_parcel_fare_sar"
  | "parcel_bike_multiplier"
  | "parcel_car_multiplier"
  | "parcel_van_multiplier"
> = {
  parcel_base_fare_sar: 15,
  parcel_per_km_rate_sar: 2,
  parcel_per_kg_rate_sar: 3,
  parcel_volumetric_divisor: 5000,
  minimum_parcel_fare_sar: 15,
  parcel_bike_multiplier: 1,
  parcel_car_multiplier: 1.5,
  parcel_van_multiplier: 2.5,
};

export function getVehicleMultiplier(
  vehicleType: VehicleType | undefined | null,
  config: Partial<ConfigRow> = {}
) {
  switch (vehicleType) {
    case "car":
      return config.parcel_car_multiplier ?? DEFAULT_PARCEL_CONFIG.parcel_car_multiplier;
    case "van":
      return config.parcel_van_multiplier ?? DEFAULT_PARCEL_CONFIG.parcel_van_multiplier;
    case "bike":
    default:
      return config.parcel_bike_multiplier ?? DEFAULT_PARCEL_CONFIG.parcel_bike_multiplier;
  }
}

export function getParcelFare({
  weightKg,
  distanceKm,
  vehicleType,
  lengthCm,
  widthCm,
  heightCm,
  config,
}: {
  weightKg: number;
  distanceKm?: number;
  vehicleType?: VehicleType | null;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  config?: Partial<ConfigRow>;
}): FareBreakdown {
  const baseFare = config?.parcel_base_fare_sar ?? DEFAULT_PARCEL_CONFIG.parcel_base_fare_sar;
  const perKmRate = config?.parcel_per_km_rate_sar ?? DEFAULT_PARCEL_CONFIG.parcel_per_km_rate_sar;
  const perKgRate = config?.parcel_per_kg_rate_sar ?? DEFAULT_PARCEL_CONFIG.parcel_per_kg_rate_sar;
  const volumetricDivisor =
    config?.parcel_volumetric_divisor ?? DEFAULT_PARCEL_CONFIG.parcel_volumetric_divisor;
  const minimumFare =
    config?.minimum_parcel_fare_sar ?? DEFAULT_PARCEL_CONFIG.minimum_parcel_fare_sar;
  const vehicleMultiplier = getVehicleMultiplier(vehicleType, config);

  const actualWeight = Math.max(0, weightKg || 0);
  const hasDimensions = lengthCm && widthCm && heightCm;
  const volumetricWeight = hasDimensions
    ? (lengthCm * widthCm * heightCm) / volumetricDivisor
    : 0;
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  const adjustedBase = baseFare * vehicleMultiplier;
  const distanceCharge = Math.max(0, distanceKm ?? 0) * perKmRate;
  const weightCharge = chargeableWeight * perKgRate;
  const total = Math.max(minimumFare, adjustedBase + distanceCharge + weightCharge);

  return {
    baseFare: adjustedBase,
    distanceCharge,
    weightCharge,
    vehicleMultiplier,
    total,
  };
}

export function useParcelEstimate({
  weightKg,
  distanceKm,
  vehicleType,
  lengthCm,
  widthCm,
  heightCm,
  config,
}: {
  weightKg: number;
  distanceKm?: number;
  vehicleType?: VehicleType | null;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  config?: Partial<ConfigRow> | null;
}) {
  return useMemo(
    () =>
      getParcelFare({
        weightKg,
        distanceKm,
        vehicleType,
        lengthCm,
        widthCm,
        heightCm,
        config: config ?? undefined,
      }),
    [weightKg, distanceKm, vehicleType, lengthCm, widthCm, heightCm, config]
  );
}
