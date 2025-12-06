import { api } from "./client";
import type { Order, OrderStatus } from "../types";

type ApiOrder = {
  id: number;
  status: "NEW" | "IN_PROGRESS" | "COMPLETED";
  date: string;
  sums: string | number;
  items: {
    dish: number;
    quantity: number;
    price: string | number;
    dish_name: string;
  }[];
};

function mapStatus(status: ApiOrder["status"]): OrderStatus {
  switch (status) {
    case "NEW":
      return "new";
    case "IN_PROGRESS":
      return "processing";
    case "COMPLETED":
      return "ready";
    default:
      return "new";
  }
}

export async function createOrder(
  items: { dish_id: number; quantity: number }[]
) {
  const payload = {
    items: items.map((i) => ({
      dish: i.dish_id,
      quantity: i.quantity,
    })),
  };

  const { data } = await api.post<ApiOrder>("/api/orders/", payload);
  return data;
}

export async function getMyOrders(): Promise<Order[]> {
  const { data } = await api.get<ApiOrder[]>("/api/orders/");
  return data.map((o) => ({
    id: o.id,
    status: mapStatus(o.status),
    total: Number(o.sums),
    created_at: o.date,
    items: [],
  }));
}
