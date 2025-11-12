import { api } from "./client";
import type { Order } from "../types";

export async function createOrder(
  items: { dish_id: number; quantity: number }[]
) {
  const { data } = await api.post<Order>("/api/orders/", { items });
  return data;
}

export async function getMyOrders() {
  const { data } = await api.get<Order[]>("/api/orders/");
  return data;
}
