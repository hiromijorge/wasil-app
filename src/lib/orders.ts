// Local order service mirroring souqly-yemen-connect.
// In the future this will be replaced by Supabase orders/billing_transactions.

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Order, OrderStatus } from "./demo-data";

export type { Order, OrderStatus };

const ORDERS_KEY = "wasil-orders";
const PENDING_NOTIFICATION_KEY = "wasil-pending-notification";

export async function getOrders(): Promise<Order[]> {
  const raw = await AsyncStorage.getItem(ORDERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getOrdersByStore(storeId: string): Promise<Order[]> {
  const orders = await getOrders();
  return orders.filter((o) => o.storeId === storeId).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrder(id: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export async function saveOrders(orders: Order[]): Promise<void> {
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export async function createOrder(order: Omit<Order, "id" | "createdAt">): Promise<Order> {
  const orders = await getOrders();
  const newOrder: Order = {
    ...order,
    id: generateOrderId(orders),
    createdAt: new Date().toISOString(),
  };
  await saveOrders([newOrder, ...orders]);
  await setPendingNotification(newOrder.id);
  return newOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const orders = await getOrders();
  const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
  await saveOrders(updated);
}

export async function setPendingNotification(orderId: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_NOTIFICATION_KEY, orderId);
}

export async function consumePendingNotification(): Promise<string | null> {
  const id = await AsyncStorage.getItem(PENDING_NOTIFICATION_KEY);
  if (id) {
    await AsyncStorage.removeItem(PENDING_NOTIFICATION_KEY);
  }
  return id;
}

function generateOrderId(orders: Order[]): string {
  const count = orders.length + 1;
  return `ORD-${String(count).padStart(3, "0")}`;
}
