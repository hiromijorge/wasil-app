import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import type { Database } from "../lib/database.types";
import type { CartItem } from "../lib/cart-context";
import type { GeoLocation } from "../components/LocationButton";

export type DeliveryDetails = {
  contactName?: string;
  buildingFloor?: string;
  notes?: string;
};

export type CreateOrderInput = {
  storeId: string;
  items: CartItem[];
  deliveryType: "delivery" | "pickup";
  deliveryFeeSar: number;
  subtotalSar: number;
  phone: string;
  address?: string;
  deliveryLocation?: GeoLocation | null;
  deliveryDetails?: DeliveryDetails;
  notes?: string;
  paymentMethod?: "bank_transfer" | "cash";
};

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function fetchCommissionRate() {
  const { data, error } = await supabase
    .from("platform_config")
    .select("commission_percent, minimum_commission_sar")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { percent: 3, minimum: 0.5 };
  }

  return {
    percent: data.commission_percent ?? 3,
    minimum: data.minimum_commission_sar ?? 0.5,
  };
}

function calculateCommission(
  subtotal: number,
  rate: { percent: number; minimum: number }
) {
  return Math.max(
    rate.minimum,
    Math.round((subtotal * rate.percent) / 100 * 100) / 100
  );
}

export function useCreateOrder() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createOrder = useCallback(
    async (input: CreateOrderInput): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const customerId = user?.id ?? null;
        const orderId = uuidv4();

        const rate = await fetchCommissionRate();
        const commissionSar = calculateCommission(input.subtotalSar, rate);

        const itemsJson = input.items.map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          price_sar: item.product.price,
          quantity: item.quantity,
          image:
            typeof item.product.image === "string"
              ? item.product.image
              : item.product.image?.uri ?? null,
        }));

        const orderInsert: OrderInsert = {
          id: orderId,
          customer_id: customerId,
          store_id: input.storeId,
          status: "new",
          customer_payment_status: "pending",
          delivery_type: input.deliveryType,
          delivery_fee_sar: input.deliveryFeeSar,
          subtotal_sar: input.subtotalSar,
          commission_sar: commissionSar,
          delivery_fee: input.deliveryFeeSar,
          subtotal: input.subtotalSar,
          total: input.subtotalSar + input.deliveryFeeSar,
          items: itemsJson,
          phone: input.phone,
          address: input.address ?? null,
          delivery_location: input.deliveryLocation
            ? {
                address: input.deliveryLocation.address,
                lat: input.deliveryLocation.lat,
                lng: input.deliveryLocation.lng,
              }
            : null,
          delivery_details: input.deliveryDetails
            ? {
                contact_name: input.deliveryDetails.contactName ?? null,
                building_floor: input.deliveryDetails.buildingFloor ?? null,
                notes: input.deliveryDetails.notes ?? null,
              }
            : null,
          notes: input.notes ?? null,
          payment_method:
            input.deliveryType === "pickup"
              ? "bank_transfer"
              : (input.paymentMethod ?? "bank_transfer"),
        };

        const { error: insertError } = await supabase
          .from("orders")
          .insert(orderInsert);

        if (insertError) {
          throw new Error(`Order creation failed: ${insertError.message}`);
        }

        return orderId;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  return { createOrder, isLoading, error };
}
