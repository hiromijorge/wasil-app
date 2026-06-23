import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useMerchantStore } from "./useMerchantStore";
import type { Database } from "../lib/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type Conversation = {
  customer_id: string;
  customer_name: string;
  last_message: MessageRow;
  unread_count: number;
};

export function useMerchantConversations() {
  const { data: store } = useMerchantStore();
  const [data, setData] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!store?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (error || !messages) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const customerIds = Array.from(new Set(messages.map((m) => m.customer_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", customerIds);

    const nameById = new Map<string, string>();
    (profiles ?? []).forEach((p) => nameById.set(p.id, (p as ProfileRow).full_name ?? "Customer"));

    const byCustomer = new Map<string, MessageRow[]>();
    messages.forEach((m) => {
      const list = byCustomer.get(m.customer_id) ?? [];
      list.push(m);
      byCustomer.set(m.customer_id, list);
    });

    const conversations: Conversation[] = Array.from(byCustomer.entries()).map(
      ([customer_id, msgs]) => ({
        customer_id,
        customer_name: nameById.get(customer_id) ?? "Customer",
        last_message: msgs[0],
        unread_count: msgs.filter(
          (m) => m.sender_role === "customer" && !m.read_at
        ).length,
      })
    );

    setData(conversations);
    setIsLoading(false);
  }, [store?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, refresh };
}
