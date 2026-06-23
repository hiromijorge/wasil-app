import { useCallback, useEffect, useState } from "react";
import {
  getOrders,
  getOrdersByStore,
  saveOrders,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from "../lib/orders";
import { demoMerchantStoreId, initialOrders } from "../lib/demo-data";

export function useOrders(storeId?: string) {
  const [data, setData] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    let orders = storeId ? await getOrdersByStore(storeId) : await getOrders();

    if (storeId === demoMerchantStoreId && orders.length === 0) {
      const seeded = initialOrders.filter((o) => o.storeId === demoMerchantStoreId);
      await saveOrders(seeded);
      orders = seeded;
    }

    setData(orders);
    setIsLoading(false);
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      await updateOrderStatus(id, status);
      await refresh();
    },
    [refresh]
  );

  return { data, isLoading, refresh, updateStatus };
}
