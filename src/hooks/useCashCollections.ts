import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ParcelRow = Database["public"]["Tables"]["parcel_deliveries"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

export type CashOrder = OrderRow & {
  driver_id: string;
  driver_name: string | null;
  store_name: string | null;
};

export type CashParcel = ParcelRow & {
  driver_id: string;
  driver_name: string | null;
  sender_name: string | null;
};

export type DriverCashSummary = {
  driver_id: string;
  driver_name: string | null;
  orders: CashOrder[];
  parcels: CashParcel[];
  total_collected_sar: number;
  driver_fee_sar: number;
  remittance_due_sar: number;
  unsettled_balance_sar: number;
  period_start: string | null;
  period_end: string | null;
};

export function useCashCollections() {
  const [data, setData] = useState<DriverCashSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ data: deliveryRows }, { data: parcelRows }] = await Promise.all([
        supabase
          .from("deliveries")
          .select(
            `*,
            orders!inner(*, store:store_id(name)),
            driver:driver_id(full_name)`
          )
          .eq("orders.payment_method", "cash")
          .not("orders.cash_collected_sar", "is", null)
          .order("orders.cash_collected_at", { ascending: false }),
        supabase
          .from("parcel_deliveries")
          .select(
            `*,
            sender:sender_id(full_name),
            driver:driver_id(full_name)`
          )
          .eq("payment_method", "cash")
          .not("cash_collected_sar", "is", null)
          .order("cash_collected_at", { ascending: false }),
      ]);

      const orders: CashOrder[] = (deliveryRows ?? []).map((d: any) => ({
        ...(d.orders as OrderRow),
        driver_id: d.driver_id as string,
        driver_name: (d.driver as ProfileRow | null)?.full_name ?? null,
        store_name: (d.orders?.store as StoreRow | null)?.name ?? null,
      }));

      const parcels: CashParcel[] = (parcelRows ?? []).map((p: any) => ({
        ...(p as ParcelRow),
        driver_id: p.driver_id as string,
        driver_name: (p.driver as ProfileRow | null)?.full_name ?? null,
        sender_name: (p.sender as ProfileRow | null)?.full_name ?? null,
      }));

      const byDriver = new Map<string, DriverCashSummary>();

      for (const o of orders) {
        const summary = byDriver.get(o.driver_id) ?? {
          driver_id: o.driver_id,
          driver_name: o.driver_name,
          orders: [],
          parcels: [],
          total_collected_sar: 0,
          driver_fee_sar: 0,
          remittance_due_sar: 0,
          unsettled_balance_sar: 0,
          period_start: null,
          period_end: null,
        };
        summary.orders.push(o);
        summary.total_collected_sar += Number(o.cash_collected_sar ?? 0);
        summary.driver_fee_sar += Number(o.delivery_fee_sar ?? 0);
        summary.period_start = earlier(summary.period_start, o.cash_collected_at);
        summary.period_end = later(summary.period_end, o.cash_collected_at);
        byDriver.set(o.driver_id, summary);
      }

      for (const p of parcels) {
        const summary = byDriver.get(p.driver_id) ?? {
          driver_id: p.driver_id,
          driver_name: p.driver_name,
          orders: [],
          parcels: [],
          total_collected_sar: 0,
          driver_fee_sar: 0,
          remittance_due_sar: 0,
          unsettled_balance_sar: 0,
          period_start: null,
          period_end: null,
        };
        summary.parcels.push(p);
        summary.total_collected_sar += Number(p.cash_collected_sar ?? 0);
        summary.driver_fee_sar += Number(p.driver_fee_sar ?? 0);
        summary.period_start = earlier(summary.period_start, p.cash_collected_at);
        summary.period_end = later(summary.period_end, p.cash_collected_at);
        byDriver.set(p.driver_id, summary);
      }

      const summaries = Array.from(byDriver.values());
      await Promise.all(
        summaries.map(async (s) => {
          const { data: balance } = await supabase.rpc("driver_unsettled_cod_balance", {
            p_driver_id: s.driver_id,
          });
          s.unsettled_balance_sar = Number(balance ?? 0);
          s.remittance_due_sar = Math.max(0, s.total_collected_sar - s.driver_fee_sar);
        })
      );

      setData(summaries.sort((a, b) => b.unsettled_balance_sar - a.unsettled_balance_sar));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const settle = useCallback(
    async (driverId: string, amountSar: number, settledBy: string) => {
      const summary = data.find((d) => d.driver_id === driverId);
      const now = new Date().toISOString();
      const { error } = await supabase.from("driver_cash_settlements").insert({
        driver_id: driverId,
        period_start: summary?.period_start ?? now,
        period_end: summary?.period_end ?? now,
        cash_collected_sar: summary?.total_collected_sar ?? amountSar,
        driver_fee_sar: summary?.driver_fee_sar ?? 0,
        remitted_sar: amountSar,
        status: "settled",
        settled_at: now,
        settled_by: settledBy,
      });
      if (!error) await fetch();
      return { error };
    },
    [data, fetch]
  );

  return { data, isLoading, refresh: fetch, settle };
}

function earlier(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function later(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
