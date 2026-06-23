import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getParcelFare } from "./useParcelEstimate";
import type { Database } from "../lib/database.types";

type ParcelRow = Database["public"]["Tables"]["parcel_deliveries"]["Row"];

export type ParcelForm = {
  pickupAddress: string;
  dropoffAddress: string;
  receiverName: string;
  receiverPhone: string;
  itemDescription: string;
  itemCategory: string;
  weightKg: string;
  notes: string;
};

export function useCreateParcel() {
  const [isLoading, setIsLoading] = useState(false);

  const create = useCallback(async (form: ParcelForm) => {
    setIsLoading(true);
    const weight = parseFloat(form.weightKg) || 1;
    const fare = getParcelFare(weight);

    const { data, error } = await supabase
      .from("parcel_deliveries")
      .insert({
        pickup_location: { address: form.pickupAddress.trim() },
        dropoff_location: { address: form.dropoffAddress.trim() },
        receiver_name: form.receiverName.trim(),
        receiver_phone: form.receiverPhone.trim(),
        item_description: form.itemDescription.trim(),
        item_category: form.itemCategory.trim() || null,
        weight_kg: weight,
        fare_sar: fare,
        notes: form.notes.trim() || null,
      })
      .select()
      .single();

    setIsLoading(false);
    return { data: data as ParcelRow | null, error };
  }, []);

  return { create, isLoading };
}
