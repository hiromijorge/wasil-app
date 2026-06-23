import { useMemo } from "react";

const BASE_FARE_SAR = 15;
const PER_KG_SAR = 3;

export function getParcelFare(weightKg: number) {
  const weight = Math.max(0, weightKg || 0);
  return BASE_FARE_SAR + weight * PER_KG_SAR;
}

export function useParcelEstimate(weightKg: number) {
  return useMemo(() => getParcelFare(weightKg), [weightKg]);
}
